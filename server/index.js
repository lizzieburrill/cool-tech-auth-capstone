require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import route files
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');

const app = express();
app.use(express.json());
app.use(cors());

// Config
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/cooltech_db';

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// Use routes
app.use('/', authRoutes); // Login & Register
app.use('/', adminRoutes); // Admin user management
app.use('/', contentRoutes); // Divisions & Credentials

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
