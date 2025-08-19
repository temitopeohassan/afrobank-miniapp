// lib/api.ts - API service functions for Afro Bank Mini App

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Utility Bills API
export const utilityAPI = {
  // Get all utility billers
  getBillers: (params?: { page?: number; size?: number; countryCode?: string; billerType?: string; billerName?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.countryCode) queryParams.append('countryCode', params.countryCode);
    if (params?.billerType) queryParams.append('billerType', params.billerType);
    if (params?.billerName) queryParams.append('billerName', params.billerName);
    
    const query = queryParams.toString();
    return apiRequest(`/api/utility/billers${query ? `?${query}` : ''}`);
  },

  // Get utility biller by ID
  getBillerById: (billerId: string) => 
    apiRequest(`/api/utility/billers/${billerId}`),

  // Get utility biller products
  getBillerProducts: (billerId: string, params?: { page?: number; size?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    
    const query = queryParams.toString();
    return apiRequest(`/api/utility/billers/${billerId}/products${query ? `?${query}` : ''}`);
  },

  // Validate utility bill
  validateBill: (data: { billerId: string; customerNumber: string; amount?: number; billType?: string }) =>
    apiRequest('/api/utility/bills/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Pay utility bill
  payBill: (data: {
    billerId: string;
    customerNumber: string;
    amount: number;
    billType?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    reference?: string;
    billNumber?: string;
    dueDate?: string;
    billPeriod?: string;
  }) =>
    apiRequest('/api/utility/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get utility bill by ID
  getBillById: (billId: string) =>
    apiRequest(`/api/utility/bills/${billId}`),

  // Get utility bills
  getBills: (params?: { page?: number; size?: number; status?: string; billerId?: string; customerNumber?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.billerId) queryParams.append('billerId', params.billerId);
    if (params?.customerNumber) queryParams.append('customerNumber', params.customerNumber);
    
    const query = queryParams.toString();
    return apiRequest(`/api/utility/bills${query ? `?${query}` : ''}`);
  },

  // Get utility bill types
  getBillTypes: () => apiRequest('/api/utility/bill-types'),

  // Get utility countries
  getCountries: () => apiRequest('/api/utility/countries'),
};

// Gift Cards API
export const giftCardAPI = {
  // Get all gift card products
  getProducts: (params?: { page?: number; size?: number; countryCode?: string; categoryId?: string; brandId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.countryCode) queryParams.append('countryCode', params.countryCode);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.brandId) queryParams.append('brandId', params.brandId);
    
    const query = queryParams.toString();
    return apiRequest(`/api/giftcards/products${query ? `?${query}` : ''}`);
  },

  // Get gift card product by ID
  getProductById: (productId: string) =>
    apiRequest(`/api/giftcards/products/${productId}`),

  // Get gift card categories
  getCategories: () => apiRequest('/api/giftcards/categories'),

  // Get gift card brands
  getBrands: (params?: { page?: number; size?: number; countryCode?: string; categoryId?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.countryCode) queryParams.append('countryCode', params.countryCode);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    
    const query = queryParams.toString();
    return apiRequest(`/api/giftcards/brands${query ? `?${query}` : ''}`);
  },

  // Create gift card order
  createOrder: (data: {
    productId: string;
    quantity: number;
    unitPrice: number;
    senderName: string;
    senderEmail: string;
    recipientName?: string;
    recipientEmail?: string;
    message?: string;
    reference?: string;
  }) =>
    apiRequest('/api/giftcards/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get gift card order by ID
  getOrderById: (orderId: string) =>
    apiRequest(`/api/giftcards/orders/${orderId}`),

  // Get gift card orders
  getOrders: (params?: { page?: number; size?: number; status?: string; reference?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.reference) queryParams.append('reference', params.reference);
    
    const query = queryParams.toString();
    return apiRequest(`/api/giftcards/orders${query ? `?${query}` : ''}`);
  },

  // Get redemption instructions
  getRedemptionInstructions: (productId: string) =>
    apiRequest(`/api/giftcards/products/${productId}/redemption-instructions`),
};

// Top-up API (Airtime & Data)
export const topupAPI = {
  // Get Reloadly token
  getToken: () => apiRequest('/api/topup/token'),

  // Send top-up
  sendTopup: (data: {
    operatorId: string;
    amount: number;
    useLocalAmount: boolean;
    customFields?: any[];
    recipientEmail?: string;
    recipientPhoneNumber?: string;
    senderPhoneNumber?: string;
    reference?: string;
  }) =>
    apiRequest('/api/topup/send', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get operators
  getOperators: (params?: { page?: number; size?: number; countryCode?: string; operatorName?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.countryCode) queryParams.append('countryCode', params.countryCode);
    if (params?.operatorName) queryParams.append('operatorName', params.operatorName);
    
    const query = queryParams.toString();
    return apiRequest(`/api/topup/operators${query ? `?${query}` : ''}`);
  },

  // Get operator products
  getOperatorProducts: (operatorId: string, params?: { page?: number; size?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    
    const query = queryParams.toString();
    return apiRequest(`/api/topup/operators/${operatorId}/products${query ? `?${query}` : ''}`);
  },

  // Get top-up history
  getHistory: (params?: { page?: number; size?: number; status?: string; reference?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.reference) queryParams.append('reference', params.reference);
    
    const query = queryParams.toString();
    return apiRequest(`/api/topup/history${query ? `?${query}` : ''}`);
  },

  // Get top-up status
  getStatus: (transactionId: string) =>
    apiRequest(`/api/topup/status/${transactionId}`),
};

// Users API
export const userAPI = {
  // Get user profile
  getProfile: (walletAddress: string) =>
    apiRequest(`/api/users/profile/${walletAddress}`),

  // Update user profile
  updateProfile: (walletAddress: string, data: any) =>
    apiRequest(`/api/users/profile/${walletAddress}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Get user transactions
  getTransactions: (walletAddress: string, params?: { page?: number; size?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    
    const query = queryParams.toString();
    return apiRequest(`/api/users/profile/${walletAddress}/transactions${query ? `?${query}` : ''}`);
  },

  // Get user balance
  getBalance: (walletAddress: string) =>
    apiRequest(`/api/users/profile/${walletAddress}/balance`),
};

// Transactions API
export const transactionAPI = {
  // Submit failure report
  submitFailureReport: (data: {
    transactionId: string;
    reason: string;
    description?: string;
    contactEmail?: string;
  }) =>
    apiRequest('/api/transactions/failure-report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get transaction by ID
  getById: (transactionId: string) =>
    apiRequest(`/api/transactions/${transactionId}`),

  // Get all transactions
  getAll: (params?: { page?: number; size?: number; status?: string; type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    const query = queryParams.toString();
    return apiRequest(`/api/transactions${query ? `?${query}` : ''}`);
  },

  // Update transaction status
  updateStatus: (transactionId: string, data: { status: string; notes?: string }) =>
    apiRequest(`/api/transactions/${transactionId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Services API
export const serviceAPI = {
  // Get all services
  getAll: (params?: { page?: number; size?: number; category?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return apiRequest(`/api/services${query ? `?${query}` : ''}`);
  },

  // Get service by ID
  getById: (serviceId: string) =>
    apiRequest(`/api/services/${serviceId}`),

  // Get services by category
  getByCategory: (category: string, params?: { page?: number; size?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    
    const query = queryParams.toString();
    return apiRequest(`/api/services/category/${category}${query ? `?${query}` : ''}`);
  },

  // Get service categories
  getCategories: () => apiRequest('/api/services/categories/all'),

  // Search services
  search: (query: string, params?: { page?: number; size?: number; category?: string }) => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.category) queryParams.append('category', params.category);
    
    const queryString = queryParams.toString();
    return apiRequest(`/api/services/search?${queryString}`);
  },
};

// Health check
export const healthAPI = {
  check: () => apiRequest('/health'),
};

export default {
  utility: utilityAPI,
  giftCards: giftCardAPI,
  topup: topupAPI,
  users: userAPI,
  transactions: transactionAPI,
  services: serviceAPI,
  health: healthAPI,
};
