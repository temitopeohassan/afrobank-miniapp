// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  updateUserProfile, 
  getUserTransactions, 
  getUserBalance 
} = require('../controllers/userController');

// Get all users (admin only - placeholder)
router.get('/', (req, res) => {
  res.json({
    message: 'Get all users endpoint - to be implemented with admin authentication',
    timestamp: new Date().toISOString()
  });
});

// Get user profile by wallet address
router.get('/profile/:walletAddress', getUserProfile);

// Update user profile
router.put('/profile/:walletAddress', updateUserProfile);

// Get user transactions
router.get('/profile/:walletAddress/transactions', getUserTransactions);

// Get user wallet balance
router.get('/profile/:walletAddress/balance', getUserBalance);

// Delete user (admin only - placeholder)
router.delete('/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  res.json({
    message: 'Delete user endpoint - to be implemented with admin authentication',
    walletAddress,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
