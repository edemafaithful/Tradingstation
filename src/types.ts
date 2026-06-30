/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HistoricalDataPoint {
  time: string;
  price: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export type AssetCategory = 'crypto' | 'stock' | 'forex';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number; // percentage e.g. -2.5
  high24h: number;
  low24h: number;
  volume24h: number;
  history: HistoricalDataPoint[];
}

export interface UserSession {
  email: string;
  name: string;
  balance: number; // Cash balance available
  holdings: Record<string, Holding>; // key is asset symbol
  watchlist: string[]; // array of asset symbols
  transactions: Transaction[];
  activeOrders: LimitOrder[];
}

export interface Holding {
  symbol: string;
  shares: number;
  avgBuyPrice: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  total: number;
  timestamp: string;
  orderType: 'MARKET' | 'LIMIT' | 'STOP';
}

export interface LimitOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  shares: number;
  targetPrice: number;
  orderType: 'LIMIT' | 'STOP';
  timestamp: string;
}

export interface OrderBookItem {
  price: number;
  size: number;
  total: number;
}
