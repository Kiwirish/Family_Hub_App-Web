require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
//const socketIO = require('socket.io');

const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);

//Socket.io setup with CORS
const io = socketIO(server, {
  cors: {
    origin: '*', // Allow all origins for mobile apps
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const corsOptions = {
  origin: ['https://family-hub-app-web.vercel.app',
  'http://localhost:3000', // For local web development
  'http://localhost:8081', // For React Native Metro bundler
  '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, 
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
const GroceryItem = require('./models/groceryItem');  
const Event = require('./models/event');
const List = require('./models/List');

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
// Socket.io authentication middleware 
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'));
    }
    socket.userId = decoded.user._id;
    socket.familyId = decoded.familyId;
    next();
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  // Join family room
  socket.join(`family:${socket.familyId}`);

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
  // Join list room for real-time updates
  socket.on('join_list', async (listId) => {
    try {
      const userId = socket.userId;
      const user = await User.findById(userId).populate('family');

      if (user && user.family) {
        const list = await List.findOne({
          _id: listId,
          family: user.family._id
        });

        if (list) {
          socket.join(`list_${listId}`);
          console.log(`User ${userId} joined list ${listId}`);
        }
      }
    } catch (error) {
      console.error('Error joining list room:', error);
    }
  });

  // Leave list room
  socket.on('leave_list', (listId) => {
    socket.leave(`list_${listId}`);
    console.log(`User ${socket.userId} left list ${listId}`);
  });
});

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

// Get grocery items
app.get('/api/grocery', authenticateToken, async (req, res) => {
  try {
    const { completed = 'false', category } = req.query;

    const query = {
      familyId: req.familyId,
      completed: completed === 'true'
    };
    if (category) query.category = category;

    const items = await GroceryItem.find(query)
      .populate('addedBy', 'fullName')
      .populate('completedBy', 'fullName')
      .populate('assignedTo', 'fullName')
      .sort({ priority: -1, createdAt: -1 });

    res.json({
      error: false,
      items
    });

  } catch (error) {
    console.error('Get grocery items error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get grocery items'
    });
  }
});

// Add grocery item
app.post('/api/grocery', authenticateToken, async (req, res) => {
  try {
    const item = new GroceryItem({
      ...req.body,
      addedBy: req.user._id,
      familyId: req.familyId
    });

    await item.save();
    await item.populate(['addedBy', 'assignedTo'], 'fullName');

    // Emit to all family members
    io.to(`family:${req.familyId}`).emit('grocery_item_added', item);

    res.json({
      error: false,
      message: 'Item added to grocery list',
      item
    });

  } catch (error) {
    console.error('Add grocery item error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to add item'
    });
  }
});

// Update grocery item
app.put('/api/grocery/:itemId', authenticateToken, async (req, res) => {
  try {
    const item = await GroceryItem.findOne({
      _id: req.params.itemId,
      familyId: req.familyId
    });

    if (!item) {
      return res.status(404).json({
        error: true,
        message: 'Item not found'
      });
    }

    // Handle completion
    if (req.body.completed !== undefined) {
      item.completed = req.body.completed;
      if (req.body.completed) {
        item.completedBy = req.user._id;
        item.completedAt = new Date();
      } else {
        item.completedBy = null;
        item.completedAt = null;
      }
    }

    // Update other fields
    Object.assign(item, req.body);
    await item.save();
    await item.populate(['addedBy', 'completedBy', 'assignedTo'], 'fullName');

    // Emit update to all family members
    io.to(`family:${req.familyId}`).emit('grocery_item_updated', item);

    res.json({
      error: false,
      message: 'Item updated',
      item
    });

  } catch (error) {
    console.error('Update grocery item error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update item'
    });
  }
});

// Delete grocery item
app.delete('/api/grocery/:itemId', authenticateToken, async (req, res) => {
  try {
    const result = await GroceryItem.deleteOne({
      _id: req.params.itemId,
      familyId: req.familyId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        error: true,
        message: 'Item not found'
      });
    }

    // Emit deletion to all family members
    io.to(`family:${req.familyId}`).emit('grocery_item_deleted', req.params.itemId);

    res.json({
      error: false,
      message: 'Item deleted'
    });

  } catch (error) {
    console.error('Delete grocery item error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to delete item'
    });
  }
});

// calander routes !! 
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    const query = { familyId: req.familyId };

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }

    if (category) query.category = category;

    const events = await Event.find(query)
      .populate('createdBy', 'fullName')
      .populate('attendees.user', 'fullName')
      .sort({ startDate: 1 });

    res.json({
      error: false,
      events
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get events'
    });
  }
});

