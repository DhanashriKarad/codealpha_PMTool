import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Notifications from './Notifications';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleNotificationClick = () => {
    setShowNotifications(true);
    // Refresh notifications when opening
    fetchUnreadCount();
  };

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <div style={styles.headerContainer}>
          <Link to="/" style={styles.logo}>
            <div style={styles.logoContainer}>
              <div style={styles.logoIcon}>📋</div>
              <h1 style={styles.logoText}>TaskBoard</h1>
            </div>
          </Link>
          <div style={styles.headerRight}>
            {/* Notification Bell */}
            <button
              onClick={handleNotificationClick}
              style={styles.notificationButton}
              title="Notifications"
              disabled={loading}
            >
              <span style={styles.bellIcon}>🔔</span>
              {unreadCount > 0 && (
                <span style={styles.notificationBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div style={styles.userMenu}>
              <div style={styles.userInfo}>
                <div style={styles.userAvatar}>
                  {(user.name || user.username)?.charAt(0).toUpperCase()}
                </div>
                <div style={styles.userDetails}>
                  <span style={styles.userName}>{user.name || user.username}</span>
                  <span style={styles.userRole}>Project Manager</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={styles.logoutButton}
                title="Logout"
              >
                <span style={styles.logoutIcon}>🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main style={styles.main}>
        {children}
      </main>

      {/* Notifications Modal */}
      {showNotifications && (
        <Notifications
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={() => {
            setUnreadCount(0);
            fetchUnreadCount();
          }}
        />
      )}
    </div>
  );
};

const styles = {
  layout: {
    minHeight: '100vh',
    background: 'transparent',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    padding: '16px 0',
    boxShadow: '0 4px 32px rgba(0, 0, 0, 0.3)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
  },
  logo: {
    color: 'white',
    textDecoration: 'none',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '28px',
    filter: 'drop-shadow(0 0 10px rgba(0, 212, 255, 0.5))',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #00d4ff 0%, #9c27b0 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  notificationButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: '20px',
    cursor: 'pointer',
    position: 'relative',
    padding: '12px',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  },
  notificationButtonHover: {
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(0, 212, 255, 0.2)',
  },
  bellIcon: {
    display: 'inline-block',
  },
  notificationBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    color: 'white',
    borderRadius: '50%',
    minWidth: '18px',
    height: '18px',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    fontWeight: 'bold',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4ff 0%, #9c27b0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(0, 212, 255, 0.3)',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    margin: 0,
    color: '#ffffff',
  },
  userRole: {
    fontSize: '12px',
    opacity: 0.8,
    margin: 0,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  logoutButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  },
  logoutButtonHover: {
    background: 'rgba(255, 107, 107, 0.1)',
    borderColor: '#ff6b6b',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.2)',
  },
  logoutIcon: {
    fontSize: '16px',
  },
  main: {
    minHeight: 'calc(100vh - 80px)',
    background: 'transparent',
  },
};

export default Layout;