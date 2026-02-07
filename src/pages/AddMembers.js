import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';

const AddMembers = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers();
    fetchProjectMembers();
  }, [id]);

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProjectMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectMembers(response.data.members || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/projects/${id}/members`,
        { userId: selectedUser },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Member added successfully!');
      setSelectedUser('');
      fetchProjectMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      alert(error.response?.data?.message || 'Failed to add member');
    }
  };

  // Filter out users who are already members
  const availableUsers = allUsers.filter(
    user => !projectMembers.some(member => member.id === user.id)
  );

  if (loading) {
    return (
      <Layout>
        <div className="container" style={styles.loading}>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">
        <div style={styles.header}>
          <h2>Manage Project Members</h2>
          <button 
            onClick={() => navigate(`/project/${id}`)}
            className="btn btn-secondary"
          >
            ← Back to Project
          </button>
        </div>

        <div style={styles.content}>
          <div className="card" style={styles.formCard}>
            <h3>Add New Member</h3>
            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label>Select User to Add</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  style={styles.select}
                  required
                >
                  <option value="">-- Select a user --</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.username}) - {user.email}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={styles.addButton}>
                Add to Project
              </button>
            </form>
          </div>

          <div className="card" style={styles.membersCard}>
            <h3>Current Members ({projectMembers.length})</h3>
            {projectMembers.length === 0 ? (
              <p style={styles.noMembers}>No members yet</p>
            ) : (
              <div style={styles.memberList}>
                {projectMembers.map(member => (
                  <div key={member.id} style={styles.memberItem}>
                    <div style={styles.memberAvatar}>
                      {member.name?.charAt(0) || member.username?.charAt(0)}
                    </div>
                    <div style={styles.memberInfo}>
                      <div style={styles.memberName}>{member.name} (@{member.username})</div>
                      <div style={styles.memberDetails}>
                        <span style={styles.memberRole}>{member.role}</span>
                        <span style={styles.memberEmail}>{member.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '30px',
  },
  formCard: {
    height: 'fit-content',
  },
  select: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '15px',
  },
  addButton: {
    width: '100%',
  },
  membersCard: {
    minHeight: '300px',
  },
  memberList: {
    marginTop: '15px',
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #eee',
  },
  memberAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    marginRight: '15px',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  memberDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666',
  },
  memberRole: {
    backgroundColor: '#e7f5ff',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  memberEmail: {
    fontStyle: 'italic',
  },
  noMembers: {
    textAlign: 'center',
    color: '#999',
    padding: '20px',
    fontStyle: 'italic',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh',
  },
};

export default AddMembers;