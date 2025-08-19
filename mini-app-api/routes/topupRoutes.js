// routes/topupRoutes.js

const express = require('express');
const router = express.Router();
const { sendTopup, getOperators, getProducts } = require('../controllers/topupController');

// Send airtime/data topup
router.post('/send', sendTopup);

// Get available operators for a country
router.get('/operators', getOperators);

// Get products for a specific operator
router.get('/operators/:operatorId/products', getProducts);

// Get topup history (placeholder for future implementation)
router.get('/history', (req, res) => {
  res.json({
    message: 'Topup history endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

// Get topup status (placeholder for future implementation)
router.get('/status/:transactionId', (req, res) => {
  const { transactionId } = req.params;
  res.json({
    message: 'Topup status endpoint - to be implemented',
    transactionId,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
