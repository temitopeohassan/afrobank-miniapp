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
const dataService = require('../services/dataService');

// Get all services
router.get('/', getAllServices);

// Get services data (for frontend compatibility)
router.get('/services-data', async (req, res) => {
  try {
    const servicesData = await dataService.getAllServices();
    const operators = await dataService.getOperators();
    const countryData = await dataService.getCountryData();
    
    // Format data to match frontend expectations
    const response = {
      countries: [{
        name: countryData.country.name || 'Nigeria',
        country_code: countryData.country.code || 'NG',
        exchange_rate: countryData.country.exchange_rate || 1500,
        services: {
          airtime: servicesData.services.airtime || [],
          data: servicesData.services.data || [],
          bills: servicesData.services.bills || [],
          cards: servicesData.services.cards || [],
          giftcards: servicesData.services.giftcards || []
        }
      }],
      operators: operators.operators || [],
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting services data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get services data',
      details: error.message
    });
  }
});

// Get all service categories
router.get('/categories/all', getServiceCategories);

// Search services
router.get('/search', searchServices);

// Get popular services
router.get('/popular', async (req, res) => {
  try {
    const popularServices = await dataService.getPopularServices();
    res.json({
      success: true,
      data: popularServices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting popular services:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular services',
      details: error.message
    });
  }
});

// Get featured services
router.get('/featured', async (req, res) => {
  try {
    const featuredServices = await dataService.getFeaturedServices();
    res.json({
      success: true,
      data: featuredServices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting featured services:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get featured services',
      details: error.message
    });
  }
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
