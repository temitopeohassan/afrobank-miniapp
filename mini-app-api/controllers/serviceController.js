// controllers/serviceController.js

const dataService = require('../services/dataService');

// Get all services data
const getAllServices = async (req, res) => {
  try {
    console.log('📡 GET /services - Services data requested');
    
    const servicesData = await dataService.getAllServices();
    console.log('📦 Response data loaded from separated files');

    res.json({
      success: true,
      data: servicesData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting services data:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get services data',
      details: err.message
    });
  }
};

// Get service by ID
const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;

    if (!serviceId) {
      return res.status(400).json({
        error: 'Service ID is required'
      });
    }

    // Find service by ID using the data service
    const service = await dataService.getServiceById(serviceId);

    res.json({
      success: true,
      data: service,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting service by ID:', err.message);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Service not found',
        serviceId,
        details: err.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get service',
      details: err.message
    });
  }
};

// Get services by category
const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({
        error: 'Category is required'
      });
    }

    // Get services by category using the data service
    const categoryData = await dataService.getServicesByCategory(category);

    res.json({
      success: true,
      data: categoryData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting services by category:', err.message);
    
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        category,
        details: err.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get services by category',
      details: err.message
    });
  }
};

// Get service categories
const getServiceCategories = async (req, res) => {
  try {
    // Get categories using the data service
    const categoriesData = await dataService.getCategories();

    res.json({
      success: true,
      data: categoriesData,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting service categories:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get service categories',
      details: err.message
    });
  }
};

// Search services
const searchServices = async (req, res) => {
  try {
    const { q: query, category, minPrice, maxPrice } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    // Search services using the data service
    const filters = { category, minPrice, maxPrice };
    const searchResults = await dataService.searchServices(query, filters);

    res.json({
      success: true,
      data: searchResults,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error searching services:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to search services',
      details: err.message
    });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  getServicesByCategory,
  getServiceCategories,
  searchServices
};
