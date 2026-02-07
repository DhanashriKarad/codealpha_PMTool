import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Notifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, is_read: 1 } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5000/api/notifications/read-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(notifications.map(notif => ({ ...notif, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned': return '🎯';
      case 'task_updated': return '✏️';
      case 'comment_added': return '💬';
      case 'member_added': return '👥';
      default: return '🔔';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>
            Notifications
            {unreadCount > 0 && (
              <span style={styles.badge}>{unreadCount}</span>
            )}
          </h3>
          <div style={styles.headerActions}>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                style={styles.markAllButton}
              >
                Mark all as read
              </button>
            )}
            <button onClick={onClose} style={styles.closeButton}>×</button>
          </div>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loading}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={styles.empty}>No notifications yet</div>
          ) : (
            <div style={styles.list}>
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  style={{
                    ...styles.notificationItem,
                    backgroundColor: notification.is_read ? '#fff' : '#f8f9fa'
                  }}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationTitle}>
                      {notification.title}
                    </div>
                    <div style={styles.notificationMessage}>
                      {notification.message}
                    </div>
                    <div style={styles.notificationTime}>
                      {formatTime(notification.created_at)}
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div style={styles.unreadDot}></div>
                  )}
                </div>
              ))}
            </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '60px',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '400px',
    maxWidth: '90%',
    maxHeight: '80vh',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#000204',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badge: {
    backgroundColor: '#dc3545',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 'normal',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  markAllButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#007bff',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '5px 10px',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0 5px',
  },
  content: {
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  loading: {
    padding: '30px',
    textAlign: 'center',
    color: 'black',
  },
  empty: {
    padding: '40px 20px',
    textAlign: 'center',
    color: 'black',
    fontStyle: 'italic',
  },
  list: {
    padding: '10px 0',
  },
  notificationItem: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '15px 20px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  notificationItemHover: {
    backgroundColor: '#f8f9fa',
  },
  notificationIcon: {
    fontSize: '20px',
    marginRight: '15px',
    marginTop: '2px',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: '600',
    marginBottom: '5px',
    fontSize: '14px',
    color: 'black',
  },
  notificationMessage: {
    fontSize: '13px',
    color: 'black',
    marginBottom: '5px',
    lineHeight: '1.4',
  },
  notificationTime: {
    fontSize: '11px',
    color: 'black',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    marginLeft: '10px',
    marginTop: '5px',
  },
};

export default Notifications;