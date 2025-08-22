// server.js - Afro Bank Mini App API Server

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import route files
const topupRoutes = require('./routes/topupRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const servicesDataRoutes = require('./routes/servicesDataRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes');
const utilityRoutes = require('./routes/utilityRoutes');

// Validate required environment variables
const requiredEnvVars = {
  API_CLIENT_ID: process.env.API_CLIENT_ID,
  API_CLIENT_SECRET: process.env.API_CLIENT_SECRET,
  MONGODB_URI: process.env.MONGODB_URI
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Log environment variables status (without exposing values)
console.log('✅ Environment variables loaded:', {
  API_CLIENT_ID: requiredEnvVars.API_CLIENT_ID ? '✓ Set' : '✗ Missing',
  API_CLIENT_SECRET: requiredEnvVars.API_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
  MONGODB_URI: requiredEnvVars.MONGODB_URI ? '✓ Set' : '✗ Missing'
});

const app = express();

// Configure CORS with specific options
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'https://afrobank-miniapp-demo.vercel.app/'  
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: false,
  maxAge: 86400
}));

app.use(express.json()); // Parse JSON bodies

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI;
console.log('Attempting to connect to MongoDB...');

mongoose.connect(mongoUri).then(() => {
  console.log('✅ MongoDB connected successfully');
}).catch(err => {
  console.error('❌ MongoDB connection error details:', err);
});

// Root route
app.get('/', (req, res) => {
  console.log('📡 GET / - Root endpoint called');
  res.json({
    message: 'Afro Bank Mini App API Server Is Running',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/topup', topupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/services', serviceRoutes);
app.use('/services-data', servicesDataRoutes); // Frontend compatibility endpoint
app.use('/send-topup', topupRoutes); // Frontend compatibility endpoint
app.use('/validateBill', utilityRoutes); // Frontend compatibility endpoint
app.use('/payBill', utilityRoutes); // Frontend compatibility endpoint
app.use('/api/giftcards', giftCardRoutes);
app.use('/api/utility', utilityRoutes);

// 404 handler (no-path middleware for Express 5 compatibility)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
    res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Afro Bank Mini App API Server is running at http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});
