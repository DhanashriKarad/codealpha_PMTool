const db = require('../models/db');

class NotificationHelper {
  // Create a notification
  static async createNotification(userId, type, title, message, relatedId = null) {
    try {
      await db.runAsync(
        'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
        [userId, type, title, message, relatedId]
      );
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  // Create activity log
  static async logActivity(projectId, userId, action, details = null) {
    try {
      await db.runAsync(
        'INSERT INTO activity_log (project_id, user_id, action, details) VALUES (?, ?, ?, ?)',
        [projectId, userId, action, details]
      );
      return true;
    } catch (error) {
      console.error('Error logging activity:', error);
      return false;
    }
  }

  // Get notifications for user
  static async getUserNotifications(userId, limit = 20) {
    try {
      const notifications = await db.allAsync(
        `SELECT n.*, 
         u.name as user_name, u.username as user_username
         FROM notifications n
         LEFT JOIN users u ON n.user_id = u.id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT ?`,
        [userId, limit]
      );
      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get unread count
  static async getUnreadCount(userId) {
    try {
      const result = await db.getAsync(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark as read
  static async markAsRead(notificationId, userId) {
    try {
      await db.runAsync(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all as read
  static async markAllAsRead(userId) {
    try {
      await db.runAsync(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Get activity log for project
  static async getProjectActivity(projectId, limit = 50) {
    try {
      const activities = await db.allAsync(
        `SELECT a.*, 
         u.name as user_name, u.username as user_username
         FROM activity_log a
         JOIN users u ON a.user_id = u.id
         WHERE a.project_id = ?
         ORDER BY a.created_at DESC
         LIMIT ?`,
        [projectId, limit]
      );
      return activities;
    } catch (error) {
      console.error('Error getting activity log:', error);
      return [];
    }
  }
}

module.exports = NotificationHelper;