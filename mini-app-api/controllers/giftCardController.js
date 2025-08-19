// controllers/giftCardController.js

const fetch = require('node-fetch');

// Get fresh authentication token for gift cards API
async function getGiftCardToken() {
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
      audience: 'https://giftcards.reloadly.com'
    })
  };

  try {
    console.log('🔄 Getting fresh gift card authentication token...');
    
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Gift card authentication failed:', {
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

    console.log('✅ Gift card authentication successful');
    return data.access_token;
  } catch (err) {
    console.error('❌ Error getting gift card authentication token:', err.message);
    throw err;
  }
}

// Get all gift card products
const getAllGiftCardProducts = async (req, res) => {
  try {
    const { page = 1, size = 20, countryCode, categoryId, brandId } = req.query;
    
    const accessToken = await getGiftCardToken();
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (countryCode) queryParams.append('countryCode', countryCode);
    if (categoryId) queryParams.append('categoryId', categoryId);
    if (brandId) queryParams.append('brandId', brandId);

    const url = `https://giftcards.reloadly.com/products?${queryParams.toString()}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching gift card products...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift card products');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching gift card products:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gift card products',
      details: err.message
    });
  }
};

// Get gift card product by ID
const getGiftCardProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    const accessToken = await getGiftCardToken();
    
    const url = `https://giftcards.reloadly.com/products/${productId}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`🔄 Fetching gift card product: ${productId}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift card product');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching gift card product:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gift card product',
      details: err.message
    });
  }
};

// Get gift card categories
const getGiftCardCategories = async (req, res) => {
  try {
    const accessToken = await getGiftCardToken();
    
    const url = 'https://giftcards.reloadly.com/categories';
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching gift card categories...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift card categories');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching gift card categories:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gift card categories',
      details: err.message
    });
  }
};

// Get gift card brands
const getGiftCardBrands = async (req, res) => {
  try {
    const { page = 1, size = 20, countryCode, categoryId } = req.query;
    
    const accessToken = await getGiftCardToken();
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (countryCode) queryParams.append('countryCode', countryCode);
    if (categoryId) queryParams.append('categoryId', categoryId);

    const url = `https://giftcards.reloadly.com/brands?${queryParams.toString()}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching gift card brands...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift card brands');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching gift card brands:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gift card brands',
      details: err.message
    });
  }
};

// Create gift card order
const createGiftCardOrder = async (req, res) => {
  try {
    const { 
      productId, 
      quantity, 
      unitPrice, 
      senderName, 
      senderEmail, 
      recipientName, 
      recipientEmail,
      message,
      reference 
    } = req.body;

    // Validate required fields
    if (!productId || !quantity || !unitPrice || !senderName || !senderEmail) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['productId', 'quantity', 'unitPrice', 'senderName', 'senderEmail']
      });
    }

    const accessToken = await getGiftCardToken();
    
    const url = 'https://giftcards.reloadly.com/orders';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        productId,
        quantity: parseInt(quantity),
        unitPrice: parseFloat(unitPrice),
        senderName,
        senderEmail,
        recipientName: recipientName || senderName,
        recipientEmail: recipientEmail || senderEmail,
        message: message || '',
        reference: reference || `gift-${Date.now()}`
      })
    };

    console.log('🔄 Creating gift card order...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create gift card order');
    }

    res.json({
      success: true,
      message: 'Gift card order created successfully',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error creating gift card order:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to create gift card order',
      details: err.message
    });
  }
};

// Get gift card order by ID
const getGiftCardOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required'
      });
    }

    const accessToken = await getGiftCardToken();
    
    const url = `https://giftcards.reloadly.com/orders/${orderId}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`🔄 Fetching gift card order: ${orderId}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift card order');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching gift card order:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gift card order',
      details: err.message
    });
  }
};

// Get gift card orders with pagination
const getGiftCardOrders = async (req, res) => {
  try {
    const { page = 1, size = 20, status, reference } = req.query;
    
    const accessToken = await getGiftCardToken();
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString()
    });
    
    if (status) queryParams.append('status', status);
    if (reference) queryParams.append('reference', reference);

    const url = `https://giftcards.reloadly.com/orders?${queryParams.toString()}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log('🔄 Fetching gift card orders...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch gift card orders');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching gift card orders:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch gift card orders',
      details: err.message
    });
  }
};

// Get gift card redemption instructions
const getRedemptionInstructions = async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        error: 'Product ID is required'
      });
    }

    const accessToken = await getGiftCardToken();
    
    const url = `https://giftcards.reloadly.com/products/${productId}/redemption-instructions`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.giftcards-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    console.log(`🔄 Fetching redemption instructions for product: ${productId}`);
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch redemption instructions');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching redemption instructions:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch redemption instructions',
      details: err.message
    });
  }
};

module.exports = {
  getAllGiftCardProducts,
  getGiftCardProductById,
  getGiftCardCategories,
  getGiftCardBrands,
  createGiftCardOrder,
  getGiftCardOrderById,
  getGiftCardOrders,
  getRedemptionInstructions
};
