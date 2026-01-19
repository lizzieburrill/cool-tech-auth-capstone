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
const JWT_SECRET = 'cooltech123'; // In production, use .env

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.sendStatus(401); // No token - 401 error

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Bad token - 403 error
    req.user = user; // Attach user info to the request for later use
    next(); // Proceed to the endpoint
  });
};

// Routes

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (defaults to 'normal' role)
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate Token immediately upon success
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

    // Sign Token with ID and Role
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
  // Basic OUs defined in the task
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

        // Create a sample division for this OU
        const div = new Division({ name: `${name} - General`, ou: ou._id });
        await div.save();
      }
    }
    res.send('Database seeded with OUs and Divisions');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Helper - get all Divisions
app.get('/divisions', authenticateToken, async (req, res) => {
  try {
    const divisions = await Division.find();
    res.json(divisions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View credentials (GET)
app.get('/credentials/:divisionId', authenticateToken, async (req, res) => {
  try {
    const { divisionId } = req.params;
    const credentials = await Credential.find({ division: divisionId });
    res.json(credentials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add credential (POST)
app.post('/credentials', authenticateToken, async (req, res) => {
  const { siteName, username, password, divisionId } = req.body;

  // Simple permission check: Everyone can add, so just proceed.
  try {
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

// Update credential (PUT)
app.put('/credentials/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Permission check - if user is 'normal', they are NOT allowed to update
  if (req.user.role === 'normal') {
    return res.status(403).json({
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

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access Denied: Admins only.' });
  }
  next();
};

// Get all users so the admin can see who to manage
app.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Return users but populate their assigned divisions
    const users = await User.find().populate('divisions', 'name');
    res.json(users);
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
    const { role } = req.body; // 'normal', 'management', or 'admin'
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

      // Prevent duplicates
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
