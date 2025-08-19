// routes/utilityRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getUtilityBillers,
  getUtilityBillerById,
  getUtilityBillerProducts,
  validateUtilityBill,
  payUtilityBill,
  getUtilityBillById,
  getUtilityBills,
  getUtilityBillTypes,
  getUtilityCountries
} = require('../controllers/utilityController');

// Utility Billers
router.get('/billers', getUtilityBillers);
router.get('/billers/:billerId', getUtilityBillerById);
router.get('/billers/:billerId/products', getUtilityBillerProducts);

// Utility Bill Types and Countries
router.get('/bill-types', getUtilityBillTypes);
router.get('/countries', getUtilityCountries);

// Utility Bill Validation
router.post('/bills/validate', validateUtilityBill);

// Utility Bill Payments
router.post('/bills', payUtilityBill);
router.get('/bills', getUtilityBills);
router.get('/bills/:billId', getUtilityBillById);

// Utility Bill Search (placeholder for future implementation)
router.get('/search', (req, res) => {
  const { q: query, country, billerType, minAmount, maxAmount } = req.query;
  res.json({
    message: 'Utility bill search endpoint - to be implemented with advanced filtering',
    query,
    filters: { country, billerType, minAmount, maxAmount },
    timestamp: new Date().toISOString()
  });
});

// Utility Bill Analytics (placeholder for future implementation)
router.get('/analytics/summary', (req, res) => {
  res.json({
    message: 'Utility bill analytics endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

// Utility Bill History by Customer (placeholder for future implementation)
router.get('/customers/:customerNumber/history', (req, res) => {
  const { customerNumber } = req.params;
  const { page = 1, size = 20 } = req.query;
  res.json({
    message: 'Customer utility bill history endpoint - to be implemented',
    customerNumber,
    pagination: { page: parseInt(page), size: parseInt(size) },
    timestamp: new Date().toISOString()
  });
});

// Utility Bill Reminders (placeholder for future implementation)
router.get('/reminders', (req, res) => {
  const { dueDate, status } = req.query;
  res.json({
    message: 'Utility bill reminders endpoint - to be implemented',
    filters: { dueDate, status },
    timestamp: new Date().toISOString()
  });
});

// Utility Bill Categories (placeholder for future implementation)
router.get('/categories', (req, res) => {
  res.json({
    message: 'Utility bill categories endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

// Utility Bill Payment Methods (placeholder for future implementation)
router.get('/payment-methods', (req, res) => {
  res.json({
    message: 'Utility bill payment methods endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
