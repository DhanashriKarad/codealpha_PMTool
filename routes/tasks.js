const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models/db');
const NotificationHelper = require('../utils/notifications');

// Create a new task
router.post('/projects/:projectId/tasks', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { title, description, status, priority, due_date, assigned_to } = req.body;

    // First, get or create default board for project
    let board = await db.getAsync(
      'SELECT * FROM boards WHERE project_id = ?',
      [projectId]
    );

    if (!board) {
      const boardResult = await db.runAsync(
        'INSERT INTO boards (project_id, name) VALUES (?, ?)',
        [projectId, 'Main Board']
      );
      board = { id: boardResult.id };
    }

    // Insert task
    const result = await db.runAsync(
      `INSERT INTO tasks 
       (title, description, status, priority, due_date, board_id, project_id, created_by, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, status || 'todo', priority || 'medium', 
       due_date, board.id, projectId, userId, assigned_to]
    );

    // Get the created task with user details
    const task = await db.getAsync(
      `SELECT t.*, 
       u1.name as created_by_name, u1.username as created_by_username,
       u2.name as assigned_to_name, u2.username as assigned_to_username
       FROM tasks t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.id = ?`,
      [result.id]
    );

    // NOTIFICATION: If task is assigned to someone, notify them
    if (assigned_to && assigned_to !== userId) {
      await NotificationHelper.createNotification(
        assigned_to,
        'task_assigned',
        'New Task Assigned',
        `${req.user.name || req.user.username} assigned you a task: "${title}"`,
        result.id
      );
    }

    // ACTIVITY LOG: Log the task creation
    await NotificationHelper.logActivity(
      projectId,
      userId,
      'created_task',
      JSON.stringify({ task_id: result.id, title: title })
    );

    // WEBSOCKET: Emit task created event
    const io = req.app.get('io');
    if (io) {
      io.to(`project-${projectId}`).emit('task-created', task);
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks for a project
router.get('/projects/:projectId/tasks', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await db.allAsync(
      `SELECT t.*, 
       u1.name as created_by_name, u1.username as created_by_username,
       u2.name as assigned_to_name, u2.username as assigned_to_username
       FROM tasks t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.project_id = ?
       ORDER BY t.priority DESC, t.created_at DESC`,
      [projectId]
    );

    // Group tasks by status
    const groupedTasks = {
      todo: tasks.filter(task => task.status === 'todo'),
      doing: tasks.filter(task => task.status === 'doing'),
      done: tasks.filter(task => task.status === 'done'),
    };

    res.json(groupedTasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.put('/tasks/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, due_date, assigned_to } = req.body;
    const userId = req.user.id;

    // Get the old task data before update
    const oldTask = await db.getAsync('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!oldTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(taskId);

    if (updates.length === 1) { // Only updated_at
      return res.status(400).json({ message: 'No fields to update' });
    }

    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    
    await db.runAsync(query, values);

    // Get updated task
    const task = await db.getAsync(
      `SELECT t.*, 
       u1.name as created_by_name, u1.username as created_by_username,
       u2.name as assigned_to_name, u2.username as assigned_to_username
       FROM tasks t
       LEFT JOIN users u1 ON t.created_by = u1.id
       LEFT JOIN users u2 ON t.assigned_to = u2.id
       WHERE t.id = ?`,
      [taskId]
    );

    // NOTIFICATION: If assignee changed, notify the new assignee
    if (assigned_to !== undefined && assigned_to !== oldTask.assigned_to && assigned_to) {
      await NotificationHelper.createNotification(
        assigned_to,
        'task_assigned',
        'Task Reassigned',
        `${req.user.name || req.user.username} assigned you a task: "${title || oldTask.title}"`,
        taskId
      );
    }

    // NOTIFICATION: If status changed, notify the assignee (if exists)
    if (status !== undefined && status !== oldTask.status && oldTask.assigned_to) {
      const statusMessages = {
        'todo': 'moved to To Do',
        'doing': 'started working on',
        'done': 'completed'
      };
      
      await NotificationHelper.createNotification(
        oldTask.assigned_to,
        'task_updated',
        'Task Status Updated',
        `${req.user.name || req.user.username} ${statusMessages[status]} "${oldTask.title}"`,
        taskId
      );
    }

    // ACTIVITY LOG: Log the task update
    const changes = {};
    if (title !== undefined) changes.title = title;
    if (description !== undefined) changes.description = description;
    if (status !== undefined) changes.status = status;
    if (priority !== undefined) changes.priority = priority;
    if (due_date !== undefined) changes.due_date = due_date;
    if (assigned_to !== undefined) changes.assigned_to = assigned_to;

    await NotificationHelper.logActivity(
      oldTask.project_id,
      userId,
      'updated_task',
      JSON.stringify({ task_id: taskId, changes: changes })
    );

    // WEBSOCKET: Emit task updated event
    const io = req.app.get('io');
    if (io) {
      io.to(`project-${oldTask.project_id}`).emit('task-updated', task);
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/tasks/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Get task info before deletion for activity log
    const task = await db.getAsync('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await db.runAsync('DELETE FROM tasks WHERE id = ?', [taskId]);

    // ACTIVITY LOG: Log the task deletion
    await NotificationHelper.logActivity(
      task.project_id,
      userId,
      'deleted_task',
      JSON.stringify({ task_id: taskId, title: task.title })
    );

    // WEBSOCKET: Emit task deleted event
    const io = req.app.get('io');
    if (io) {
      io.to(`project-${task.project_id}`).emit('task-deleted', { taskId });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to task
router.post('/tasks/:taskId/comments', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    const result = await db.runAsync(
      'INSERT INTO comments (content, task_id, user_id) VALUES (?, ?, ?)',
      [content, taskId, userId]
    );

    // Get comment with user details
    const comment = await db.getAsync(
      `SELECT c.*, u.name as user_name, u.username as user_username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.id]
    );

    // NOTIFICATION: Notify task creator and assignee about new comment
    const task = await db.getAsync('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (task) {
      const notifyUsers = new Set();
      
      // Notify task creator (if not the commenter)
      if (task.created_by && task.created_by !== userId) {
        notifyUsers.add(task.created_by);
      }
      
      // Notify task assignee (if not the commenter)
      if (task.assigned_to && task.assigned_to !== userId) {
        notifyUsers.add(task.assigned_to);
      }

      // Send notifications to each user
      for (const notifyUserId of notifyUsers) {
        await NotificationHelper.createNotification(
          notifyUserId,
          'comment_added',
          'New Comment',
          `${req.user.name || req.user.username} commented on task: "${task.title}"`,
          taskId
        );
      }

      // WEBSOCKET: Emit comment added event
      const io = req.app.get('io');
      if (io) {
        io.to(`project-${task.project_id}`).emit('comment-added', {
          taskId,
          comment
        });
      }
    }

    // ACTIVITY LOG: Log the comment addition
    if (task) {
      await NotificationHelper.logActivity(
        task.project_id,
        userId,
        'added_comment',
        JSON.stringify({ task_id: taskId, comment_id: result.id, preview: content.substring(0, 50) })
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comments for a task
router.get('/tasks/:taskId/comments', auth, async (req, res) => {
  try {
    const { taskId } = req.params;

    const comments = await db.allAsync(
      `SELECT c.*, u.name as user_name, u.username as user_username
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;