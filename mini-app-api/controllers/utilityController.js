// controllers/utilityController.js

const fetch = require('node-fetch');

// Get fresh authentication token for utility payments API
async function getUtilityToken() {
  if (!process.env.API_CLIENT_ID || !process.env.API_CLIENT_SECRET) {
    throw new Error('API credentials are not properly configured');
  }

  const url = 'https://auth.reloadly.com/oauth/token';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.API_CLIENT_ID,
      client_secret: process.env.API_CLIENT_SECRET,
      grant_type: 'client_credentials',
      audience: 'https://utilitypayments.reloadly.com'
    })
  };

  try {
    console.log('🔄 Getting fresh utility payments authentication token...');
    
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Utility payments authentication failed:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      throw new Error(`Authentication failed: ${data.message || 'Unknown error'}`);
    }

    if (!data.access_token) {
      console.error('❌ No access token in response:', data);
      throw new Error('No access token received');
    }

    console.log('✅ Utility payments authentication successful');
    return data.access_token;
  } catch (err) {
    console.error('❌ Error getting utility payments authentication token:', err.message);
    throw err;
  }
}

// Get utility billers
const getUtilityBillers = async (req, res) => {
  try {
    const { page = 1, size = 20, countryCode, billerType, billerName } = req.query;
    
    const accessToken = await getUtilityToken();
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (countryCode) queryParams.append('countryCode', countryCode);
    if (billerType) queryParams.append('billerType', billerType);
    if (billerName) queryParams.append('billerName', billerName);

    const url = `https://utilitypayments.reloadly.com/billers?${queryParams.toString()}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching utility billers...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch utility billers');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching utility billers:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility billers',
      details: err.message
    });
  }
};

// Get utility biller by ID
const getUtilityBillerById = async (req, res) => {
  try {
    const { billerId } = req.params;
    
    if (!billerId) {
      return res.status(400).json({
        error: 'Biller ID is required'
      });
    }

    const accessToken = await getUtilityToken();
    
    const url = `https://utilitypayments.reloadly.com/billers/${billerId}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`🔄 Fetching utility biller: ${billerId}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch utility biller');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching utility biller:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility biller',
      details: err.message
    });
  }
};

// Get utility biller products
const getUtilityBillerProducts = async (req, res) => {
  try {
    const { billerId } = req.params;
    const { page = 1, size = 20 } = req.query;
    
    if (!billerId) {
      return res.status(400).json({
        error: 'Biller ID is required'
      });
    }

    const accessToken = await getUtilityToken();
    
    const url = `https://utilitypayments.reloadly.com/billers/${billerId}/products?page=${page}&size=${size}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`🔄 Fetching utility biller products: ${billerId}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch utility biller products');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching utility biller products:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility biller products',
      details: err.message
    });
  }
};

// Validate utility bill
const validateUtilityBill = async (req, res) => {
  try {
    const { billerId, customerNumber, amount, billType } = req.body;
    
    // Validate required fields
    if (!billerId || !customerNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['billerId', 'customerNumber']
      });
    }

    const accessToken = await getUtilityToken();
    
    const url = 'https://utilitypayments.reloadly.com/bills/validate';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        billerId,
        customerNumber,
        amount: amount || null,
        billType: billType || 'FIXED_AMOUNT'
      })
    };

    console.log('🔄 Validating utility bill...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to validate utility bill');
    }

    res.json({
      success: true,
      message: 'Utility bill validated successfully',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error validating utility bill:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to validate utility bill',
      details: err.message
    });
  }
};

// Pay utility bill
const payUtilityBill = async (req, res) => {
  try {
    const { 
      billerId, 
      customerNumber, 
      amount, 
      billType,
      customerName,
      customerEmail,
      customerPhone,
      reference,
      billNumber,
      dueDate,
      billPeriod
    } = req.body;

    // Validate required fields
    if (!billerId || !customerNumber || !amount) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['billerId', 'customerNumber', 'amount']
      });
    }

    const accessToken = await getUtilityToken();
    
    const url = 'https://utilitypayments.reloadly.com/bills';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        billerId,
        customerNumber,
        amount: parseFloat(amount),
        billType: billType || 'FIXED_AMOUNT',
        customerName: customerName || 'Customer',
        customerEmail: customerEmail || '',
        customerPhone: customerPhone || '',
        reference: reference || `utility-${Date.now()}`,
        billNumber: billNumber || '',
        dueDate: dueDate || null,
        billPeriod: billPeriod || null
      })
    };

    console.log('🔄 Processing utility bill payment...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process utility bill payment');
    }

    res.json({
      success: true,
      message: 'Utility bill payment processed successfully',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error processing utility bill payment:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process utility bill payment',
      details: err.message
    });
  }
};

// Get utility bill by ID
const getUtilityBillById = async (req, res) => {
  try {
    const { billId } = req.params;
    
    if (!billId) {
      return res.status(400).json({
        error: 'Bill ID is required'
      });
    }

    const accessToken = await getUtilityToken();
    
    const url = `https://utilitypayments.reloadly.com/bills/${billId}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`🔄 Fetching utility bill: ${billId}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch utility bill');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching utility bill:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility bill',
      details: err.message
    });
  }
};

// Get utility bills with pagination
const getUtilityBills = async (req, res) => {
  try {
    const { page = 1, size = 20, status, billerId, customerNumber } = req.query;
    
    const accessToken = await getUtilityToken();
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (status) queryParams.append('status', status);
    if (billerId) queryParams.append('billerId', billerId);
    if (customerNumber) queryParams.append('customerNumber', customerNumber);

    const url = `https://utilitypayments.reloadly.com/bills?${queryParams.toString()}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching utility bills...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch utility bills');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching utility bills:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility bills',
      details: err.message
    });
  }
};

// Get utility bill types
const getUtilityBillTypes = async (req, res) => {
  try {
    const accessToken = await getUtilityToken();
    
    const url = 'https://utilitypayments.reloadly.com/bill-types';
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching utility bill types...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch utility bill types');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching utility bill types:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility bill types',
      details: err.message
    });
  }
};

// Get utility countries
const getUtilityCountries = async (req, res) => {
  try {
    const accessToken = await getUtilityToken();
    
    const url = 'https://utilitypayments.reloadly.com/countries';
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.utilitypayments-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching utility countries...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch utility countries');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching utility countries:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch utility countries',
      details: err.message
    });
  }
};

module.exports = {
  getUtilityBillers,
  getUtilityBillerById,
  getUtilityBillerProducts,
  validateUtilityBill,
  payUtilityBill,
  getUtilityBillById,
  getUtilityBills,
  getUtilityBillTypes,
  getUtilityCountries
};
