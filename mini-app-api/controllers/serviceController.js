// controllers/serviceController.js

const servicesData = require('../data.json');

// Get all services data
const getAllServices = async (req, res) => {
  try {
    console.log('📡 GET /services - Services data requested');
    console.log('📦 Response data:', JSON.stringify(servicesData, null, 2));
    
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

    // Find service by ID in the services data
    const service = servicesData.services?.find(s => s.id === serviceId);
    
    if (!service) {
      return res.status(404).json({
        error: 'Service not found',
        serviceId
      });
    }

    res.json({
      success: true,
      data: service,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting service by ID:', err.message);
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

    // Filter services by category
    const filteredServices = servicesData.services?.filter(s => 
      s.category?.toLowerCase() === category.toLowerCase()
    ) || [];

    res.json({
      success: true,
      data: {
        category,
        services: filteredServices,
        count: filteredServices.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error getting services by category:', err.message);
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
    // Extract unique categories from services
    const categories = [...new Set(
      servicesData.services?.map(s => s.category).filter(Boolean) || []
    )];

    res.json({
      success: true,
      data: {
        categories,
        count: categories.length
      },
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

    let filteredServices = servicesData.services || [];

    // Filter by search query
    filteredServices = filteredServices.filter(service => 
      service.name?.toLowerCase().includes(query.toLowerCase()) ||
      service.description?.toLowerCase().includes(query.toLowerCase())
    );

    // Filter by category if provided
    if (category) {
      filteredServices = filteredServices.filter(service => 
        service.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by price range if provided
    if (minPrice || maxPrice) {
      filteredServices = filteredServices.filter(service => {
        const price = parseFloat(service.price) || 0;
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    res.json({
      success: true,
      data: {
        query,
        services: filteredServices,
        count: filteredServices.length,
        filters: { category, minPrice, maxPrice }
      },
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
