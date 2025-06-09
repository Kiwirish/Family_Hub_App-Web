// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',  // Allow frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Optional, only needed if you're using cookies or sessions
};

app.use(cors(corsOptions));

// Handle preflight requests manually
app.options('*', cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import models
const Family = require('./models/family');
const User = require('./models/user');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: true, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: true, message: 'Invalid token' });
    }
    req.user = decoded.user;
    req.familyId = decoded.familyId;
    next();
  });
};

// Routes

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Family Hub API is running!' });
});

// Create a new family (no auth required)
app.post('/api/create-family', async (req, res) => {
  try {
    const { familyName, adminName, email, password } = req.body;

    // Validate input
    if (!familyName || !adminName || !email || !password) {
      return res.status(400).json({ 
        error: true, 
        message: 'All fields are required' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: true, 
        message: 'Email already registered' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create family
    const family = new Family({
      name: familyName,
      joinCode: joinCode
    });
    await family.save();

    // Create admin user
    const user = new User({
      fullName: adminName,
      email,
      password: hashedPassword,
      familyId: family._id,
      role: 'admin'
    });
    await user.save();

    // Update family with creator and add to members
    family.createdBy = user._id;
    family.members.push(user._id);
    await family.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        user: { 
          _id: user._id, 
          email: user.email, 
          role: user.role 
        }, 
        familyId: family._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      error: false,
      message: 'Family created successfully',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      family: {
        _id: family._id,
        name: family.name,
        joinCode: family.joinCode
      }
    });

  } catch (error) {
    console.error('Create family error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to create family' 
    });
  }
});

// Join existing family
app.post('/api/join-family', async (req, res) => {
  try {
    const { joinCode, fullName, email, password } = req.body;

    // Validate input
    if (!joinCode || !fullName || !email || !password) {
      return res.status(400).json({ 
        error: true, 
        message: 'All fields are required' 
      });
    }

    // Find family by join code
    const family = await Family.findOne({ joinCode: joinCode.toUpperCase() });
    if (!family) {
      return res.status(404).json({ 
        error: true, 
        message: 'Invalid family code' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        error: true, 
        message: 'Email already registered' 
      });
    }

    // Check family member limit
    if (family.members.length >= family.settings.maxMembers) {
      return res.status(400).json({ 
        error: true, 
        message: 'Family has reached maximum members' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new member
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      familyId: family._id,
      role: 'member'
    });
    await user.save();

    // Add user to family members
    family.members.push(user._id);
    await family.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        user: { 
          _id: user._id, 
          email: user.email, 
          role: user.role 
        }, 
        familyId: family._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      error: false,
      message: 'Joined family successfully',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      family: {
        _id: family._id,
        name: family.name
      }
    });

  } catch (error) {
    console.error('Join family error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to join family' 
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: true, 
        message: 'Email and password are required' 
      });
    }

    // Find user and populate family
    const user = await User.findOne({ email }).populate('familyId');
    if (!user) {
      return res.status(401).json({ 
        error: true, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: true, 
        message: 'Invalid email or password' 
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        user: { 
          _id: user._id, 
          email: user.email, 
          role: user.role 
        }, 
        familyId: user.familyId._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      error: false,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      },
      family: {
        _id: user.familyId._id,
        name: user.familyId.name,
        joinCode: user.role === 'admin' ? user.familyId.joinCode : undefined
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Login failed' 
    });
  }
});

// Get current user info (protected route)
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('familyId', 'name joinCode');

    if (!user) {
      return res.status(404).json({ 
        error: true, 
        message: 'User not found' 
      });
    }

    res.json({
      error: false,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        family: {
          _id: user.familyId._id,
          name: user.familyId.name,
          joinCode: user.role === 'admin' ? user.familyId.joinCode : undefined
        }
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to get user info' 
    });
  }
});

// Get family members (protected route)
app.get('/api/family/members', authenticateToken, async (req, res) => {
  try {
    const family = await Family.findById(req.familyId)
      .populate('members', 'fullName email role lastActive profilePicture');

    if (!family) {
      return res.status(404).json({ 
        error: true, 
        message: 'Family not found' 
      });
    }

    res.json({
      error: false,
      familyName: family.name,
      joinCode: req.user.role === 'admin' ? family.joinCode : undefined,
      members: family.members
    });

  } catch (error) {
    console.error('Get family members error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to get family members' 
    });
  }
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});