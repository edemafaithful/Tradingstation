/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Asset, AssetCategory } from '../types';
import { Search, Globe, Coins, Landmark, Star, StarOff } from 'lucide-react';

interface MarketWatchlistProps {
  assets: Asset[];
  selectedAsset: Asset;
  onSelectAsset: (asset: Asset) => void;
  watchlistSymbols: string[];
  onToggleWatchlist: (symbol: string) => void;
}

export default function MarketWatchlist({
  assets,
  selectedAsset,
  onSelectAsset,
  watchlistSymbols,
  onToggleWatchlist
}: MarketWatchlistProps) {
  const [activeCategory, setActiveCategory] = useState<'ALL' | AssetCategory | 'WATCHLIST'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering based on tab categories and text query
  const filteredAssets = assets.filter((asset) => {
    // 1. Text Search Filter
    const matchesQuery = 
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesQuery) return false;

    // 2. Tab Filter
    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'WATCHLIST') return watchlistSymbols.includes(asset.symbol);
    return asset.category === activeCategory;
  });

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 flex flex-col h-full shadow-2xl" id="market-watchlist-widget">
      
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          id="watchlist-search"
          type="text"
          placeholder="Search symbol or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-850 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-600 outline-none transition-all duration-150"
        />
      </div>

      {/* Categories Bar */}
      <div className="flex border-b border-slate-800/60 pb-3 mb-4 gap-1.5 overflow-x-auto scrollbar-none" id="asset-type-selectors">
        <button
          id="cat-tab-all"
          onClick={() => setActiveCategory('ALL')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-1 cursor-pointer transition-all duration-150 shrink-0 ${
            activeCategory === 'ALL'
              ? 'bg-slate-800 text-emerald-450 border border-slate-705 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <span>ALL</span>
        </button>
        <button
          id="cat-tab-watchlist"
          onClick={() => setActiveCategory('WATCHLIST')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-1.5 cursor-pointer transition-all duration-150 shrink-0 ${
            activeCategory === 'WATCHLIST'
              ? 'bg-slate-800 text-amber-400 border border-slate-705 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Star className="w-3 h-3 fill-amber-400/20 text-amber-400" />
          <span>FAVORITES</span>
        </button>
        <button
          id="cat-tab-crypto"
          onClick={() => setActiveCategory('crypto')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-1.5 cursor-pointer transition-all duration-150 shrink-0 ${
            activeCategory === 'crypto'
              ? 'bg-slate-800 text-blue-400 border border-slate-705 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Coins className="w-3 h-3" />
          <span>CRYPTO</span>
        </button>
        <button
          id="cat-tab-stock"
          onClick={() => setActiveCategory('stock')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-1.5 cursor-pointer transition-all duration-150 shrink-0 ${
            activeCategory === 'stock'
              ? 'bg-slate-800 text-purple-400 border border-slate-705 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Landmark className="w-3 h-3" />
          <span>STOCKS</span>
        </button>
        <button
          id="cat-tab-forex"
          onClick={() => setActiveCategory('forex')}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-1.5 cursor-pointer transition-all duration-150 shrink-0 ${
            activeCategory === 'forex'
              ? 'bg-slate-800 text-cyan-400 border border-slate-705 shadow-sm font-extrabold'
              : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Globe className="w-3 h-3" />
          <span>FX</span>
        </button>
      </div>

      {/* Asset List Container */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 hover:pr-0 transition-all" style={{ maxHeight: '420px' }} id="watchlist-assets-scroll">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs font-semibold tracking-wider uppercase">
            No matching assets
          </div>
        ) : (
          filteredAssets.map((asset) => {
            const isSelected = selectedAsset.id === asset.id;
            const inWatchlist = watchlistSymbols.includes(asset.symbol);
            const isPos = asset.change24h >= 0;

            return (
              <div
                key={asset.id}
                id={`asset-row-${asset.symbol.replace('/', '-')}`}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-150 cursor-pointer group ${
                  isSelected
                    ? 'bg-slate-800/80 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                    : 'bg-slate-950/40 border-slate-900/80 hover:bg-slate-850/60 hover:border-slate-800'
                }`}
                onClick={() => onSelectAsset(asset)}
              >
                <div className="flex items-center gap-2 max-w-[65%]">
                  {/* Favorite/Watchlist Toggle (Stops propagation to avoid select trigger) */}
                  <button
                    id={`fav-toggle-${asset.symbol.replace('/', '-')}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(asset.symbol);
                    }}
                    className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    {inWatchlist ? (
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ) : (
                      <StarOff className="w-3.5 h-3.5 text-slate-600 group-hover:block hidden" />
                    )}
                  </button>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-white tracking-wide">
                        {asset.symbol}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium truncate block max-w-full mt-0.5">
                      {asset.name}
                    </span>
                  </div>
                </div>

                {/* Pricing & Shifts */}
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-slate-100 block">
                    ${asset.price.toLocaleString(undefined, { 
                      minimumFractionDigits: asset.price > 1000 ? 1 : asset.price < 2 ? 4 : 2 
                    })}
                  </span>
                  <span className={`text-[10px] font-bold font-mono ${isPos ? 'text-emerald-400' : 'text-rose-450'}`}>
                    {isPos ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
