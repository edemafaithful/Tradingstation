/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Asset, OrderBookItem } from '../types';
import { generateOrderBook } from '../data';

interface OrderBookProps {
  selectedAsset: Asset;
}

export default function OrderBook({ selectedAsset }: OrderBookProps) {
  const [bids, setBids] = useState<OrderBookItem[]>([]);
  const [asks, setAsks] = useState<OrderBookItem[]>([]);

  // Regenerate/shift order books when asset price updates
  useEffect(() => {
    const book = generateOrderBook(selectedAsset.price);
    // Sort asks descending so highest is on top or ascending so closest to price is in middle
    // Standard configuration: Asks sorted descending, Bids sorted descending
    setBids(book.bids);
    setAsks(book.asks.slice().reverse()); // Reverse asks so the lowest ask is closest to the middle
  }, [selectedAsset.price, selectedAsset.id]);

  const maxTotalBid = bids[bids.length - 1]?.total || 1;
  const maxTotalAsk = asks[0]?.total || 1;
  const globalMaxTotal = Math.max(maxTotalBid, maxTotalAsk);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 flex flex-col h-full shadow-2xl justify-between" id="order-book-widget">
      
      {/* Widget Title */}
      <div className="flex items-center justify-between border-b border-slate-800/50 pb-3 mb-4">
        <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Real-Time Order Book</h3>
        <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-md">
          LIVE DIRECT FEED
        </span>
      </div>

      <div className="grid grid-cols-3 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest pb-2 mb-2 border-b border-slate-855">
        <span>Price ($)</span>
        <span className="text-right">Size ({selectedAsset.symbol})</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (Sell Orders) - Red */}
      <div className="space-y-1 flex-1 overflow-hidden pr-0.5 max-h-[140px]" id="order-asks-list">
        {asks.map((ask, index) => {
          const depthPercent = Math.min(100, (ask.total / globalMaxTotal) * 100);
          return (
            <div 
              key={`ask-${index}`} 
              className="grid grid-cols-3 text-xs font-mono py-1 relative cursor-pointer hover:bg-slate-800/45 rounded-lg transition-all"
            >
              {/* Depth background overlay on the right side */}
              <div 
                className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none transition-all duration-300 rounded-lg"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-rose-450 font-bold z-10 pl-1.5">
                {ask.price.toLocaleString(undefined, { 
                  minimumFractionDigits: selectedAsset.price > 1000 ? 1 : selectedAsset.price < 2 ? 4 : 2 
                })}
              </span>
              <span className="text-right text-slate-300 font-bold z-10">{ask.size.toLocaleString()}</span>
              <span className="text-right text-slate-400 font-medium z-10 pr-1.5">{ask.total.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* Spread/Mid Market Marker */}
      <div className="my-3 py-2 border-y border-slate-855 bg-slate-950/60 px-3 rounded-xl flex items-center justify-between font-mono" id="market-spread-bar">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Spread Offset</span>
        <span className="text-xs font-bold text-slate-300">
          ${(selectedAsset.price * 0.0004).toLocaleString(undefined, { 
            minimumFractionDigits: selectedAsset.price > 1000 ? 1 : selectedAsset.price < 2 ? 4 : 2 
          })} ({((selectedAsset.price * 0.0004) / selectedAsset.price * 100).toFixed(3)}%)
        </span>
      </div>

      {/* Bids (Buy Orders) - Green */}
      <div className="space-y-1 flex-1 overflow-hidden pr-0.5 max-h-[140px]" id="order-bids-list">
        {bids.map((bid, index) => {
          const depthPercent = Math.min(100, (bid.total / globalMaxTotal) * 100);
          return (
            <div 
              key={`bid-${index}`} 
              className="grid grid-cols-3 text-xs font-mono py-1 relative cursor-pointer hover:bg-slate-800/45 rounded-lg transition-all"
            >
              {/* Depth background overlay on the left/right side */}
              <div 
                className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none transition-all duration-300 rounded-lg"
                style={{ width: `${depthPercent}%` }}
              />
              <span className="text-emerald-400 font-bold z-10 pl-1.5">
                {bid.price.toLocaleString(undefined, { 
                  minimumFractionDigits: selectedAsset.price > 1000 ? 1 : selectedAsset.price < 2 ? 4 : 2 
                })}
              </span>
              <span className="text-right text-slate-300 font-bold z-10">{bid.size.toLocaleString()}</span>
              <span className="text-right text-slate-400 font-medium z-10 pr-1.5">{bid.total.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
