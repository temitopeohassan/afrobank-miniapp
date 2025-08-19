// routes/giftCardRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getAllGiftCardProducts,
  getGiftCardProductById,
  getGiftCardCategories,
  getGiftCardBrands,
  createGiftCardOrder,
  getGiftCardOrderById,
  getGiftCardOrders,
  getRedemptionInstructions
} = require('../controllers/giftCardController');

// Gift Card Products
router.get('/products', getAllGiftCardProducts);
router.get('/products/:productId', getGiftCardProductById);
router.get('/products/:productId/redemption-instructions', getRedemptionInstructions);

// Gift Card Categories
router.get('/categories', getGiftCardCategories);

// Gift Card Brands
router.get('/brands', getGiftCardBrands);

// Gift Card Orders
router.post('/orders', createGiftCardOrder);
router.get('/orders', getGiftCardOrders);
router.get('/orders/:orderId', getGiftCardOrderById);

// Gift Card Search (placeholder for future implementation)
router.get('/search', (req, res) => {
  const { q: query, category, brand, minPrice, maxPrice } = req.query;
  res.json({
    message: 'Gift card search endpoint - to be implemented with advanced filtering',
    query,
    filters: { category, brand, minPrice, maxPrice },
    timestamp: new Date().toISOString()
  });
});

// Gift Card Analytics (placeholder for future implementation)
router.get('/analytics/popular', (req, res) => {
  res.json({
    message: 'Popular gift cards analytics endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

// Gift Card Recommendations (placeholder for future implementation)
router.get('/recommendations/:userId', (req, res) => {
  const { userId } = req.params;
  res.json({
    message: 'Gift card recommendations endpoint - to be implemented with ML',
    userId,
    timestamp: new Date().toISOString()
  });
});

// Gift Card Bulk Operations (placeholder for future implementation)
router.post('/bulk-orders', (req, res) => {
  res.json({
    message: 'Bulk gift card orders endpoint - to be implemented',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
