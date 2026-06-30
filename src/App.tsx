/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  LogOut, Star, AlertCircle, Sparkles, Newspaper, 
  Wallet, Shield, Bell, CheckCircle2, TrendingUp, TrendingDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { Asset, UserSession, LimitOrder, Transaction } from './types';
import { INITIAL_ASSETS, DEFAULT_USER, MARKET_NEWS } from './data';
import Auth from './components/Auth';
import MarketChart from './components/MarketChart';
import TradingConsole from './components/TradingConsole';
import OrderBook from './components/OrderBook';
import MarketWatchlist from './components/MarketWatchlist';
import Portfolio from './components/Portfolio';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [activeNotifications, setActiveNotifications] = useState<{ id: string; text: string; success: boolean }[]>([]);

  // Use ref to keep track of current assets during intervals without recreating state functions
  const assetsRef = useRef<Asset[]>([]);

  // Toast Notification Generator
  const pushNotification = (text: string, success = true) => {
    const id = Date.now().toString() + Math.random().toString();
    setActiveNotifications((prev) => [...prev, { id, text, success }]);
    setTimeout(() => {
      setActiveNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4500);
  };

  // 1. Initialize session on mount
  useEffect(() => {
    // Standard mock assets init
    const savedAssetsList = localStorage.getItem('trading_platform_assets');
    let loadedAssets: Asset[] = [];
    if (savedAssetsList) {
      loadedAssets = JSON.parse(savedAssetsList);
    } else {
      loadedAssets = INITIAL_ASSETS;
      localStorage.setItem('trading_platform_assets', JSON.stringify(loadedAssets));
    }
    setAssets(loadedAssets);
    assetsRef.current = loadedAssets;
    
    // Default select BTC or first item
    setSelectedAsset(loadedAssets.find((a) => a.symbol === 'BTC') || loadedAssets[0]);

    // Active session credentials load
    const liveSessionRaw = localStorage.getItem('trading_platform_current_user');
    if (liveSessionRaw) {
      setCurrentUser(JSON.parse(liveSessionRaw));
    }
  }, []);

  // Sync back to local users database
  const syncSessionToDb = (updatedUser: UserSession) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('trading_platform_current_user', JSON.stringify(updatedUser));
    
    // Sync to user records array
    const usersRaw = localStorage.getItem('trading_platform_users');
    if (usersRaw) {
      const usersList = JSON.parse(usersRaw);
      const userIndex = usersList.findIndex((u: any) => u.email.toLowerCase() === updatedUser.email.toLowerCase());
      if (userIndex !== -1) {
        usersList[userIndex] = {
          ...usersList[userIndex],
          balance: updatedUser.balance,
          holdings: updatedUser.holdings,
          watchlist: updatedUser.watchlist,
          transactions: updatedUser.transactions,
          activeOrders: updatedUser.activeOrders,
        };
        localStorage.setItem('trading_platform_users', JSON.stringify(usersList));
      }
    }
  };

  // LOGIN SUCCESS HANDLER
  const handleLoginSuccess = (email: string, name: string, initialBalance?: number) => {
    const usersRaw = localStorage.getItem('trading_platform_users');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    
    // Determine existing custom profiles
    let existingProfile = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
    
    let userSessionData: UserSession;
    if (email === 'trader@demo.com') {
      userSessionData = DEFAULT_USER;
    } else if (existingProfile) {
      userSessionData = {
        email: existingProfile.email,
        name: existingProfile.name,
        balance: existingProfile.balance,
        holdings: existingProfile.holdings || {},
        watchlist: existingProfile.watchlist || ['BTC', 'ETH', 'AAPL', 'TSLA'],
        transactions: existingProfile.transactions || [],
        activeOrders: existingProfile.activeOrders || []
      };
    } else {
      userSessionData = {
        email,
        name,
        balance: initialBalance || 25000.0,
        holdings: {},
        watchlist: ['BTC', 'ETH', 'AAPL', 'TSLA'],
        transactions: [],
        activeOrders: []
      };
    }

    setCurrentUser(userSessionData);
    localStorage.setItem('trading_platform_current_user', JSON.stringify(userSessionData));
    pushNotification(`Authorized successfully as ${name}. Terminal logged in!`);
  };

  // SIGN OUT HANDLER
  const handleSignOut = () => {
    localStorage.removeItem('trading_platform_current_user');
    setCurrentUser(null);
    pushNotification('Securely disconnected from active workstation nodes.');
  };

  // 2. Interval Market-maker simulated Ticker
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      if (assetsRef.current.length === 0) return;

      const incrementedAssets = assetsRef.current.map((asset) => {
        // Adjust price fluctuation volatility based on asset type
        let variance = 0.003;
        if (asset.category === 'crypto') {
          variance = 0.005; 
        } else if (asset.category === 'forex') {
          variance = 0.0003;
        }

        const upDrift = 0.00008; // subtle average positive drift over time
        const priceChangeRatio = (Math.random() - 0.49 + upDrift) * variance;
        const previousPrice = asset.price;
        const newPrice = parseFloat((previousPrice * (1 + priceChangeRatio)).toFixed(asset.price > 1000 ? 1 : asset.price < 2 ? 4 : 2));

        // recalculate aggregates
        const high24h = Math.max(asset.high24h, newPrice);
        const low24h = Math.min(asset.low24h, newPrice);
        const dailyShiftPercent = asset.change24h + (priceChangeRatio * 100);

        // 15-second grouping for real-time dynamic candle updates (exactly like TradingView)
        const updatedHistory = [...asset.history];
        const now = new Date();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const secondsVal = Math.floor(now.getSeconds() / 15) * 15;
        const secondsStr = secondsVal.toString().padStart(2, '0');
        const candleTimeStr = `${now.getHours().toString().padStart(2, '0')}:${minutes}:${secondsStr}`;

        const volumeTick = Math.round(asset.volume24h * 0.0001 * (1 + Math.abs(priceChangeRatio) * 5));
        const lastPoint = updatedHistory.length > 0 ? { ...updatedHistory[updatedHistory.length - 1] } : null;

        if (lastPoint && lastPoint.time === candleTimeStr) {
          lastPoint.price = newPrice;
          lastPoint.close = newPrice;
          lastPoint.high = Math.max(lastPoint.high ?? newPrice, newPrice);
          lastPoint.low = Math.min(lastPoint.low ?? newPrice, newPrice);
          lastPoint.volume += volumeTick;
          updatedHistory[updatedHistory.length - 1] = lastPoint;
        } else {
          const previousClose = lastPoint ? (lastPoint.close ?? lastPoint.price) : newPrice;
          const open = previousClose;
          const close = newPrice;
          const high = Math.max(open, close);
          const low = Math.min(open, close);

          updatedHistory.push({
            time: candleTimeStr,
            price: newPrice,
            volume: volumeTick,
            open,
            high,
            low,
            close,
          });

          if (updatedHistory.length >= 120) {
            updatedHistory.shift();
          }
        }

        return {
          ...asset,
          price: newPrice,
          high24h,
          low24h,
          change24h: parseFloat(dailyShiftPercent.toFixed(2)),
          history: updatedHistory,
        };
      });

      // Update states
      setAssets(incrementedAssets);
      assetsRef.current = incrementedAssets;

      // Make sure our active selected asset maintains its pointers
      if (selectedAsset) {
        const matchingLatest = incrementedAssets.find((a) => a.id === selectedAsset.id);
        if (matchingLatest) {
          setSelectedAsset(matchingLatest);
        }
      }

      // Check current open Limit or Stop orders against updated prices!
      if (currentUser && currentUser.activeOrders.length > 0) {
        let orderMatchedOccurred = false;
        const workingOrders: LimitOrder[] = [];
        const closedOrders: { ord: LimitOrder; priceHit: number }[] = [];

        currentUser.activeOrders.forEach((order) => {
          const liveAsset = incrementedAssets.find((a) => a.symbol === order.symbol);
          if (!liveAsset) {
            workingOrders.push(order);
            return;
          }

          let triggers = false;
          if (order.orderType === 'LIMIT') {
            if (order.type === 'BUY' && liveAsset.price <= order.targetPrice) triggers = true;
            if (order.type === 'SELL' && liveAsset.price >= order.targetPrice) triggers = true;
          } else { // STOP Loss orders
            if (order.type === 'BUY' && liveAsset.price >= order.targetPrice) triggers = true;
            if (order.type === 'SELL' && liveAsset.price <= order.targetPrice) triggers = true;
          }

          if (triggers) {
            closedOrders.push({ ord: order, priceHit: liveAsset.price });
            orderMatchedOccurred = true;
          } else {
            workingOrders.push(order);
          }
        });

        if (orderMatchedOccurred) {
          // Process orders that got hit in the match queue
          let activeBalance = currentUser.balance;
          const holdingsRec = { ...currentUser.holdings };
          const additionsToTx: Transaction[] = [];

          closedOrders.forEach(({ ord, priceHit }) => {
            const costBasis = ord.shares * priceHit;
            const feeRate = 0.0015;
            const fee = costBasis * feeRate;

            if (ord.type === 'BUY') {
              const fullCost = costBasis + fee;
              if (activeBalance >= fullCost) {
                activeBalance -= fullCost;
                const existing = holdingsRec[ord.symbol];
                if (existing) {
                  const combinedShares = existing.shares + ord.shares;
                  const weightedPrice = ((existing.avgBuyPrice * existing.shares) + (priceHit * ord.shares)) / combinedShares;
                  holdingsRec[ord.symbol] = {
                    symbol: ord.symbol,
                    shares: combinedShares,
                    avgBuyPrice: parseFloat(weightedPrice.toFixed(2))
                  };
                } else {
                  holdingsRec[ord.symbol] = {
                    symbol: ord.symbol,
                    shares: ord.shares,
                    avgBuyPrice: priceHit
                  };
                }

                additionsToTx.push({
                  id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  symbol: ord.symbol,
                  type: 'BUY',
                  shares: ord.shares,
                  price: priceHit,
                  total: parseFloat(fullCost.toFixed(2)),
                  timestamp: new Date().toISOString(),
                  orderType: ord.orderType,
                });

                pushNotification(`LIMIT FILLED: Acquired ${ord.shares} ${ord.symbol} at target $${priceHit.toLocaleString()}`);
              } else {
                pushNotification(`LIMIT EXPIRED/CANCELLED: Insufficient funds to fill ${ord.shares} ${ord.symbol}`, false);
              }
            } else {
              // Sell order
              const existHolding = holdingsRec[ord.symbol];
              if (existHolding && existHolding.shares >= ord.shares) {
                const totalRevenue = costBasis - fee;
                activeBalance += totalRevenue;
                
                const updatedShares = existHolding.shares - ord.shares;
                if (updatedShares > 0) {
                  holdingsRec[ord.symbol] = {
                    ...existHolding,
                    shares: updatedShares,
                  };
                } else {
                  delete holdingsRec[ord.symbol];
                }

                additionsToTx.push({
                  id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                  symbol: ord.symbol,
                  type: 'SELL',
                  shares: ord.shares,
                  price: priceHit,
                  total: parseFloat(totalRevenue.toFixed(2)),
                  timestamp: new Date().toISOString(),
                  orderType: ord.orderType,
                });

                pushNotification(`STOP FILLED: Sold ${ord.shares} ${ord.symbol} at target $${priceHit.toLocaleString()}`);
              } else {
                pushNotification(`STOP CANCELLED: You no longer hold required ${ord.symbol} to sell.`, false);
              }
            }
          });

          // write new structure down
          const synchronizedUserSession: UserSession = {
            ...currentUser,
            balance: parseFloat(activeBalance.toFixed(2)),
            holdings: holdingsRec,
            activeOrders: workingOrders,
            transactions: [...currentUser.transactions, ...additionsToTx],
          };
          syncSessionToDb(synchronizedUserSession);
        }
      }

    }, 3000);

    return () => clearInterval(tickerInterval);
  }, [currentUser, selectedAsset]);

  // PLACE MARKET ORDERS
  const handlePlaceMarketOrder = (
    type: 'BUY' | 'SELL',
    shares: number,
    price: number,
    orderType: 'MARKET'
  ) => {
    if (!currentUser) return;

    const costBasis = shares * price;
    const feeRate = 0.0015;
    const computedFee = costBasis * feeRate;

    let nextBalance = currentUser.balance;
    const nextHoldings = { ...currentUser.holdings };

    if (type === 'BUY') {
      const actualCostPaid = costBasis + computedFee;
      nextBalance -= actualCostPaid;

      const currentHolding = nextHoldings[selectedAsset!.symbol];
      if (currentHolding) {
        const nextShares = currentHolding.shares + shares;
        const nextAvg = ((currentHolding.shares * currentHolding.avgBuyPrice) + (price * shares)) / nextShares;
        nextHoldings[selectedAsset!.symbol] = {
          symbol: selectedAsset!.symbol,
          shares: nextShares,
          avgBuyPrice: parseFloat(nextAvg.toFixed(2))
        };
      } else {
        nextHoldings[selectedAsset!.symbol] = {
          symbol: selectedAsset!.symbol,
          shares: shares,
          avgBuyPrice: price
        };
      }
    } else {
      // Selling
      const actualRevenueEarned = costBasis - computedFee;
      nextBalance += actualRevenueEarned;

      const currentHolding = nextHoldings[selectedAsset!.symbol];
      if (currentHolding) {
        const nextShares = currentHolding.shares - shares;
        if (nextShares > 0) {
          nextHoldings[selectedAsset!.symbol] = {
            ...currentHolding,
            shares: nextShares,
          };
        } else {
          delete nextHoldings[selectedAsset!.symbol];
        }
      }
    }

    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      symbol: selectedAsset!.symbol,
      type,
      shares,
      price,
      total: parseFloat((type === 'BUY' ? costBasis + computedFee : costBasis - computedFee).toFixed(2)),
      timestamp: new Date().toISOString(),
      orderType,
    };

    const updatedSession: UserSession = {
      ...currentUser,
      balance: parseFloat(nextBalance.toFixed(2)),
      holdings: nextHoldings,
      transactions: [...currentUser.transactions, newTransaction],
    };

    syncSessionToDb(updatedSession);
    pushNotification(`Trade processed! ${type} ${shares} ${selectedAsset!.symbol} filled at $${price.toLocaleString()}`);
  };

  // PLACE QUEUED LIMIT / STOP ORDERS
  const handlePlaceLimitOrder = (
    type: 'BUY' | 'SELL',
    shares: number,
    targetPrice: number,
    orderType: 'LIMIT' | 'STOP'
  ) => {
    if (!currentUser) return;

    const newOrder: LimitOrder = {
      id: `order-${Date.now()}`,
      symbol: selectedAsset!.symbol,
      type,
      shares,
      targetPrice,
      orderType,
      timestamp: new Date().toISOString()
    };

    const updatedSession: UserSession = {
      ...currentUser,
      activeOrders: [...currentUser.activeOrders, newOrder]
    };

    syncSessionToDb(updatedSession);
    pushNotification(`Order Scheduled: Queued ${newOrder.type} ${newOrder.shares} ${newOrder.symbol} at target $${targetPrice.toLocaleString()}`);
  };

  // CANCEL QUEUED LIMIT / STOP ORDERS
  const handleCancelLimitOrder = (orderId: string) => {
    if (!currentUser) return;

    const filteredQueue = currentUser.activeOrders.filter((o) => o.id !== orderId);
    const updatedSession: UserSession = {
      ...currentUser,
      activeOrders: filteredQueue
    };

    syncSessionToDb(updatedSession);
    pushNotification('Active pending limit order cancelled successfully.', false);
  };

  // WATCHLIST TOGGLE
  const handleToggleWatchlist = (symbol: string) => {
    if (!currentUser) return;

    let updatedWatchlist = [...currentUser.watchlist];
    if (updatedWatchlist.includes(symbol)) {
      updatedWatchlist = updatedWatchlist.filter((s) => s !== symbol);
      pushNotification(`Removed ${symbol} from favorites list`, false);
    } else {
      updatedWatchlist.push(symbol);
      pushNotification(`Added ${symbol} to favorites list!`);
    }

    const updatedSession: UserSession = {
      ...currentUser,
      watchlist: updatedWatchlist
    };
    syncSessionToDb(updatedSession);
  };

  // Authentication Guard: If no session, show auth desk
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Backstage Atmospheric Subtle Glows for Premium Polish Theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-gradient-to-b from-emerald-500/5 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute -top-[150px] -right-[150px] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Floating Desktop Notification Banners */}
      <div className="fixed top-6 right-6 space-y-3 pointer-events-none max-w-sm w-full z-50" id="floating-notification-rack">
        <AnimatePresence>
          {activeNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-2xl backdrop-blur-xl pointer-events-auto transition-all ${
                notif.success 
                  ? 'bg-slate-950/90 border-emerald-500/30 text-emerald-400 shadow-emerald-950/10' 
                  : 'bg-slate-950/90 border-rose-500/30 text-rose-400 shadow-rose-950/10'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {notif.success ? (
                  <div className="p-1 bg-emerald-950 border border-emerald-500/20 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="p-1 bg-rose-950 border border-rose-500/20 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase block tracking-widest text-slate-400">System Activity Alert</span>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed font-medium font-sans">{notif.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* HEADER SECTION */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/60 sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between" id="platform-master-header">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xs font-extrabold tracking-[0.2em] text-white uppercase flex items-center gap-2">
              <span>TRADING STATION</span>
              <span className="text-[9px] font-bold text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 rounded-full tracking-normal">
                SANDBOX LIVE
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wider font-medium mt-0.5">Interactive Multi-Asset Terminal Hub</p>
          </div>
        </div>

        {/* User Session Metadata and Logging Actions */}
        <div className="flex items-center gap-4">
          {/* Cash balance display */}
          <div className="hidden sm:flex items-center gap-2.5 bg-slate-950/90 border border-slate-800/80 px-4 py-1.5 rounded-xl shadow-inner shadow-black/40">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            <div className="text-right">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block leading-none mb-1">Available Cash</span>
              <span className="text-xs font-mono font-bold text-emerald-400 leading-none block">
                ${currentUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Logged Username / Logout button pack */}
          <div className="flex items-center gap-4 pl-4 border-l border-slate-800/60">
            <div className="text-right">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Terminal Key</span>
              <span className="text-xs font-bold text-slate-200 block mt-0.5">{currentUser.name}</span>
            </div>
            
            <button
              id="header-logout-btn"
              onClick={handleSignOut}
              className="p-2.5 bg-slate-950 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer transition-all duration-150 shadow-sm"
              title="Disconnect station"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE STATION: Unified Single-View Dashboard */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full" id="trading-desk-app-frame">
        
        {/* Row 1: Watchlist & Primary Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Panel: Asset Selection & Filters (Spans 1 Column) */}
          <div className="lg:col-span-1 flex flex-col justify-between">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Market Watch</span>
                <span className="text-[10px] text-indigo-400 font-bold tracking-widest bg-indigo-950 px-2 py-0.5 border border-indigo-500/10 rounded">
                  {assets.length} TRADABLE
                </span>
              </div>
              <MarketWatchlist
                assets={assets}
                selectedAsset={selectedAsset || assets[0]}
                onSelectAsset={setSelectedAsset}
                watchlistSymbols={currentUser.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>

            {/* Simulated Live News Feed inside Left sidebar */}
            <div className="mt-6 bg-slate-900 border border-slate-850 rounded-xl p-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
                <Newspaper className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Market Headlines</h3>
              </div>
              <div className="space-y-3 max-h-[145px] overflow-y-auto pr-1">
                {MARKET_NEWS.map((news) => (
                  <div key={news.id} className="border-b border-slate-850/60 pb-2 last:border-0 last:pb-0">
                    <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase block">{news.source} • {news.timestamp}</span>
                    <p className="text-2xs font-medium text-slate-200 hover:text-emerald-400 transition-colors mt-0.5 leading-relaxed cursor-pointer">
                      {news.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Panel: Visual Chart (Spans 2 Columns on desktop) */}
          {selectedAsset ? (
            <div className="lg:col-span-2 flex flex-col justify-between h-full">
              <div className="flex-1 h-full">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Interactive Market Graph</span>
                  <span className="text-[10px] text-slate-500 font-mono">Quotes updated live every 3s</span>
                </div>
                <MarketChart selectedAsset={selectedAsset} />
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-xl p-6 flex flex-col items-center justify-center text-center">
              <span className="w-8 h-8 rounded-full border border-slate-700 animate-spin border-t-transparent mb-2" />
              <p className="text-xs text-slate-400 font-medium">Streaming active pricing indices...</p>
            </div>
          )}

          {/* Right Panel: Trading Order Console & Book depth (Spans 1 Column) */}
          <div className="lg:col-span-1 flex flex-col justify-between gap-6">
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Terminal Console</span>
              {selectedAsset && (
                <TradingConsole
                  selectedAsset={selectedAsset}
                  userSession={currentUser}
                  onPlaceMarketOrder={handlePlaceMarketOrder}
                  onPlaceLimitOrder={handlePlaceLimitOrder}
                />
              )}
            </div>
          </div>

        </div>

        {/* Row 2: Secondary Visual structures - Order Book Ladders & Portfolio Accounts (Symmetric Grid Split) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Depth matches Book (Spans 1 Column) */}
          <div className="lg:col-span-1">
            {selectedAsset && <OrderBook selectedAsset={selectedAsset} />}
          </div>

          {/* User Portfolio Positions, Orders and Trades ledger (Spans 3 Columns) */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Portfolio & Ledger Logs</span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-505/10 rounded px-2 py-0.5">Active Station</span>
            </div>
            <Portfolio 
              userSession={currentUser} 
              assets={assets} 
              onCancelLimitOrder={handleCancelLimitOrder} 
            />
          </div>

        </div>
      </main>

      {/* FOOTER STATS STATED */}
      <footer className="bg-slate-900/60 border-t border-slate-850 px-6 py-4 mt-12 text-center text-2xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 Trading Platform Sandbox Node. Licensed Apache-2.0. Custom indicators pre-calculated.
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>Matching Core: Online</span>
            </span>
            <span>Feed speed: 3.0s ticker</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
