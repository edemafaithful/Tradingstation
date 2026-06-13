/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Asset, UserSession } from '../types';
import { Wallet, Info, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';

interface TradingConsoleProps {
  selectedAsset: Asset;
  userSession: UserSession;
  onPlaceMarketOrder: (type: 'BUY' | 'SELL', shares: number, price: number, orderType: 'MARKET') => void;
  onPlaceLimitOrder: (type: 'BUY' | 'SELL', shares: number, targetPrice: number, orderType: 'LIMIT' | 'STOP') => void;
}

export default function TradingConsole({
  selectedAsset,
  userSession,
  onPlaceMarketOrder,
  onPlaceLimitOrder
}: TradingConsoleProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('MARKET');
  
  const [amount, setAmount] = useState<string>('');
  const [triggerPrice, setTriggerPrice] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Auto-fill price or reset inputs on asset change
  useEffect(() => {
    setAmount('');
    setErrorMsg('');
    setSuccessMsg('');
    if (orderType !== 'MARKET') {
      setTriggerPrice(selectedAsset.price.toString());
    } else {
      setTriggerPrice('');
    }
  }, [selectedAsset, orderType]);

  const activeAssetHolding = userSession.holdings[selectedAsset.symbol]?.shares || 0;
  
  // Calculate potential financial metrics
  const parsedAmount = parseFloat(amount) || 0;
  const currentAssetPrice = selectedAsset.price;
  const targetExecutionPrice = orderType === 'MARKET' ? currentAssetPrice : (parseFloat(triggerPrice) || currentAssetPrice);
  
  const rawSubTotal = parsedAmount * targetExecutionPrice;
  const feeRate = 0.0015; // 0.15% brokerage base fee
  const calculatedFee = rawSubTotal * feeRate;
  const totalCostOrRevenue = side === 'BUY' ? (rawSubTotal + calculatedFee) : (rawSubTotal - calculatedFee);

  // Size Ratios click shortcuts
  const handleShortcutSize = (pct: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (side === 'BUY') {
      const maxPurchasePower = userSession.balance / (targetExecutionPrice * (1 + feeRate));
      if (maxPurchasePower <= 0) {
        setAmount('0');
        return;
      }
      const quantity = maxPurchasePower * pct;
      // Truncate to clean decimal counts depending on price weight
      setAmount(quantity > 100 ? Math.floor(quantity).toString() : parseFloat(quantity.toFixed(4)).toString());
    } else {
      const quantity = activeAssetHolding * pct;
      setAmount(quantity > 100 ? Math.floor(quantity).toString() : parseFloat(quantity.toFixed(4)).toString());
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const qty = parseFloat(amount);
    if (!qty || qty <= 0 || isNaN(qty)) {
      setErrorMsg('Enter a positive asset quantity to trade.');
      return;
    }

    if (orderType !== 'MARKET') {
      const targetP = parseFloat(triggerPrice);
      if (!targetP || targetP <= 0 || isNaN(targetP)) {
        setErrorMsg('Set a valid target activation price.');
        return;
      }

      if (side === 'BUY' && totalCostOrRevenue > userSession.balance) {
        setErrorMsg(`Insufficient funds in your account. Needed: $${totalCostOrRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
        return;
      }

      onPlaceLimitOrder(side, qty, targetP, orderType);
      setSuccessMsg(`Active ${orderType} order placed successfully for ${qty} ${selectedAsset.symbol}!`);
      setAmount('');
    } else {
      // MARKET triggers immediately
      if (side === 'BUY') {
        if (totalCostOrRevenue > userSession.balance) {
          setErrorMsg(`Insufficient funds in your account. Needed: $${totalCostOrRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
          return;
        }
      } else {
        if (qty > activeAssetHolding) {
          setErrorMsg(`Insufficient holding. You only own ${activeAssetHolding} ${selectedAsset.symbol} to sell.`);
          return;
        }
      }

      onPlaceMarketOrder(side, qty, selectedAsset.price, 'MARKET');
      setSuccessMsg(`Successfully executed order! ${side === 'BUY' ? 'Acquired' : 'Liquidated'} ${qty} ${selectedAsset.symbol}.`);
      setAmount('');
    }
  };

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between h-full shadow-2xl" id="trading-console-card">
      <div>
        {/* Toggle Buy / Sell Tabs */}
        <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1 mb-5">
          <button
            id="console-side-buy"
            type="button"
            onClick={() => { setSide('BUY'); setErrorMsg(''); setSuccessMsg(''); setAmount(''); }}
            className={`py-2 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-900/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            BUY
          </button>
          <button
            id="console-side-sell"
            type="button"
            onClick={() => { setSide('SELL'); setErrorMsg(''); setSuccessMsg(''); setAmount(''); }}
            className={`py-2 rounded-lg font-bold text-xs tracking-wider transition-all cursor-pointer ${
              side === 'SELL'
                ? 'bg-gradient-to-r from-rose-500 to-red-500 text-slate-950 shadow-md shadow-rose-900/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Order Type Toggle selectors */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-950 border border-slate-850 p-1 rounded-xl mb-4 text-[10px] font-bold text-slate-400 tracking-wider" id="order-type-tabs">
          {(['MARKET', 'LIMIT', 'STOP'] as const).map((t) => (
            <button
              key={t}
              id={`ordertype-tab-${t}`}
              type="button"
              onClick={() => setOrderType(t)}
              className={`flex-1 text-center py-1.5 rounded-lg transition-all cursor-pointer ${
                orderType === t 
                  ? 'bg-slate-800 text-white font-extrabold border border-slate-700/50 shadow-sm' 
                  : 'hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmitOrder} className="space-y-4">
          
          {/* Active Holdings indicator */}
          <div className="flex items-center justify-between py-1.5 px-3 bg-slate-950/60 border border-slate-850 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Balance</span>
            {side === 'BUY' ? (
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                ${userSession.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {activeAssetHolding.toLocaleString()} {selectedAsset.symbol}
              </span>
            )}
          </div>

          {/* Trigger price for limit orders */}
          {orderType !== 'MARKET' && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                <span>{orderType} Price ($ USD)</span>
                <span className="text-slate-500 font-mono text-[9px] font-bold">Last: ${selectedAsset.price}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-bold">$</span>
                <input
                  id="order-price-input"
                  type="number"
                  step="any"
                  required
                  value={triggerPrice}
                  onChange={(e) => setTriggerPrice(e.target.value)}
                  className="w-full bg-slate-950/85 border border-slate-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl pl-8 pr-4 py-2 bg-slate-950 text-sm text-white font-mono placeholder-slate-705 outline-none transition-all duration-150"
                />
              </div>
            </div>
          )}

          {/* Asset Quantity Amount */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>Amount of Shares/Tokens</span>
              <span className="text-[9px] text-slate-500 font-bold">Vol: {selectedAsset.symbol}</span>
            </label>
            <div className="relative">
              <input
                id="order-amount-input"
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setErrorMsg('');
                  setSuccessMsg('');
                  setAmount(e.target.value);
                }}
                className="w-full bg-slate-950/85 border border-slate-855 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl px-4 py-2 text-sm text-white font-mono placeholder-slate-705 outline-none transition-all duration-150"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs tracking-wider">
                {selectedAsset.symbol}
              </span>
            </div>
          </div>

          {/* Percentage sizing shortcuts */}
          <div className="grid grid-cols-4 gap-2">
            {[0.25, 0.50, 0.75, 1.00].map((pct) => (
              <button
                key={pct}
                id={`ratio-shortcut-${pct}`}
                type="button"
                onClick={() => handleShortcutSize(pct)}
                className="py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-855 hover:border-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              >
                {pct * 100}%
              </button>
            ))}
          </div>

          {/* Alert messages inside Form panel */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2 font-medium" id="console-form-error">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-medium animate-fade-in" id="console-form-success">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 animate-ping" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Estimated summary box */}
          <div className="bg-slate-950/80 border border-slate-855 rounded-xl p-4 text-[10px] font-bold text-slate-400 tracking-wider space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="uppercase text-slate-500 text-[9px]">Execution Baseline Price</span>
              <span className="text-white font-mono">
                ${targetExecutionPrice.toLocaleString(undefined, { 
                  minimumFractionDigits: targetExecutionPrice > 1000 ? 1 : targetExecutionPrice < 2 ? 4 : 2 
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase text-slate-500 text-[9px]">Slippage Broker Fee (0.15%)</span>
              <span className="text-white font-mono">${calculatedFee.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-850 my-1" />
            <div className="flex items-center justify-between text-white font-semibold">
              <span className="flex items-center gap-1 uppercase text-slate-350 text-[10px]">
                {side === 'BUY' ? 'Total Est. Cost' : 'Total Est. Return'}
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-help" title="Calculated as Amount * Price plus/minus brokerage commission charges." />
              </span>
              <span className="text-xs font-bold font-mono text-emerald-400">
                ${totalCostOrRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Interactive Trade Execution Button */}
          <button
            id="console-execute-order-btn"
            type="submit"
            className={`w-full font-extrabold text-xs tracking-[0.15em] py-3.5 rounded-xl border flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-150 active:scale-[0.99] uppercase shadow-md ${
              side === 'BUY'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-emerald-555 border-emerald-400/10 text-slate-950 shadow-emerald-900/10'
                : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-450 hover:to-rose-555 border-rose-400/10 text-slate-950 shadow-rose-900/10'
            }`}
          >
            {side === 'BUY' ? <ArrowUpRight className="w-4 h-4 text-slate-950" /> : <ArrowDownRight className="w-4 h-4 text-slate-950" />}
            <span>{side === 'BUY' ? 'SUBMIT BUY ORDER' : 'SUBMIT SELL ORDER'}</span>
          </button>
        </form>
      </div>

      <div className="mt-5 text-center">
        <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
          Safe Sandbox Environment • Instant Mock Matcher
        </span>
      </div>
    </div>
  );
}
