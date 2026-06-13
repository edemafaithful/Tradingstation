/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Asset, UserSession } from '../types';
import { TrendingUp, TrendingDown, ClipboardList, Trash2, Clock, Briefcase } from 'lucide-react';

interface PortfolioProps {
  userSession: UserSession;
  assets: Asset[];
  onCancelLimitOrder: (orderId: string) => void;
}

export default function Portfolio({ userSession, assets, onCancelLimitOrder }: PortfolioProps) {
  const [activeTab, setActiveTab] = useState<'holdings' | 'transactions' | 'orders'>('holdings');

  // Compute live valuation of individual holdings dynamically based on current market asset price
  const holdingsValuation = Object.values(userSession.holdings).map((holding) => {
    const liveAsset = assets.find((a) => a.symbol === holding.symbol);
    const livePrice = liveAsset?.price || holding.avgBuyPrice;
    const marketValue = holding.shares * livePrice;
    const initialCost = holding.shares * holding.avgBuyPrice;
    const profitLoss = marketValue - initialCost;
    const roiPercentage = initialCost > 0 ? (profitLoss / initialCost) * 100 : 0;

    return {
      ...holding,
      livePrice,
      marketValue,
      initialCost,
      profitLoss,
      roiPercentage,
    };
  });

  // Calculate high level aggregated metrics
  const totalHoldingsValue = holdingsValuation.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCostBasis = holdingsValuation.reduce((sum, h) => sum + h.initialCost, 0);
  const netLiquidValue = userSession.balance + totalHoldingsValue;
  const overallProfitLoss = totalHoldingsValue - totalCostBasis;
  const overallRoiPercent = totalCostBasis > 0 ? (overallProfitLoss / totalCostBasis) * 100 : 0;

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 flex flex-col h-full shadow-2xl" id="portfolio-container-widget">
      
      {/* Top Portfolio Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-950/60 border border-slate-855 rounded-2xl p-5 shadow-inner">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Net Liquidating Worth</span>
          <span className="text-base md:text-lg font-extrabold font-mono text-emerald-400">
            ${netLiquidValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="text-[9px] font-semibold text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Mark valuations live</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-855 rounded-2xl p-5 shadow-inner">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Available Cash</span>
          <span className="text-base md:text-lg font-extrabold font-mono text-white">
            ${userSession.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] font-bold text-slate-550 mt-2 block tracking-wide">SANDBOX DOLLARS</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-855 rounded-2xl p-5 shadow-inner">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Holdings Value</span>
          <span className="text-base md:text-lg font-extrabold font-mono text-white">${totalHoldingsValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="text-[9px] font-bold text-slate-550 mt-2 block tracking-wide">{Object.keys(userSession.holdings).length} SEPARATE ASSETS</span>
        </div>

        <div className="bg-slate-950/60 border border-slate-855 rounded-2xl p-5 shadow-inner">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Total Unrealized PNL</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-sm md:text-base font-extrabold font-mono ${overallProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${overallProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${overallProfitLoss >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-450'}`}>
              {overallProfitLoss >= 0 ? '+' : ''}{overallRoiPercent.toFixed(2)}%
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-550 mt-1.5 block tracking-wide">P/L ALL TIME</span>
        </div>
      </div>

      {/* Navigation tabs inside widget */}
      <div className="border-b border-slate-800/60 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-slate-950 border border-slate-855 p-1 rounded-xl gap-1 max-w-sm" id="portfolio-tabs">
          <button
            id="tab-holdings-btn"
            onClick={() => setActiveTab('holdings')}
            className={`px-4 py-2 text-[10px] font-bold tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'holdings'
                ? 'bg-slate-800 text-emerald-450 border border-slate-705 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>MY POSITION ({holdingsValuation.length})</span>
          </button>
          
          <button
            id="tab-transactions-btn"
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 text-[10px] font-bold tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-slate-800 text-emerald-455 border border-slate-705 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>HISTORY ({userSession.transactions.length})</span>
          </button>
          
          <button
            id="tab-orders-btn"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-[10px] font-bold tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-slate-800 text-emerald-455 border border-slate-705 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>QUEUED ({userSession.activeOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Grid Table Display Area */}
      <div className="flex-1 overflow-x-auto space-y-1" id="portfolio-tables-scroller">
        
        {/* TAB 1: Holdings */}
        {activeTab === 'holdings' && (
          <table className="w-full text-left border-collapse min-w-[600px]" id="holdings-rendered-table">
            <thead>
              <tr className="border-b border-slate-800/60 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                <th className="py-3 px-3">Symbol</th>
                <th className="py-3 px-3">Position</th>
                <th className="py-3 px-3">Avg Buy Price</th>
                <th className="py-3 px-3">Live Price</th>
                <th className="py-3 px-3">Market Worth</th>
                <th className="py-3 px-3 text-right">Net Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-855 text-xs">
              {holdingsValuation.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    You currently have no active asset holdings. Browse and buy assets using the console.
                  </td>
                </tr>
              ) : (
                holdingsValuation.map((h) => (
                  <tr key={h.symbol} className="hover:bg-slate-850/40 rounded-xl transition-all duration-150">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-2xs">
                          {h.symbol}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-200 font-bold">
                      {h.shares.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-400 font-medium">
                      ${h.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300 font-medium">
                      ${h.livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-white text-emerald-400 font-bold">
                      ${h.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-right pr-4">
                      <div className="flex flex-col items-end">
                        <span className={`font-mono font-bold flex items-center gap-1 ${h.profitLoss >= 0 ? 'text-emerald-450' : 'text-rose-450'}`}>
                          {h.profitLoss >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          ${Math.abs(h.profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-[10px] font-mono font-bold mt-0.5 ${h.profitLoss >= 0 ? 'text-emerald-400/80' : 'text-rose-450/80'}`}>
                          {h.profitLoss >= 0 ? '+' : ''}{h.roiPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 2: Workstation Transactions History */}
        {activeTab === 'transactions' && (
          <table className="w-full text-left border-collapse min-w-[600px]" id="transactions-rendered-table">
            <thead>
              <tr className="border-b border-slate-800/60 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                <th className="py-3 px-3">Symbol</th>
                <th className="py-3 px-3">Side</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Trade Price</th>
                <th className="py-3 px-3">Total Value</th>
                <th className="py-3 px-3">Order Type</th>
                <th className="py-3 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-855 text-xs text-slate-300">
              {userSession.transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    No transactions executed during this trading workspace instance.
                  </td>
                </tr>
              ) : (
                [...userSession.transactions].reverse().map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-850/40 rounded-xl transition-all duration-150">
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-2xs">
                        {tx.symbol}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 animate-fade-in">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest ${
                        tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-100">{tx.shares.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300 font-medium">${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-3 font-mono text-white font-bold">${tx.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-3.5 px-3 font-mono text-[9px] font-bold uppercase text-slate-400 tracking-wider bg-slate-800/20 px-1.5 py-0.5 rounded">{tx.orderType}</td>
                    <td className="py-3.5 px-3 text-right text-slate-500 font-mono text-[10px] pr-4">
                      {new Date(tx.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* TAB 3: Placed Limit / Stop Orders */}
        {activeTab === 'orders' && (
          <table className="w-full text-left border-collapse min-w-[600px]" id="orders-queued-table">
            <thead>
              <tr className="border-b border-slate-800/60 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                <th className="py-3 px-3">Symbol</th>
                <th className="py-3 px-3">Side</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Trigger Pricing</th>
                <th className="py-3 px-3">Order Class</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-855 text-xs">
              {userSession.activeOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    No active limit or stop orders currently waiting in the queue.
                  </td>
                </tr>
              ) : (
                userSession.activeOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-850/40 rounded-xl transition-all duration-150">
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-white bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-2xs">
                        {ord.symbol}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest ${
                        ord.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                      }`}>
                        {ord.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-200 font-bold">{ord.shares.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                    <td className="py-3.5 px-3 font-mono text-amber-400 font-bold">${ord.targetPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-3">
                      <span className="text-[9px] font-extrabold tracking-widest uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                        {ord.orderType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[10px]">
                      {new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-3 text-right pr-4">
                      <button
                        id={`cancel-order-${ord.id}`}
                        onClick={() => onCancelLimitOrder(ord.id)}
                        className="p-1 px-3 bg-slate-950 border border-slate-850 hover:border-rose-500/30 text-rose-450 hover:text-white hover:bg-rose-500/10 rounded-lg inline-flex items-center gap-1 transition-all text-[10px] cursor-pointer font-bold duration-150 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>CANCEL</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
