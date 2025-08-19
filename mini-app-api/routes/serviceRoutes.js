// routes/serviceRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getAllServices, 
  getServiceById, 
  getServicesByCategory, 
  getServiceCategories, 
  searchServices 
} = require('../controllers/serviceController');

// Get all services
router.get('/', getAllServices);

// Get all service categories
router.get('/categories/all', getServiceCategories);

// Search services
router.get('/search', searchServices);

// Get popular services (placeholder)
router.get('/popular', (req, res) => {
  res.json({
    message: 'Popular services endpoint - to be implemented with analytics',
    timestamp: new Date().toISOString()
  });
});

// Get featured services (placeholder)
router.get('/featured', (req, res) => {
  res.json({
    message: 'Featured services endpoint - to be implemented with admin configuration',
    timestamp: new Date().toISOString()
  });
});

// Get service recommendations (placeholder)
router.get('/recommendations/:userId', (req, res) => {
  const { userId } = req.params;
  res.json({
    message: 'Service recommendations endpoint - to be implemented with ML',
    userId,
    timestamp: new Date().toISOString()
  });
});

// Get services by category
router.get('/category/:category', getServicesByCategory);

// Get service by ID (must be last to avoid catching other routes)
router.get('/:serviceId', getServiceById);

module.exports = router;
