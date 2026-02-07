import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [weather, setWeather] = useState({ temp: 27, condition: 'Sunny' });

  useEffect(() => {
    fetchProjects();
    // Simulate weather data (in real app, fetch from API)
    setWeather({ temp: 27, condition: 'Sunny' });
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.get('http://localhost:5000/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('userToken');
      const response = await axios.post(
        'http://localhost:5000/api/projects',
        newProject,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProjects([response.data, ...projects]);
      setNewProject({ name: '', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>
          <div style={styles.skeleton} />
          <div style={styles.skeleton} />
          <div style={styles.skeleton} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.backgroundOverlay}></div>
        <div style={styles.content}>
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <h1 style={styles.title}>My Projects</h1>
              <div style={styles.weatherWidget}>
                <span style={styles.weatherIcon}>☀️</span>
                <span style={styles.weatherText}>{weather.temp}°C {weather.condition}</span>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={styles.fab}
              title="New Project"
            >
              <span style={styles.fabIcon}>+</span>
            </button>
          </div>

          {showForm && (
            <div style={styles.modal}>
              <div style={styles.modalContent}>
                <h3 style={styles.modalTitle}>Create New Project</h3>
                <form onSubmit={handleCreateProject}>
                  <div className="form-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={newProject.description}
                      onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                      placeholder="Enter project description"
                    />
                  </div>
                  <div style={styles.formButtons}>
                    <button type="submit" className="btn btn-primary">
                      Create Project
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {projects.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <h3>No projects yet</h3>
              <p>Create your first project to get started!</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
                style={styles.emptyButton}
              >
                Create Project
              </button>
            </div>
          ) : (
            <div style={styles.projectGrid}>
              {projects.map(project => (
                <Link
                  to={`/project/${project.id}`}
                  key={project.id}
                  style={styles.projectCard}
                >
                  <div className="card" style={styles.cardContent}>
                    <div style={styles.cardHeader}>
                      <h3 style={styles.projectTitle}>{project.name}</h3>
                      <div style={styles.projectIcon}>📁</div>
                    </div>
                    <p style={styles.projectDesc}>{project.description}</p>
                    <div style={styles.projectMeta}>
                      <span style={styles.owner}>
                        <span style={styles.ownerIcon}>👤</span>
                        {project.owner_name}
                      </span>
                      <span style={styles.date}>
                        <span style={styles.dateIcon}>📅</span>
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.viewButton}>
                      <span>View Project</span>
                      <span style={styles.arrowIcon}>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: `url('https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-4.0&auto=format&fit=crop&w=2069&q=80')`,
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
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--text-color)',
    margin: 0,
  },
  weatherWidget: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--card-color)',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    backdropFilter: 'blur(10px)',
  },
  weatherIcon: {
    fontSize: '20px',
  },
  weatherText: {
    fontSize: '14px',
    color: 'var(--text-color)',
    fontWeight: '500',
  },
  fab: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'var(--primary-color)',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
    transition: 'all 0.3s ease',
    animation: 'bounce 2s infinite',
  },
  fabIcon: {
    fontSize: '28px',
    fontWeight: '300',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease',
  },
  modalContent: {
    background: 'var(--card-color)',
    borderRadius: '16px',
    padding: '32px',
    width: '90%',
    maxWidth: '500px',
    border: '1px solid var(--border-color)',
    backdropFilter: 'blur(20px)',
    animation: 'slideIn 0.4s ease',
  },
  modalTitle: {
    marginBottom: '24px',
    color: 'var(--text-color)',
    fontSize: '24px',
    fontWeight: '600',
  },
  formButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    justifyContent: 'flex-end',
  },
  projectGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
  },
  projectCard: {
    textDecoration: 'none',
    color: 'inherit',
    transition: 'all 0.3s ease',
  },
  cardContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
    cursor: 'pointer',
    background: 'rgba(30, 41, 59, 0.95)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  projectTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--text-color)',
    margin: 0,
    flex: 1,
  },
  projectIcon: {
    fontSize: '24px',
    opacity: 0.7,
  },
  projectDesc: {
    color: 'var(--text-muted)',
    marginBottom: '20px',
    flexGrow: 1,
    lineHeight: '1.5',
  },
  projectMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    fontSize: '12px',
  },
  owner: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-muted)',
  },
  ownerIcon: {
    fontSize: '14px',
  },
  date: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-muted)',
  },
  dateIcon: {
    fontSize: '14px',
  },
  viewButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'var(--primary-color)',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  arrowIcon: {
    fontSize: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    background: 'var(--card-color)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    backdropFilter: 'blur(20px)',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.5,
  },
  emptyButton: {
    marginTop: '20px',
  },
  loading: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    padding: '40px 0',
  },
  skeleton: {
    height: '200px',
    borderRadius: '12px',
    animation: 'shimmer 1.5s infinite',
  },
};

export default Dashboard;
