const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');


const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const screenRoutes = require('./routes/screen');
const emailRoutes = require('./routes/email');
const candidateRoutes = require('./routes/candidates');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const interviewRoutes = require('./routes/interviews');
const templateRoutes = require('./routes/templates');
const tagRoutes = require('./routes/tags');
const profileRoutes = require('./routes/profile');
const activityRoutes = require('./routes/activities');
const offerRoutes = require('./routes/offers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
    const debugBody = { ...req.body };
    if (req.body.password) {
      debugBody.password = `${req.body.password[0]}... (length: ${req.body.password.length})`;
    }
    console.log('Body:', debugBody);
  }
  res.on('finish', () => {
    console.log(`Response status: ${res.statusCode}`);
  });
  next();
});



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/screen', screenRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/offers', offerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static assets in production/single-port mode
const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

// Fallback all other GET requests to index.html (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});


// Sensible defaults when .env is not present
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'hr-agent-default-secret-change-in-production';
if (process.env.USE_IN_MEMORY_DB !== 'false') process.env.USE_IN_MEMORY_DB = 'true';

// Detect Vercel serverless environment
const isVercel = !!process.env.VERCEL;

// Connect to MongoDB and start server (non-Vercel)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hr-recruitment';

const connectDB = async () => {
  let connectionUri = MONGO_URI;
  let mongoServer = null;
  const isAtlasOrExternal = MONGO_URI && (
    MONGO_URI.startsWith('mongodb+srv://') ||
    (!MONGO_URI.includes('127.0.0.1') && !MONGO_URI.includes('localhost'))
  );
  const useInMemory = process.env.USE_IN_MEMORY_DB === 'true' && !isAtlasOrExternal && !isVercel;

  if (useInMemory) {
    console.log('Starting in-memory MongoDB server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    connectionUri = mongoServer.getUri();
    console.log('In-memory MongoDB server started');
  }

  try {
    await mongoose.connect(connectionUri);
    console.log(`Connected to MongoDB (${useInMemory ? 'In-Memory' : 'External'})`);
    if (useInMemory) {
      console.log('Seeding in-memory database...');
      await require('./seed')(false);
    }
    const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    const shutdown = async () => {
      server.close(async () => {
        await mongoose.disconnect();
        if (mongoServer) await mongoServer.stop();
        process.exit(0);
      });
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('DB connection error:', err.message);
    if (!isVercel) process.exit(1);
  }
};

if (!isVercel) connectDB();

module.exports = app;

