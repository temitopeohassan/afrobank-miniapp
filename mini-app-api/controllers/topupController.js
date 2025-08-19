// controllers/topupController.js

const fetch = require('node-fetch');

// Get fresh authentication token
async function getReloadlyToken() {
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
      audience: 'https://topups.reloadly.com'
    })
  };

  try {
    console.log('🔄 Getting fresh authentication token...');
    
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Authentication failed:', {
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

    console.log('✅ Authentication successful');
    return data.access_token;
  } catch (err) {
    console.error('❌ Error getting authentication token:', err.message);
    throw err;
  }
}

// Send airtime top-up
const sendTopup = async (req, res) => {
  const { operatorId, amount, recipientPhone, senderPhone, recipientEmail, countryCode } = req.body;
  console.log('📡 POST /send-topup - Processing top-up request');
  console.log('📦 Request data:', {
    operatorId,
    amount,
    recipientPhone,
    senderPhone,
    recipientEmail,
    countryCode
  });

  try {
    // Validate required fields
    if (!operatorId || !amount || !recipientPhone || !countryCode) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['operatorId', 'amount', 'recipientPhone', 'countryCode']
      });
    }

    // Get fresh authentication token
    const accessToken = await getReloadlyToken();
    if (!accessToken) {
      throw new Error('Failed to get authentication token');
    }

    const url = 'https://topups.reloadly.com/topups';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/com.reloadly.topups-v1+json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        operatorId,
        amount,
        useLocalAmount: true,
        recipientEmail,
        recipientPhone: {
          countryCode: countryCode,
          number: recipientPhone
        },
        senderPhone: {
          countryCode: 'NG',
          number: senderPhone || '0000000000'
        }
      })
    };

    console.log('🔄 Sending request to API...');
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      throw new Error(data.message || 'Failed to process topup');
    }

    console.log('✅ API response:', JSON.stringify(data, null, 2));
    
    // Return success response
    res.json({
      success: true,
      message: 'Topup processed successfully',
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error processing top-up:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to process topup',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Get topup operators
const getOperators = async (req, res) => {
  try {
    const accessToken = await getReloadlyToken();
    const { countryCode = 'NG' } = req.query;

    const url = `https://topups.reloadly.com/operators?countryCode=${countryCode}`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.topups-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch operators');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching operators:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch operators',
      details: err.message
    });
  }
};

// Get topup products
const getProducts = async (req, res) => {
  try {
    const accessToken = await getReloadlyToken();
    const { operatorId } = req.params;

    if (!operatorId) {
      return res.status(400).json({
        error: 'Operator ID is required'
      });
    }

    const url = `https://topups.reloadly.com/operators/${operatorId}/products`;
    const options = {
      method: 'GET',
      headers: {
        'Accept': 'application/com.reloadly.topups-v1+json',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch products');
    }

    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Error fetching products:', err.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      details: err.message
    });
  }
};

module.exports = {
  sendTopup,
  getOperators,
  getProducts
};
