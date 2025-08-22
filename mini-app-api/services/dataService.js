// services/dataService.js

const fs = require('fs').promises;
const path = require('path');

class DataService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Load and cache data from a specific JSON file
  async loadDataFile(filename) {
    try {
      const filePath = path.join(this.dataPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Error loading data file ${filename}:`, error.message);
      throw new Error(`Failed to load ${filename}: ${error.message}`);
    }
  }

  // Get cached data or load from file
  async getCachedData(filename) {
    const now = Date.now();
    const cached = this.cache.get(filename);
    
    if (cached && (now - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }

    const data = await this.loadDataFile(filename);
    this.cache.set(filename, { data, timestamp: now });
    return data;
  }

  // Load the index file to understand data structure
  async getIndex() {
    return await this.getCachedData('index.json');
  }

  // Get all services data
  async getAllServices() {
    try {
      const index = await this.getIndex();
      const services = {};

      // Load all service categories
      for (const [category, filename] of Object.entries(index.services)) {
        services[category] = await this.getCachedData(filename);
      }

      return {
        services,
        categories: Object.keys(index.services),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting all services:', error.message);
      throw error;
    }
  }

  // Get services by category
  async getServicesByCategory(category) {
    try {
      const index = await this.getIndex();
      
      if (!index.services[category]) {
        throw new Error(`Category '${category}' not found`);
      }

      const filename = index.services[category];
      const services = await this.getCachedData(filename);

      return {
        category,
        services,
        count: Array.isArray(services) ? services.length : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error getting services by category ${category}:`, error.message);
      throw error;
    }
  }

  // Get service by ID across all categories
  async getServiceById(serviceId) {
    try {
      const index = await this.getIndex();
      
      // Search through all service categories
      for (const [category, filename] of Object.entries(index.services)) {
        const services = await this.getCachedData(filename);
        
        if (Array.isArray(services)) {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            return { ...service, category };
          }
        }
      }

      throw new Error(`Service with ID '${serviceId}' not found`);
    } catch (error) {
      console.error(`❌ Error getting service by ID ${serviceId}:`, error.message);
      throw error;
    }
  }

  // Get all categories
  async getCategories() {
    try {
      const categories = await this.getCachedData('categories.json');
      return {
        categories: Array.isArray(categories) ? categories : [],
        count: Array.isArray(categories) ? categories.length : 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting categories:', error.message);
      throw error;
    }
  }

  // Get operators
  async getOperators(countryCode = 'NG') {
    try {
      const operators = await this.getCachedData('operators.json');
      
      if (Array.isArray(operators)) {
        const filtered = countryCode ? 
          operators.filter(op => op.countryCode === countryCode) : 
          operators;
        
        return {
          operators: filtered,
          count: filtered.length,
          countryCode,
          timestamp: new Date().toISOString()
        };
      }

      return {
        operators: [],
        count: 0,
        countryCode,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting operators:', error.message);
      throw error;
    }
  }

  // Get country data
  async getCountryData() {
    try {
      const countryData = await this.getCachedData('country.json');
      return {
        country: countryData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting country data:', error.message);
      throw error;
    }
  }

  // Search services across all categories
  async searchServices(query, filters = {}) {
    try {
      const index = await this.getIndex();
      const results = [];
      
      // Search through all service categories
      for (const [category, filename] of Object.entries(index.services)) {
        const services = await this.getCachedData(filename);
        
        if (Array.isArray(services)) {
          const filtered = services.filter(service => {
            // Text search
            const matchesQuery = !query || 
              service.name?.toLowerCase().includes(query.toLowerCase()) ||
              service.description?.toLowerCase().includes(query.toLowerCase());

            // Category filter
            const matchesCategory = !filters.category || 
              service.category?.toLowerCase() === filters.category.toLowerCase();

            // Price filters
            let matchesPrice = true;
            if (filters.minPrice || filters.maxPrice) {
              const price = parseFloat(service.price) || 0;
              if (filters.minPrice && price < parseFloat(filters.minPrice)) matchesPrice = false;
              if (filters.maxPrice && price > parseFloat(filters.maxPrice)) matchesPrice = false;
            }

            return matchesQuery && matchesCategory && matchesPrice;
          });

          results.push(...filtered.map(service => ({ ...service, category })));
        }
      }

      return {
        query,
        services: results,
        count: results.length,
        filters,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error searching services:', error.message);
      throw error;
    }
  }

  // Get popular services
  async getPopularServices() {
    try {
      const index = await this.getIndex();
      const popularServices = [];
      
      // Collect popular services from all categories
      for (const [category, filename] of Object.entries(index.services)) {
        const services = await this.getCachedData(filename);
        
        if (Array.isArray(services)) {
          const popular = services.filter(service => service.popular === true);
          popularServices.push(...popular.map(service => ({ ...service, category })));
        }
      }

      return {
        services: popularServices,
        count: popularServices.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting popular services:', error.message);
      throw error;
    }
  }

  // Get featured services
  async getFeaturedServices() {
    try {
      const index = await this.getIndex();
      const featuredServices = [];
      
      // Collect featured services from all categories
      for (const [category, filename] of Object.entries(index.services)) {
        const services = await this.getCachedData(filename);
        
        if (Array.isArray(services)) {
          const featured = services.filter(service => service.featured === true);
          featuredServices.push(...featured.map(service => ({ ...service, category })));
        }
      }

      return {
        services: featuredServices,
        count: featuredServices.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting featured services:', error.message);
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('✅ Data cache cleared');
  }

  // Get cache status
  getCacheStatus() {
    const now = Date.now();
    const status = {};
    
    for (const [filename, cached] of this.cache.entries()) {
      const age = now - cached.timestamp;
      const expired = age > this.cacheExpiry;
      status[filename] = {
        cached: true,
        age: Math.round(age / 1000), // seconds
        expired,
        dataSize: JSON.stringify(cached.data).length
      };
    }

    return {
      cacheSize: this.cache.size,
      cacheExpiry: this.cacheExpiry / 1000, // seconds
      files: status,
      timestamp: new Date().toISOString()
    };
  }
}

// Create and export singleton instance
const dataService = new DataService();
module.exports = dataService;