// Create event
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      createdBy: req.user._id,
      familyId: req.familyId
    });

    // Add creator as attendee with accepted status
    event.attendees.push({
      user: req.user._id,
      response: 'accepted'
    });

    await event.save();
    await event.populate(['createdBy', 'attendees.user'], 'fullName');

    // Emit to all family members
    io.to(`family:${req.familyId}`).emit('event_created', event);

    res.json({
      error: false,
      message: 'Event created',
      event
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to create event'
    });
  }
});

// Update event RSVP
app.post('/api/events/:eventId/rsvp', authenticateToken, async (req, res) => {
  try {
    const { response } = req.body;

    if (!['accepted', 'declined', 'maybe'].includes(response)) {
      return res.status(400).json({
        error: true,
        message: 'Invalid response'
      });
    }

    const event = await Event.findOne({
      _id: req.params.eventId,
      familyId: req.familyId
    });

    if (!event) {
      return res.status(404).json({
        error: true,
        message: 'Event not found'
      });
    }

    // Find or create attendee entry
    let attendee = event.attendees.find(
      a => a.user.toString() === req.user._id
    );

    if (attendee) {
      attendee.response = response;
    } else {
      event.attendees.push({
        user: req.user._id,
        response
      });
    }

    await event.save();
    await event.populate('attendees.user', 'fullName');

    // Emit update to all family members
    io.to(`family:${req.familyId}`).emit('event_updated', event);

    res.json({
      error: false,
      message: 'RSVP updated',
      event
    });

  } catch (error) {
    console.error('Update RSVP error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to update RSVP'
    });
  }
});
// ===== LISTS ROUTES =====

// Get all lists for a family
app.get('/api/lists', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/lists - familyId:', req.familyId, 'user:', req.user._id);
    
    const lists = await List.find({ family: req.familyId })
      .populate('createdBy', 'fullName email')
      .populate('items.assignedTo', 'fullName email')
      .populate('items.completedBy', 'fullName email')
      .sort({ createdAt: -1 });

    console.log('Found lists:', lists.length);
    res.json({ lists });
  } catch (error) {
    console.error('Error fetching lists:', error);
    res.status(500).json({ message: 'Failed to fetch lists' });
  }
});

// Create a new list
app.post('/api/lists', authenticateToken, async (req, res) => {
  try {
    const { title, description, color, icon } = req.body;
    console.log('POST /api/lists - data:', { title, description, color, icon });
    console.log('User:', req.user._id, 'Family:', req.familyId);

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const newList = new List({
      family: req.familyId,
      title,
      description,
      color,
      icon,
      createdBy: req.user._id,  // FIXED: was req.user.userId
      items: []
    });

    await newList.save();
    await newList.populate('createdBy', 'fullName email');

    console.log('Created list:', newList._id);

    // FIXED: Use consistent socket room naming
    io.to(`family:${req.familyId}`).emit('list_created', newList);

    res.status(201).json({
      message: 'List created successfully',
      list: newList
    });
  } catch (error) {
    console.error('Error creating list:', error);
    res.status(500).json({ message: 'Failed to create list' });
  }
});

// Update a list
app.put('/api/lists/:listId', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description, color, icon } = req.body;
    console.log('PUT /api/lists/:listId - listId:', listId, 'data:', { title, description, color, icon });

    const list = await List.findOne({
      _id: listId,
      family: req.familyId
    });

    if (!list) {
      console.log('List not found:', listId, 'for family:', req.familyId);
      return res.status(404).json({ message: 'List not found' });
    }

    // Update fields
    if (title !== undefined) list.title = title;
    if (description !== undefined) list.description = description;
    if (color !== undefined) list.color = color;
    if (icon !== undefined) list.icon = icon;
    list.updatedAt = new Date();

    await list.save();
    await list.populate('createdBy', 'fullName email');
    await list.populate('items.assignedTo', 'fullName email');
    await list.populate('items.completedBy', 'fullName email');

    console.log('Updated list:', list._id);

    // FIXED: Use consistent socket room naming
    io.to(`family:${req.familyId}`).emit('list_updated', list);

    res.json({
      message: 'List updated successfully',
      list
    });
  } catch (error) {
    console.error('Error updating list:', error);
    res.status(500).json({ message: 'Failed to update list' });
  }
});

