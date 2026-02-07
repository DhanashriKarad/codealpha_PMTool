const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../models/db');

// Get all users (for assigning tasks)
router.get('/', auth, async (req, res) => {
  try {
    const users = await db.allAsync(
      'SELECT id, username, email, name FROM users WHERE id != ?',
      [req.user.id]
    );
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;