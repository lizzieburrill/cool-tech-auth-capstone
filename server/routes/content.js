const express = require('express');
const router = express.Router();
const Division = require('../models/Division');
const Credential = require('../models/Credential');
const User = require('../models/User');
const OrganisationUnit = require('../models/OrganisationUnit'); // Needed for seed
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs'); // Needed for seed

// Get Divisions
router.get('/divisions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const divisions = await Division.find();
      return res.json(divisions);
    }
    const currentUser = await User.findById(req.user.id);
    const divisions = await Division.find({
      _id: { $in: currentUser.divisions },
    });
    res.json(divisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View credentials
router.get('/credentials/:divisionId', authenticateToken, async (req, res) => {
  try {
    const { divisionId } = req.params;
    if (req.user.role !== 'admin') {
      const currentUser = await User.findById(req.user.id);
      if (!currentUser.divisions.includes(divisionId)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
    }
    const credentials = await Credential.find({ division: divisionId });
    res.json(credentials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add credential
router.post('/credentials', authenticateToken, async (req, res) => {
  const { siteName, username, password, divisionId } = req.body;
  try {
    if (req.user.role !== 'admin') {
      const currentUser = await User.findById(req.user.id);
      if (!currentUser.divisions.includes(divisionId)) {
        return res.status(403).json({ error: 'Access Denied' });
      }
    }
    const newCred = new Credential({
      siteName,
      username,
      password,
      division: divisionId,
    });
    await newCred.save();
    res.status(201).json({ message: 'Credential added!', credential: newCred });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update credential
router.put('/credentials/:id', authenticateToken, async (req, res) => {
  if (req.user.role === 'normal') {
    return res
      .status(403)
      .json({ error: 'Access Denied: Only Management can update.' });
  }
  try {
    const updatedCred = await Credential.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ message: 'Updated successfully', credential: updatedCred });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed endpoint
router.post('/seed', async (req, res) => {
  try {
    // Seed OUs and Divisions
    const ouNames = [
      'News Management',
      'Software Reviews',
      'Hardware Reviews',
      'Opinion Publishing',
    ];

    for (const name of ouNames) {
      let ou = await OrganisationUnit.findOne({ name });
      if (!ou) {
        ou = new OrganisationUnit({ name });
        await ou.save();
        const div = new Division({ name: `${name} - General`, ou: ou._id });
        await div.save();
      }
    }

    // Seed users
    const usersToSeed = [
      { username: 'adminUser', password: 'admin123', role: 'admin' },
      { username: 'managerUser', password: 'manager123', role: 'management' },
      { username: 'normalUser', password: 'normal123', role: 'normal' },
    ];

    for (const u of usersToSeed) {
      // Check if user exists to avoid duplicates
      const exists = await User.findOne({ username: u.username });
      if (!exists) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const newUser = new User({
          username: u.username,
          password: hashedPassword,
          role: u.role,
        });
        await newUser.save();
      }
    }

    res.send('Database seeded with OUs, Divisions, and Test Users!');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