// Delete a list
app.delete('/api/lists/:listId', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    console.log('DELETE /api/lists/:listId - listId:', listId);

    const list = await List.findOne({
      _id: listId,
      family: req.familyId
    });

    if (!list) {
      console.log('List not found for deletion:', listId);
      return res.status(404).json({ message: 'List not found' });
    }

    await List.deleteOne({ _id: listId });
    console.log('Deleted list:', listId);

    // FIXED: Use consistent socket room naming
    io.to(`family:${req.familyId}`).emit('list_deleted', listId);

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    res.status(500).json({ message: 'Failed to delete list' });
  }
});

// ===== LIST ITEMS ROUTES =====

// Add item to list
app.post('/api/lists/:listId/items', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const { text, assignedTo, dueDate, priority } = req.body;
    console.log('POST /api/lists/:listId/items - listId:', listId, 'data:', { text, assignedTo, dueDate, priority });

    if (!text) {
      return res.status(400).json({ message: 'Item text is required' });
    }

    const list = await List.findOne({
      _id: listId,
      family: req.familyId
    });

    if (!list) {
      console.log('List not found for adding item:', listId);
      return res.status(404).json({ message: 'List not found' });
    }

    const newItem = {
      text,
      assignedTo: assignedTo || undefined, // Handle empty string
      dueDate: dueDate || undefined, // Handle empty string
      priority: priority || 'normal',
      completed: false,
      createdAt: new Date()
    };

    list.items.push(newItem);
    list.updatedAt = new Date();
    await list.save();

    // Get the newly added item with populated fields
    const addedItem = list.items[list.items.length - 1];
    await list.populate('items.assignedTo', 'fullName email');

    console.log('Added item to list:', listId, 'item:', addedItem._id);

    // FIXED: Use consistent socket room naming
    io.to(`family:${req.familyId}`).emit('list_item_added', {
      listId,
      item: addedItem
    });

    res.status(201).json({
      message: 'Item added successfully',
      item: addedItem
    });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Failed to add item' });
  }
});

// Update list item
app.put('/api/lists/:listId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    const { text, completed, assignedTo, dueDate, priority } = req.body;
    console.log('PUT /api/lists/:listId/items/:itemId - listId:', listId, 'itemId:', itemId, 'data:', { text, completed, assignedTo, dueDate, priority });

    const list = await List.findOne({
      _id: listId,
      family: req.familyId
    });

    if (!list) {
      console.log('List not found for updating item:', listId);
      return res.status(404).json({ message: 'List not found' });
    }

    const item = list.items.id(itemId);
    if (!item) {
      console.log('Item not found:', itemId, 'in list:', listId);
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update fields
    if (text !== undefined) item.text = text;
    if (assignedTo !== undefined) item.assignedTo = assignedTo || undefined;
    if (dueDate !== undefined) item.dueDate = dueDate || undefined;
    if (priority !== undefined) item.priority = priority;

    // Handle completion
    if (completed !== undefined) {
      item.completed = completed;
      if (completed) {
        item.completedBy = req.user._id;  // FIXED: was req.user.userId
        item.completedAt = new Date();
      } else {
        item.completedBy = undefined;
        item.completedAt = undefined;
      }
    }

    list.updatedAt = new Date();
    await list.save();

    // Populate the updated item
    await list.populate('items.assignedTo', 'fullName email');
    await list.populate('items.completedBy', 'fullName email');

    const updatedItem = list.items.id(itemId);
    console.log('Updated item:', itemId, 'completed:', updatedItem.completed);

    // FIXED: Use consistent socket room naming
    io.to(`family:${req.familyId}`).emit('list_item_updated', {
      listId,
      item: updatedItem
    });

    res.json({
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete list item
app.delete('/api/lists/:listId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { listId, itemId } = req.params;
    console.log('DELETE /api/lists/:listId/items/:itemId - listId:', listId, 'itemId:', itemId);

    const list = await List.findOne({
      _id: listId,
      family: req.familyId
    });

    if (!list) {
      console.log('List not found for deleting item:', listId);
      return res.status(404).json({ message: 'List not found' });
    }

    const item = list.items.id(itemId);
    if (!item) {
      console.log('Item not found for deletion:', itemId);
      return res.status(404).json({ message: 'Item not found' });
    }

    // Remove the item
    list.items.pull(itemId);
    list.updatedAt = new Date();
    await list.save();

    console.log('Deleted item:', itemId, 'from list:', listId);

    // FIXED: Use consistent socket room naming
    io.to(`family:${req.familyId}`).emit('list_item_deleted', {
      listId,
      itemId
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});


// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});