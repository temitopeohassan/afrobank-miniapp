// routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const { 
  submitFailureReport, 
  getTransactionById, 
  getAllTransactions, 
  updateTransactionStatus 
} = require('../controllers/transactionController');

// Submit transaction failure report
router.post('/failure-report', submitFailureReport);

// Get all transactions with pagination and filters
router.get('/', getAllTransactions);

// Get transaction analytics (placeholder)
router.get('/analytics/summary', (req, res) => {
  res.json({
    message: 'Transaction analytics endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

// Get transaction statistics by date range (placeholder)
router.get('/analytics/date-range', (req, res) => {
  const { startDate, endDate } = req.query;
  res.json({
    message: 'Transaction date range analytics endpoint - to be implemented',
    startDate,
    endDate,
    timestamp: new Date().toISOString()
  });
});

// Get transaction by ID (must be after specific routes)
router.get('/:transactionId', getTransactionById);

// Update transaction status
router.put('/:transactionId/status', updateTransactionStatus);

module.exports = router;
