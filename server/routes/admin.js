const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OrganisationUnit = require('../models/OrganisationUnit');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .populate('divisions', 'name')
      .populate('organisationUnits', 'name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all OUs
router.get('/ous', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ous = await OrganisationUnit.find();
    res.json(ous);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change user role
router.put(
  '/users/:id/role',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
      res.json({ message: 'Role updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Assign user to division
router.post(
  '/users/:id/divisions',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user.divisions.includes(req.body.divisionId)) {
        user.divisions.push(req.body.divisionId);
        await user.save();
      }
      res.json({ message: 'User assigned to division' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Remove user from Division
router.delete(
  '/users/:id/divisions/:divisionId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { divisions: req.params.divisionId },
      });
      res.json({ message: 'User removed from division' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Assign user to OU
router.post(
  '/users/:id/ous',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user.organisationUnits.includes(req.body.ouId)) {
        user.organisationUnits.push(req.body.ouId);
        await user.save();
      }
      res.json({ message: 'OU assigned' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Remove user from OU
router.delete(
  '/users/:id/ous/:ouId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { organisationUnits: req.params.ouId },
      });
      res.json({ message: 'OU removed' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
