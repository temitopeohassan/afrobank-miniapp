// routes/servicesDataRoutes.js

const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get services data (main endpoint for frontend)
router.get('/', async (req, res) => {
  try {
    console.log('📡 GET /services-data - Services data requested');
    
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

    console.log('📦 Response data loaded from separated files');
    res.json(response);
  } catch (error) {
    console.error('❌ Error getting services data:', error.message);
    res.status(500).json({
      error: 'Failed to get services data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get operators for a specific country
router.get('/getOperators', async (req, res) => {
  try {
    const { countryCode = 'NG' } = req.query;
    const operators = await dataService.getOperators(countryCode);
    
    res.json({
      success: true,
      data: operators,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting operators:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get operators',
      details: error.message
    });
  }
});

// Get billers for utility payments
router.get('/getBillers', async (req, res) => {
  try {
    const { category } = req.query;
    const services = await dataService.getServicesByCategory(category || 'bills');
    
    res.json({
      success: true,
      data: services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting billers:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get billers',
      details: error.message
    });
  }
});

// Get bill types for a specific biller
router.get('/getBillTypes', async (req, res) => {
  try {
    const { billerId } = req.query;
    // This would typically come from a specific biller's data
    // For now, return a generic response
    res.json({
      success: true,
      data: {
        billTypes: [
          { id: 'prepaid', name: 'Prepaid', description: 'Prepaid meter' },
          { id: 'postpaid', name: 'Postpaid', description: 'Postpaid meter' }
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting bill types:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get bill types',
      details: error.message
    });
  }
});

// Get countries
router.get('/getCountries', async (req, res) => {
  try {
    const countryData = await dataService.getCountryData();
    
    res.json({
      success: true,
      data: [countryData.country],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting countries:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get countries',
      details: error.message
    });
  }
});

module.exports = router;
