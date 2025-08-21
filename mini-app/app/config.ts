// App configuration
export const config = {
  app: {
    name: 'Afro Bank Mini App',
    version: '1.0.0',
    description: 'Your trusted financial partner',
  },
  
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    timeout: 30000,
  },
  
  blockchain: {
    supportedChains: [1, 137, 56], // Ethereum, Polygon, BSC
    defaultChain: 1,
  },
  
  features: {
    notifications: true,
    webhooks: true,
    userProfiles: true,
  },
  
  limits: {
    maxTransactionAmount: 10000,
    maxDailyTransactions: 50,
    maxUserProfiles: 5,
  },
} as const;

export type Config = typeof config;
