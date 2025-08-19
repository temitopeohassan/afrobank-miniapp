// controllers/userController.js

const UserInfo = require('../models/UserInfo');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address is required'
      });
    }

    let user = await UserInfo.findOne({ walletAddress });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new UserInfo({
        walletAddress,
        createdAt: new Date(),
        lastActive: new Date()
      });
      await user.save();
    } else {
      // Update last active
      user.lastActive = new Date();
      await user.save();
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting user profile:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      details: err.message
    });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const updateData = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address is required'
      });
    }

    const user = await UserInfo.findOneAndUpdate(
      { walletAddress },
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error updating user profile:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      details: err.message
    });
  }
};

// Get user transactions
const getUserTransactions = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address is required'
      });
    }

    const user = await UserInfo.findOne({ walletAddress });
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // This would typically fetch from a transactions collection
    // For now, returning placeholder data
    res.json({
      success: true,
      data: {
        transactions: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      },
      message: 'Transactions endpoint - to be implemented with database',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting user transactions:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get user transactions',
      details: err.message
    });
  }
};

// Get user wallet balance (placeholder for future implementation)
const getUserBalance = async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!walletAddress) {
      return res.status(400).json({
        error: 'Wallet address is required'
      });
    }

    // This would typically fetch from blockchain or database
    res.json({
      success: true,
      data: {
        walletAddress,
        balance: '0.00',
        currency: 'USDC',
        lastUpdated: new Date().toISOString()
      },
      message: 'Balance endpoint - to be implemented with blockchain integration',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting user balance:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get user balance',
      details: err.message
    });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserTransactions,
  getUserBalance
};
