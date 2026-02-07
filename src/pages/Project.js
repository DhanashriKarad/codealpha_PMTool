import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import TaskModal from '../components/TaskModal';
import { useSocket } from '../context/SocketContext';

const Project = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState({ todo: [], doing: [], done: [] });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: ''
  });
  
  const { socket, isConnected, joinProject, leaveProject } = useSocket();

  useEffect(() => {
    fetchProject();
    fetchTasks();
    fetchUsers();
    
    // Join project room via WebSocket
    if (isConnected && id) {
      console.log('Joining project via WebSocket:', id);
      joinProject(id);
    }
    
    // Set up socket listeners
    if (socket) {
      console.log('Setting up WebSocket listeners');
      
      // Listen for new tasks
      socket.on('task-created', (newTask) => {
        console.log('WebSocket: task-created received:', newTask);
        setTasks(prevTasks => {
          const updatedTasks = { ...prevTasks };
          updatedTasks[newTask.status] = [newTask, ...updatedTasks[newTask.status]];
          return updatedTasks;
        });
      });
      
      // Listen for updated tasks
      socket.on('task-updated', (updatedTask) => {
        console.log('WebSocket: task-updated received:', updatedTask);
        setTasks(prevTasks => {
          const updatedTasks = { ...prevTasks };
          // Remove from all statuses
          Object.keys(updatedTasks).forEach(status => {
            updatedTasks[status] = updatedTasks[status].filter(t => t.id !== updatedTask.id);
          });
          // Add to new status (at beginning)
          updatedTasks[updatedTask.status] = [updatedTask, ...updatedTasks[updatedTask.status]];
          return updatedTasks;
        });
        
        // Update selected task if it's the one being edited
        if (selectedTask && selectedTask.id === updatedTask.id) {
          setSelectedTask(updatedTask);
        }
      });
      
      // Listen for deleted tasks
      socket.on('task-deleted', ({ taskId }) => {
        console.log('WebSocket: task-deleted received:', taskId);
        setTasks(prevTasks => {
          const updatedTasks = { ...prevTasks };
          Object.keys(updatedTasks).forEach(status => {
            updatedTasks[status] = updatedTasks[status].filter(t => t.id !== taskId);
          });
          return updatedTasks;
        });
        
        // Close modal if deleted task was selected
        if (selectedTask && selectedTask.id === taskId) {
          setShowTaskModal(false);
          setSelectedTask(null);
        }
      });
      
      // Listen for new comments
      socket.on('comment-added', ({ taskId, comment }) => {
        console.log('WebSocket: comment-added received for task:', taskId);
        // You could update a specific task's comments here
        // For now, just refresh tasks to show updated comment count
        fetchTasks();
      });
      
      // Error handling
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }
    
    // Cleanup
    return () => {
      console.log('Cleaning up WebSocket listeners');
      if (socket) {
        socket.off('task-created');
        socket.off('task-updated');
        socket.off('task-deleted');
        socket.off('comment-added');
        socket.off('error');
      }
      if (isConnected && id) {
        leaveProject(id);
      }
    };
  }, [socket, isConnected, id]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`http://localhost:5000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/dashboard');
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get(`http://localhost:5000/api/projects/${id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken');
      await axios.post(
        `http://localhost:5000/api/projects/${id}/tasks`,
        newTask,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewTask({ title: '', description: '', priority: 'medium', assigned_to: '' });
      setShowTaskForm(false);
      // WebSocket will handle real-time update via 'task-created' event
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task');
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');

    try {
      // OPTIMISTIC UPDATE: Update UI immediately for better UX
      const updatedTasks = { ...tasks };
      let movedTask = null;

      // Find and remove task from old status
      Object.keys(updatedTasks).forEach(status => {
        updatedTasks[status] = updatedTasks[status].filter(task => {
          if (task.id == taskId) {
            movedTask = { ...task, status: newStatus };
            return false; // Remove from old array
          }
          return true;
        });
      });

      // Add to new status (at beginning)
      if (movedTask) {
        updatedTasks[newStatus] = [movedTask, ...updatedTasks[newStatus]];
        setTasks(updatedTasks);
      }

      // Send API request
      const token = localStorage.getItem('userToken');
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`Task ${taskId} moved to ${newStatus}`);
      // WebSocket will handle real-time update for other users via 'task-updated' event

    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on error
      fetchTasks(); // Refresh from server
      alert('Failed to update task status');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  // Debug WebSocket connection
  useEffect(() => {
    console.log('WebSocket status:', { isConnected, socket: !!socket });
  }, [isConnected, socket]);

  if (loading) {
    return (
      <Layout>
        <div className="container" style={styles.loading}>
          <p>Loading project...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.backgroundOverlay}></div>
        <div style={styles.content}>
          {/* Modern Header with WebSocket Status */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.projectInfo}>
                <h1 style={styles.projectTitle}>{project?.name}</h1>
                <p style={styles.projectDescription}>{project?.description}</p>
              </div>
              <div style={styles.websocketStatus}>
                <div style={{
                  ...styles.statusIndicator,
                  backgroundColor: isConnected ? 'var(--success-color)' : 'var(--error-color)'
                }}></div>
                <span style={styles.statusText}>
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.taskCounts}>
                <span style={styles.countBadge}>
                  <span style={styles.countNumber}>{tasks.todo?.length || 0}</span>
                  <span style={styles.countLabel}>To Do</span>
                </span>
                <span style={styles.countBadge}>
                  <span style={styles.countNumber}>{tasks.doing?.length || 0}</span>
                  <span style={styles.countLabel}>Doing</span>
                </span>
                <span style={styles.countBadge}>
                  <span style={styles.countNumber}>{tasks.done?.length || 0}</span>
                  <span style={styles.countLabel}>Done</span>
                </span>
              </div>
              <div style={styles.headerActions}>
                <button
                  onClick={() => navigate(`/project/${id}/members`)}
                  style={styles.secondaryButton}
                >
                  <span style={styles.buttonIcon}>👥</span>
                  Members
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  style={styles.primaryButton}
                >
                  <span style={styles.buttonIcon}>+</span>
                  New Task
                </button>
              </div>
            </div>
          </div>

        {showTaskForm && (
          <div className="card" style={styles.taskForm}>
            <h3>Create New Task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  rows="3"
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formRow}>
                <div className="form-group" style={styles.halfWidth}>
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    style={styles.select}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group" style={styles.halfWidth}>
                  <label>Assign To</label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                    style={styles.select}
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={styles.formButtons}>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTaskForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={styles.board}>
          {['todo', 'doing', 'done'].map((status) => (
            <div 
              key={status}
              style={styles.column}
              onDrop={(e) => handleDrop(e, status)}
              onDragOver={handleDragOver}
            >
              <div style={styles.columnHeader}>
                <h3 style={styles.columnTitle}>
                  {status.toUpperCase()}
                  <span style={styles.taskCount}>{tasks[status]?.length || 0}</span>
                </h3>
              </div>
              <div style={styles.taskList}>
                {tasks[status]?.map(task => (
                  <div
                    key={task.id}
                    className="card"
                    style={styles.taskCard}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleTaskClick(task)}
                    title="Click to view details"
                  >
                    <div style={styles.taskHeader}>
                      <span 
                        style={{
                          ...styles.priorityBadge,
                          backgroundColor: getPriorityColor(task.priority)
                        }}
                      >
                        {task.priority}
                      </span>
                      <span style={styles.taskId}>#{task.id}</span>
                    </div>
                    <h4 style={styles.taskTitle}>{task.title}</h4>
                    <p style={styles.taskDesc}>{task.description}</p>
                    <div style={styles.taskFooter}>
                      {task.assigned_to_name ? (
                        <span style={styles.assignee}>
                          👤 {task.assigned_to_name}
                        </span>
                      ) : (
                        <span style={styles.unassigned}>Unassigned</span>
                      )}
                      {task.due_date && (
                        <span style={styles.dueDate}>
                          📅 {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {tasks[status]?.length === 0 && (
                  <div style={styles.emptyColumn}>
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.projectInfo}>
          <h4 style={styles.projectInfoHeading}>Project Members</h4>
          <div style={styles.memberList}>
            {project?.members?.map(member => (
              <div key={member.id} style={styles.member}>
                <div style={styles.memberAvatar}>
                  {member.name?.charAt(0) || member.username?.charAt(0)}
                </div>
                <div>
                  <div style={styles.memberName}>{member.name}</div>
                  <div style={styles.memberRole}>{member.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showTaskModal && selectedTask && (
          <TaskModal
            task={selectedTask}
            projectId={id}
            users={users}
            onClose={() => {
              setShowTaskModal(false);
              setSelectedTask(null);
            }}
            onUpdate={(updatedTask) => {
              // WebSocket will handle this via 'task-updated' event
              console.log('Task updated via modal:', updatedTask);
            }}
            onDelete={(taskId) => {
              // WebSocket will handle this via 'task-deleted' event
              console.log('Task deleted via modal:', taskId);
            }}
          />
        )}
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: `url('https://images.unsplash.com/photo-1551288049-b71f71c67e77?ixlib=rb-4.0&auto=format&fit=crop&w=2070&q=80')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    position: 'relative',
    animation: 'fadeIn 0.5s ease',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(15, 23, 42, 0.9)',
    backdropFilter: 'blur(3px)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  },
  pageTitle: {
    textAlign: 'center',
    marginBottom: '30px',
    color: 'var(--text-color)',
  },
  header: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  projectInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  projectTitle: {
    margin: '0 0 4px 0',
    fontSize: '28px',
    fontWeight: '600',
    color: 'var(--text-color)',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  },
  projectDescription: {
    margin: 0,
    fontSize: '16px',
    color: 'var(--text-muted)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  websocketStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '20px',
    border: '1px solid #e9ecef',
  },
  statusIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#495057',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
  },
  taskCounts: {
    display: 'flex',
    gap: '12px',
  },
  countBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '12px 16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    minWidth: '60px',
  },
  countNumber: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#007bff',
  },
  countLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,123,255,0.2)',
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#6c757d',
    border: '1px solid #dee2e6',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  buttonIcon: {
    fontSize: '16px',
  },
  taskForm: {
    marginBottom: '30px',
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  formRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
  },
  halfWidth: {
    flex: 1,
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  column: {
    background: 'rgba(30, 41, 59, 0.95)',
    borderRadius: '12px',
    padding: '20px',
    minHeight: '600px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(10px)',
  },
  columnHeader: {
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  columnTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-color)',
    margin: 0,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  taskCount: {
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '12px',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '24px',
    textAlign: 'center',
  },
  taskList: {
    flex: 1,
    minHeight: '400px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  taskCard: {
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  taskCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  priorityBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    color: 'white',
    textTransform: 'uppercase',
  },
  taskId: {
    fontSize: '11px',
    color: '#999',
  },
  taskTitle: {
    marginBottom: '5px',
    fontSize: '14px',
    color: 'var(--text-color)',
    fontWeight: '600',
    fontFamily: 'Poppins, sans-serif',
  },
  taskDesc: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginBottom: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  taskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: '#888',
  },
  assignee: {
    backgroundColor: '#e7f5ff',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  unassigned: {
    backgroundColor: '#f8f9fa',
    padding: '2px 6px',
    borderRadius: '10px',
    color: '#999',
  },
  dueDate: {
    backgroundColor: '#fff3cd',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  emptyColumn: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
    fontStyle: 'italic',
  },
  projectInfo: {
    marginTop: '40px',
  },
  projectInfoHeading: {
    color: 'white',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '16px',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  memberList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    marginTop: '15px',
  },
  member: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  memberAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
  },
  memberName: {
    fontWeight: '500',
    color: '#1e3a8a',
  },
  memberRole: {
    fontSize: '12px',
    color: 'black',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
  },
};

export default Project;