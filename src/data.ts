/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Asset, HistoricalDataPoint, UserSession } from './types';

// Helper to generate a realistic price history array
export function generateHistory(
  basePrice: number,
  pointsCount = 100,
  volatility = 0.015,
  drift = 0.0002
): HistoricalDataPoint[] {
  const history: HistoricalDataPoint[] = [];
  let currentPrice = basePrice * 0.9; // Start a bit lower
  
  // Set starting timestamp (e.g., past 24 hours in steps)
  const now = new Date();
  
  for (let i = pointsCount - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60 * 1000); // 5 minute intervals
    const changePercent = (Math.random() - 0.5 + drift) * volatility;
    currentPrice = currentPrice * (1 + changePercent);
    // Standard volume model based on price shifts
    const baseVolume = basePrice * (50 + Math.random() * 300);
    const volume = Math.round(baseVolume * (1 + Math.abs(changePercent) * 10));

    history.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(currentPrice.toFixed(2)),
      volume,
    });
  }

  return history;
}

export const INITIAL_ASSETS_DATA: Omit<Asset, 'history'>[] = [
  // Cryptocurrencies
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    category: 'crypto',
    price: 68420.5,
    change24h: 3.42,
    high24h: 69100.0,
    low24h: 66150.0,
    volume24h: 28450120,
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    category: 'crypto',
    price: 3480.25,
    change24h: -1.25,
    high24h: 3590.0,
    low24h: 3420.0,
    volume24h: 15410980,
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    category: 'crypto',
    price: 145.8,
    change24h: 6.88,
    high24h: 151.2,
    low24h: 135.5,
    volume24h: 8904500,
  },
  // Stocks
  {
    id: 'aapl',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'stock',
    price: 182.35,
    change24h: 0.85,
    high24h: 183.1,
    low24h: 180.75,
    volume24h: 12400500,
  },
  {
    id: 'tsla',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    category: 'stock',
    price: 178.9,
    change24h: -4.12,
    high24h: 188.5,
    low24h: 175.2,
    volume24h: 25400900,
  },
  {
    id: 'nvda',
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    category: 'stock',
    price: 875.12,
    change24h: 8.21,
    high24h: 884.2,
    low24h: 852.1,
    volume24h: 38500200,
  },
  {
    id: 'googl',
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    category: 'stock',
    price: 173.5,
    change24h: 1.15,
    high24h: 174.2,
    low24h: 171.4,
    volume24h: 8430200,
  },
  // Forex
  {
    id: 'eurusd',
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'forex',
    price: 1.0854,
    change24h: -0.12,
    high24h: 1.089,
    low24h: 1.0825,
    volume24h: 4200000,
  },
  {
    id: 'gbpusd',
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    category: 'forex',
    price: 1.2742,
    change24h: 0.18,
    high24h: 1.2785,
    low24h: 1.271,
    volume24h: 3100000,
  },
  {
    id: 'usdjpy',
    symbol: 'USD/JPY',
    name: 'US Dollar / Japanese Yen',
    category: 'forex',
    price: 156.45,
    change24h: 0.35,
    high24h: 156.9,
    low24h: 155.8,
    volume24h: 5300000,
  },
];

export const INITIAL_ASSETS: Asset[] = INITIAL_ASSETS_DATA.map((base) => {
  let vol = 0.01;
  let drift = 0.0001;
  if (base.category === 'crypto') {
    vol = 0.022;
  } else if (base.category === 'forex') {
    vol = 0.003;
  }
  return {
    ...base,
    history: generateHistory(base.price, 100, vol, drift),
  };
});

// Mock Initial User Session to default to in localStorage if not set yet
export const DEFAULT_USER: UserSession = {
  email: 'trader@demo.com',
  name: 'Demo Trader',
  balance: 25000.0, // starts with $25,000 artificial cash
  holdings: {
    BTC: { symbol: 'BTC', shares: 0.15, avgBuyPrice: 65120 },
    AAPL: { symbol: 'AAPL', shares: 10, avgBuyPrice: 175.5 },
    NVDA: { symbol: 'NVDA', shares: 5, avgBuyPrice: 850 },
  },
  watchlist: ['BTC', 'ETH', 'AAPL', 'TSLA', 'NVDA'],
  transactions: [
    {
      id: 'tx-171829038',
      symbol: 'BTC',
      type: 'BUY',
      shares: 0.15,
      price: 65120.0,
      total: 9768.0,
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      orderType: 'MARKET',
    },
    {
      id: 'tx-171829104',
      symbol: 'AAPL',
      type: 'BUY',
      shares: 10,
      price: 175.5,
      total: 1755.0,
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      orderType: 'MARKET',
    },
    {
      id: 'tx-171829328',
      symbol: 'NVDA',
      type: 'BUY',
      shares: 5,
      price: 850.0,
      total: 4250.0,
      timestamp: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      orderType: 'MARKET',
    },
  ],
  activeOrders: [],
};

// Generates a random set of order books surrounding the current asset price
export function generateOrderBook(price: number) {
  const bids: { price: number; size: number; total: number }[] = [];
  const asks: { price: number; size: number; total: number }[] = [];
  
  // Decide decimal steps based on asset worth
  const step = price > 1000 ? 5.0 : price > 100 ? 0.5 : price > 10 ? 0.05 : 0.0002;
  
  let totalBid = 0;
  for (let i = 1; i <= 8; i++) {
    const p = parseFloat((price - i * step).toFixed(price > 1000 ? 1 : price < 2 ? 4 : 2));
    const size = parseFloat((Math.random() * (price > 1000 ? 0.8 : 100) + 0.02).toFixed(price < 2 ? 1 : 2));
    totalBid += size;
    bids.push({ price: p, size, total: parseFloat(totalBid.toFixed(2)) });
  }

  let totalAsk = 0;
  for (let i = 1; i <= 8; i++) {
    const p = parseFloat((price + i * step).toFixed(price > 1000 ? 1 : price < 2 ? 4 : 2));
    const size = parseFloat((Math.random() * (price > 1000 ? 0.8 : 100) + 0.02).toFixed(price < 2 ? 1 : 2));
    totalAsk += size;
    asks.push({ price: p, size, total: parseFloat(totalAsk.toFixed(2)) });
  }

  return { bids, asks };
}

// Generate realistic financial news related to assets
export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url?: string;
}

export const MARKET_NEWS: NewsItem[] = [
  {
    id: 'news-1',
    title: 'NVIDIA hits new highs, analysts project continuing AI demand tailwind',
    source: 'Financial Times',
    timestamp: '15m ago',
    sentiment: 'positive',
  },
  {
    id: 'news-2',
    title: 'SEC evaluates new spot ETF options as regulatory clarity improves',
    source: 'CoinDesk',
    timestamp: '45m ago',
    sentiment: 'positive',
  },
  {
    id: 'news-3',
    title: 'Tesla delivery figures face headwinds amid factory scaling timelines',
    source: 'Bloomberg',
    timestamp: '2h ago',
    sentiment: 'negative',
  },
  {
    id: 'news-4',
    title: 'Federal Reserve hints at steady interest rates at upcoming policy session',
    source: 'Reuters',
    timestamp: '3h ago',
    sentiment: 'neutral',
  },
  {
    id: 'news-5',
    title: 'Apple prepares next-generation chips integrated with deep neural cores',
    source: 'TechCrunch',
    timestamp: '4h ago',
    sentiment: 'positive',
  },
  {
    id: 'news-6',
    title: 'FX Markets quiet ahead of critical employment indices data releases',
    source: 'Wall Street Journal',
    timestamp: '6h ago',
    sentiment: 'neutral',
  },
];
