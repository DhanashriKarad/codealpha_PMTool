import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskModal = ({ task, projectId, users, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [taskData, setTaskData] = useState(task);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTaskData(task);
      fetchComments();
    }
  }, [task]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/tasks/${task.id}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${taskData.id}`,
        taskData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onUpdate(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${taskData.id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments([...comments, response.data]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/tasks/${taskData.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onDelete(taskData.id);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  if (!task) return null;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isEditing ? (
              <input
                type="text"
                value={taskData.title}
                onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                style={styles.editInput}
                placeholder="Task title"
              />
            ) : (
              task.title
            )}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>

        <div style={styles.content}>
          <div style={styles.mainSection}>
            <div style={styles.taskInfo}>
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                {isEditing ? (
                  <textarea
                    value={taskData.description || ''}
                    onChange={(e) => setTaskData({...taskData, description: e.target.value})}
                    style={styles.textarea}
                    placeholder="Add description..."
                    rows="4"
                  />
                ) : (
                  <p style={styles.description}>
                    {task.description || 'No description provided'}
                  </p>
                )}
              </div>

              <div style={styles.detailsGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Status</label>
                  {isEditing ? (
                    <select
                      value={taskData.status}
                      onChange={(e) => setTaskData({...taskData, status: e.target.value})}
                      style={styles.select}
                    >
                      <option value="todo">To Do</option>
                      <option value="doing">Doing</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <span style={styles.status}>{task.status.toUpperCase()}</span>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Priority</label>
                  {isEditing ? (
                    <select
                      value={taskData.priority}
                      onChange={(e) => setTaskData({...taskData, priority: e.target.value})}
                      style={styles.select}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <span style={{
                      ...styles.priorityBadge,
                      backgroundColor: getPriorityColor(task.priority)
                    }}>
                      {task.priority.toUpperCase()}
                    </span>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Assigned To</label>
                  {isEditing ? (
                    <select
                      value={taskData.assigned_to || ''}
                      onChange={(e) => setTaskData({...taskData, assigned_to: e.target.value || null})}
                      style={styles.select}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>
                      {task.assigned_to_name || 'Unassigned'}
                    </span>
                  )}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Due Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={taskData.due_date ? taskData.due_date.split('T')[0] : ''}
                      onChange={(e) => setTaskData({...taskData, due_date: e.target.value})}
                      style={styles.input}
                    />
                  ) : (
                    <span>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </span>
                  )}
                </div>
              </div>

              <div style={styles.meta}>
                <span style={styles.metaItem}>
                  Created by: {task.created_by_name}
                </span>
                <span style={styles.metaItem}>
                  Created: {new Date(task.created_at).toLocaleDateString()}
                </span>
                <span style={styles.metaItem}>
                  Last updated: {new Date(task.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={styles.commentsSection}>
              <h3 style={styles.commentsTitle}>Comments ({comments.length})</h3>
              
              <div style={styles.commentsList}>
                {comments.map(comment => (
                  <div key={comment.id} style={styles.comment}>
                    <div style={styles.commentHeader}>
                      <div style={styles.commentAuthor}>
                        <span style={styles.commentAvatar}>
                          {comment.user_name?.charAt(0)}
                        </span>
                        <span style={styles.commentName}>{comment.user_name}</span>
                      </div>
                      <span style={styles.commentTime}>
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p style={styles.commentContent}>{comment.content}</p>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <p style={styles.noComments}>No comments yet</p>
                )}
              </div>

              <form onSubmit={handleAddComment} style={styles.commentForm}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={styles.commentInput}
                  rows="3"
                  required
                />
                <button type="submit" style={styles.commentButton}>
                  Add Comment
                </button>
              </form>
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          {isEditing ? (
            <>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={styles.saveButton}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                style={styles.editButton}
              >
                ✏️ Edit Task
              </button>
              <button
                onClick={handleDeleteTask}
                style={styles.deleteButton}
              >
                🗑️ Delete Task
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '900px',
    maxWidth: '95%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '1px solid #e9ecef',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    borderBottom: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    borderRadius: '16px 16px 0 0',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  editInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '28px',
    border: '2px solid #007bff',
    borderRadius: '8px',
    fontFamily: 'inherit',
    fontWeight: '600',
    outline: 'none',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '32px',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '8px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  content: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  mainSection: {
    display: 'flex',
    gap: '30px',
  },
  taskInfo: {
    flex: 1,
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: '600',
    color: '#555',
  },
  description: {
    margin: 0,
    lineHeight: '1.5',
    color: '#333',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  status: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#e7f5ff',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  priorityBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  meta: {
    marginTop: '20px',
    paddingTop: '15px',
    borderTop: '1px solid #eee',
    fontSize: '12px',
    color: '#777',
  },
  metaItem: {
    display: 'block',
    marginBottom: '5px',
  },
  commentsSection: {
    flex: 1,
    minWidth: '300px',
  },
  commentsTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
  },
  commentsList: {
    maxHeight: '300px',
    overflowY: 'auto',
    marginBottom: '20px',
    paddingRight: '10px',
  },
  comment: {
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #f0f0f0',
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  commentAuthor: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  commentAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  commentName: {
    fontWeight: '600',
    fontSize: '14px',
  },
  commentTime: {
    fontSize: '11px',
    color: '#999',
  },
  commentContent: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#333',
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: '20px 0',
  },
  commentForm: {
    marginTop: '20px',
  },
  commentInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    resize: 'vertical',
    marginBottom: '10px',
  },
  commentButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  editButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default TaskModal;