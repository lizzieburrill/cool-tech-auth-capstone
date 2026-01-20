require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import models
const User = require('./models/User');
const OrganisationUnit = require('./models/OrganisationUnit');
const Division = require('./models/Division');
const Credential = require('./models/Credential');

const app = express();
app.use(express.json());
app.use(cors());

// Config
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/cooltech_db'; // Local DB
const JWT_SECRET = 'cooltech123';

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// Middleware

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin check middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access Denied: Admins only.' });
  }
  next();
};

// Auth routes

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({ token, user: { username, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: { username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed data endpoint
app.post('/seed', async (req, res) => {
  const ouNames = [
    'News Management',
    'Software Reviews',
    'Hardware Reviews',
    'Opinion Publishing',
  ];
  try {
    for (const name of ouNames) {
      let ou = await OrganisationUnit.findOne({ name });
      if (!ou) {
        ou = new OrganisationUnit({ name });
        await ou.save();
        const div = new Division({ name: `${name} - General`, ou: ou._id });
        await div.save();
      }
    }
    res.send('Database seeded with OUs and Divisions');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Core routes - updated for permissions

// Get Divisions (secured) - checks if user is assigned to the division before showing it
app.get('/divisions', authenticateToken, async (req, res) => {
  try {
    // If admin, show all divisions
    if (req.user.role === 'admin') {
      const divisions = await Division.find();
      return res.json(divisions);
    }

    // If normal/management, only show assigned divisions
    const currentUser = await User.findById(req.user.id);
    const divisions = await Division.find({
      _id: { $in: currentUser.divisions },
    });

    res.json(divisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View credentials (secured) - checks if user is allowed to see this specific repo
app.get('/credentials/:divisionId', authenticateToken, async (req, res) => {
  try {
    const { divisionId } = req.params;

    // Permission check
    if (req.user.role !== 'admin') {
      const currentUser = await User.findById(req.user.id);
      if (!currentUser.divisions.includes(divisionId)) {
        return res
          .status(403)
          .json({
            error: 'Access Denied: You are not assigned to this division.',
          });
      }
    }

    const credentials = await Credential.find({ division: divisionId });
    res.json(credentials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add credential (securired) - checks if user is allowed to add to this specific repo
app.post('/credentials', authenticateToken, async (req, res) => {
  const { siteName, username, password, divisionId } = req.body;
  try {
    // Permission check
    if (req.user.role !== 'admin') {
      const currentUser = await User.findById(req.user.id);
      if (!currentUser.divisions.includes(divisionId)) {
        return res
          .status(403)
          .json({ error: 'Access Denied: You cannot add to this division.' });
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

// Update credential (PUT) - only management/admin
app.put('/credentials/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (req.user.role === 'normal') {
    return res
      .status(403)
      .json({
        error: 'Access Denied: Only Management can update credentials.',
      });
  }

  try {
    const updatedCred = await Credential.findByIdAndUpdate(id, updates, {
      new: true,
    });
    res.json({ message: 'Updated successfully', credential: updatedCred });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin routes

// Get all users - updated to populate OUs
app.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Populate divisions and organisationUnits so AdminPanel can see them
    const users = await User.find()
      .populate('divisions', 'name')
      .populate('organisationUnits', 'name');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all OUs - helper for admin panel dropdown
app.get('/ous', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ous = await OrganisationUnit.find();
    res.json(ous);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change user role
app.put(
  '/users/:id/role',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { role } = req.body;
    try {
      await User.findByIdAndUpdate(req.params.id, { role });
      res.json({ message: 'Role updated successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Assign user to division
app.post(
  '/users/:id/divisions',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { divisionId } = req.body;
    try {
      const user = await User.findById(req.params.id);
      if (!user.divisions.includes(divisionId)) {
        user.divisions.push(divisionId);
        await user.save();
      }
      res.json({ message: 'User assigned to division' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Remove user from Division
app.delete(
  '/users/:id/divisions/:divisionId',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id, divisionId } = req.params;
      await User.findByIdAndUpdate(id, {
        $pull: { divisions: divisionId },
      });
      res.json({ message: 'User removed from division' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Assign user to OU
app.post(
  '/users/:id/ous',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { ouId } = req.body;
      const user = await User.findById(req.params.id);
      if (!user.organisationUnits.includes(ouId)) {
        user.organisationUnits.push(ouId);
        await user.save();
      }
      res.json({ message: 'OU assigned' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Remove user from OU
app.delete(
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
