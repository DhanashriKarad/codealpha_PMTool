const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models/db');

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id;

    // Insert project
    const result = await db.runAsync(
      'INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)',
      [name, description, ownerId]
    );

    // Add owner as member
    await db.runAsync(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [result.id, ownerId, 'owner']
    );

    // Get the created project
    const project = await db.getAsync(
      `SELECT p.*, u.name as owner_name 
       FROM projects p 
       JOIN users u ON p.owner_id = u.id 
       WHERE p.id = ?`,
      [result.id]
    );

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all projects for current user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await db.allAsync(
      `SELECT p.*, u.name as owner_name 
       FROM projects p 
       JOIN users u ON p.owner_id = u.id 
       JOIN project_members pm ON p.id = pm.project_id 
       WHERE pm.user_id = ? 
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await db.getAsync(
      `SELECT p.*, u.name as owner_name 
       FROM projects p 
       JOIN users u ON p.owner_id = u.id 
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project members
    const members = await db.allAsync(
      `SELECT u.id, u.username, u.email, u.name, pm.role, pm.joined_at 
       FROM project_members pm 
       JOIN users u ON pm.user_id = u.id 
       WHERE pm.project_id = ?`,
      [req.params.id]
    );

    res.json({ ...project, members });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Add member to project - PUT THIS BEFORE module.exports
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user.id;

    // Check if project exists and user is a member
    const project = await db.getAsync(
      `SELECT p.* FROM projects p 
       JOIN project_members pm ON p.id = pm.project_id 
       WHERE p.id = ? AND pm.user_id = ?`,
      [id, currentUserId]
    );

    if (!project) {
      return res.status(403).json({ message: 'Not authorized or project not found' });
    }

    // Check if user exists
    const user = await db.getAsync('SELECT id, username, name FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already a member
    const existingMember = await db.getAsync(
      'SELECT * FROM project_members WHERE project_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a project member' });
    }

    // Add as member
    await db.runAsync(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [id, userId, 'member']
    );

    // Return the added member info
    const newMember = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: 'member',
      joined_at: new Date().toISOString()
    };

    res.json(newMember);
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;