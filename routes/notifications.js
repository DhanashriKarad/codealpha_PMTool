const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationHelper = require('../utils/notifications');

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await NotificationHelper.getUserNotifications(req.user.id);
    const unreadCount = await NotificationHelper.getUnreadCount(req.user.id);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await NotificationHelper.markAsRead(id, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await NotificationHelper.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project activity
router.get('/activity/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const activities = await NotificationHelper.getProjectActivity(projectId);
    res.json(activities);
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;