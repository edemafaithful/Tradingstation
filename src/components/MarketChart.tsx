/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Asset } from '../types';

interface MarketChartProps {
  selectedAsset: Asset;
}

// Custom shape for Recharts Bar element to render beautiful candlestick candles
const CandlestickShape = (props: any) => {
  const { x, width, payload, yAxis } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const isUp = close >= open;
  const color = isUp ? '#10b981' : '#f43f5e';

  let yOpen, yClose, yHigh, yLow;

  if (yAxis && typeof yAxis.scale === 'function') {
    yOpen = yAxis.scale(open);
    yClose = yAxis.scale(close);
    yHigh = yAxis.scale(high);
    yLow = yAxis.scale(low);
  } else {
    // Fallback if scale function is not available
    const { y, height } = props;
    const bodyHeight = Math.max(2, height);
    const priceDiff = Math.abs(open - close) || 0.0001;
    const pixelsPerPrice = bodyHeight / priceDiff;
    yOpen = isUp ? y : y + bodyHeight;
    yClose = isUp ? y + bodyHeight : y;
    yHigh = y - (high - Math.max(open, close)) * pixelsPerPrice;
    yLow = y + bodyHeight + (Math.min(open, close) - low) * pixelsPerPrice;
  }

  const centerX = x + width / 2;
  const rectY = Math.min(yOpen, yClose);
  const rectHeight = Math.max(2, Math.abs(yOpen - yClose));

  return (
    <g>
      {/* Wick / Shadow line */}
      <line
        x1={centerX}
        y1={yHigh}
        x2={centerX}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Candle Body */}
      <rect
        x={x}
        y={rectY}
        width={width}
        height={rectHeight}
        fill={isUp ? '#10b981' : '#f43f5e'}
        stroke={color}
        strokeWidth={1}
        rx={1.5}
      />
    </g>
  );
};

export default function MarketChart({ selectedAsset }: MarketChartProps) {
  const [chartType, setChartType] = useState<'area' | 'line' | 'candle'>('area');
  const [timeRange, setTimeRange] = useState<'5m' | '1h' | '24h' | 'ALL'>('24h');
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);

  // Filter historical data based on timeRange
  const filteredData = useMemo(() => {
    const totalPoints = selectedAsset.history.length;
    if (timeRange === '5m') {
      return selectedAsset.history.slice(totalPoints - 15);
    }
    if (timeRange === '1h') {
      return selectedAsset.history.slice(totalPoints - 40);
    }
    if (timeRange === '24h') {
      return selectedAsset.history.slice(totalPoints - 80);
    }
    return selectedAsset.history;
  }, [selectedAsset.history, timeRange]);

  // Calculate moving averages dynamically and utilize existing candle values or fallback
  const enrichedData = useMemo(() => {
    const data = filteredData.map((d, i) => {
      const price = d.price;
      const open = d.open !== undefined ? d.open : (i > 0 ? (filteredData[i - 1].close ?? filteredData[i - 1].price) : price * 0.995);
      const close = d.close !== undefined ? d.close : price;
      const high = d.high !== undefined ? d.high : Math.max(open, close) + (Math.abs(open - close) * 0.15 + price * 0.001);
      const low = d.low !== undefined ? d.low : Math.min(open, close) - (Math.abs(open - close) * 0.15 + price * 0.001);

      return {
        ...d,
        open,
        close,
        high,
        low,
        candle: [Math.min(open, close), Math.max(open, close)]
      };
    });
    
    // SMA 8 Period
    const windowSize = 8;
    for (let i = 0; i < data.length; i++) {
      if (i >= windowSize - 1) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          sum += data[i - j].price;
        }
        (data[i] as any).sma = parseFloat((sum / windowSize).toFixed(selectedAsset.price > 1000 ? 1 : 2));
      } else {
        (data[i] as any).sma = data[i].price;
      }
    }

    // EMA 8 Period
    const k = 2 / (windowSize + 1);
    let prevEma = data[0]?.price || 0;
    for (let i = 0; i < data.length; i++) {
      const price = data[i].price;
      const currentEma = price * k + prevEma * (1 - k);
      (data[i] as any).ema = parseFloat(currentEma.toFixed(selectedAsset.price > 1000 ? 1 : 2));
      prevEma = currentEma;
    }

    return data;
  }, [filteredData, selectedAsset.price]);

  const isPositive = selectedAsset.change24h >= 0;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';

  // Find min and max for chart scale adaptation including wicks if candlestick is active
  const yDomain = useMemo(() => {
    if (chartType === 'candle') {
      const highs = enrichedData.map(d => d.high);
      const lows = enrichedData.map(d => d.low);
      const maxH = Math.max(...highs, selectedAsset.price);
      const minL = Math.min(...lows, selectedAsset.price);
      const padding = (maxH - minL) * 0.08 || selectedAsset.price * 0.01;
      return [
        parseFloat((minL - padding).toFixed(selectedAsset.price > 1000 ? 0 : 4)),
        parseFloat((maxH + padding).toFixed(selectedAsset.price > 1000 ? 0 : 4))
      ];
    } else {
      const prices = filteredData.map(d => d.price);
      const maxPrice = Math.max(...prices, selectedAsset.price);
      const minPrice = Math.min(...prices, selectedAsset.price);
      const paddingRatio = (maxPrice - minPrice) * 0.05 || selectedAsset.price * 0.01;
      return [
        parseFloat((minPrice - paddingRatio).toFixed(selectedAsset.price > 1000 ? 0 : 4)),
        parseFloat((maxPrice + paddingRatio).toFixed(selectedAsset.price > 1000 ? 0 : 4))
      ];
    }
  }, [enrichedData, filteredData, chartType, selectedAsset.price]);

  return (
    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 flex flex-col h-full shadow-2xl relative" id="trading-chart-widget">
      
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/50 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-xl text-emerald-400 shadow-inner">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-emerald-400 tracking-wider font-mono">
                {selectedAsset.symbol}
              </span>
              <h2 className="text-sm font-bold text-white tracking-tight">{selectedAsset.name}</h2>
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              <span className="text-xl font-extrabold tracking-tight text-white font-mono leading-none">
                ${selectedAsset.price.toLocaleString(undefined, { 
                  minimumFractionDigits: selectedAsset.price > 1000 ? 1 : selectedAsset.price < 2 ? 4 : 2 
                })}
              </span>
              <span className={`text-[10px] font-bold flex items-center px-1.5 py-0.5 rounded-md ${
                isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {isPositive ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selectors */}
          <div className="bg-slate-950 border border-slate-850/80 p-1 rounded-xl flex text-[10px] font-bold text-slate-400 tracking-wider">
            {(['5m', '1h', '24h', 'ALL'] as const).map((range) => (
              <button
                key={range}
                id={`timeframe-btn-${range}`}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === range
                    ? 'bg-slate-800 text-white font-extrabold border border-slate-700/50 shadow-sm'
                    : 'hover:text-white hover:bg-slate-900/40'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Indicator togglers */}
          <div className="flex items-center gap-2 border-l border-slate-850 pl-2.5">
            <button
              id="toggle-sma"
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2.5 py-1.5 border rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                showSMA 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-550/40 shadow shadow-blue-950/20' 
                  : 'bg-slate-950 border-slate-855 text-slate-500 hover:text-slate-350 hover:bg-slate-900/30'
              }`}
            >
              SMA(8)
            </button>
            <button
              id="toggle-ema"
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2.5 py-1.5 border rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                showEMA 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-550/40 shadow shadow-purple-950/20' 
                  : 'bg-slate-950 border-slate-855 text-slate-500 hover:text-slate-350 hover:bg-slate-900/30'
              }`}
            >
              EMA(8)
            </button>
          </div>

          {/* Style selects */}
          <div className="bg-slate-950 border border-slate-855 p-1 rounded-xl flex text-[10px] font-bold text-slate-400 tracking-wider">
            <button
              id="charttype-btn-area"
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'area' ? 'bg-slate-800 text-emerald-400 font-extrabold border border-slate-700/50 shadow-sm' : 'hover:text-white hover:bg-slate-900/30'}`}
            >
              Area
            </button>
            <button
              id="charttype-btn-line"
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'line' ? 'bg-slate-800 text-emerald-400 font-extrabold border border-slate-700/50 shadow-sm' : 'hover:text-white hover:bg-slate-900/30'}`}
            >
              Line
            </button>
            <button
              id="charttype-btn-candle"
              onClick={() => setChartType('candle')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${chartType === 'candle' ? 'bg-slate-800 text-emerald-400 font-extrabold border border-slate-700/50 shadow-sm' : 'hover:text-white hover:bg-slate-900/30'}`}
            >
              Candle
            </button>
          </div>
        </div>
      </div>

      {/* Primary Price Chart Area */}
      <div className="flex-1 min-h-[260px] relative" id="charts-render-container">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={enrichedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={yDomain}
                stroke="#475569" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                itemStyle={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace' }}
                formatter={(val: any) => [`$${parseFloat(val).toLocaleString()}`, 'Price']}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
              />
              {showSMA && (
                <Line 
                  type="monotone" 
                  dataKey="sma" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="SMA 8"
                />
              )}
              {showEMA && (
                <Line 
                  type="monotone" 
                  dataKey="ema" 
                  stroke="#a855f7" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="EMA 8"
                />
              )}
            </AreaChart>
          ) : chartType === 'line' ? (
            <AreaChart data={enrichedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={yDomain}
                stroke="#475569" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                itemStyle={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace' }}
                formatter={(val: any) => [`$${parseFloat(val).toLocaleString()}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 4 }}
              />
              {showSMA && (
                <Line 
                  type="monotone" 
                  dataKey="sma" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  dot={false} 
                />
              )}
              {showEMA && (
                <Line 
                  type="monotone" 
                  dataKey="ema" 
                  stroke="#a855f7" 
                  strokeWidth={1.5} 
                  dot={false} 
                />
              )}
            </AreaChart>
          ) : (
            <ComposedChart data={enrichedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#475569" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={yDomain}
                stroke="#475569" 
                fontSize={9} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold' }}
                itemStyle={{ color: '#ffffff', fontSize: '11px', fontFamily: 'monospace' }}
                content={(tooltipProps) => {
                  const { active, payload } = tooltipProps;
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const decimalDigits = selectedAsset.price > 1000 ? 1 : selectedAsset.price < 2 ? 4 : 2;
                    return (
                      <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-2xl text-[11px] font-mono text-slate-350 space-y-1.5 min-w-[150px]">
                        <div className="text-slate-500 font-bold border-b border-slate-900 pb-1 mb-1">{data.time}</div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-450">Open:</span>
                          <span className="text-white font-bold">${data.open.toLocaleString(undefined, { minimumFractionDigits: decimalDigits, maximumFractionDigits: decimalDigits })}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-450">High:</span>
                          <span className="text-emerald-400 font-bold">${data.high.toLocaleString(undefined, { minimumFractionDigits: decimalDigits, maximumFractionDigits: decimalDigits })}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-450">Low:</span>
                          <span className="text-rose-455 font-bold">${data.low.toLocaleString(undefined, { minimumFractionDigits: decimalDigits, maximumFractionDigits: decimalDigits })}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-450">Close:</span>
                          <span className="text-white font-bold">${data.close.toLocaleString(undefined, { minimumFractionDigits: decimalDigits, maximumFractionDigits: decimalDigits })}</span>
                        </div>
                        {showSMA && data.sma !== undefined && (
                          <div className="flex justify-between gap-4 border-t border-slate-900 pt-1 mt-1 text-blue-400">
                            <span>SMA(8):</span>
                            <span className="font-bold">${data.sma.toLocaleString(undefined, { minimumFractionDigits: decimalDigits, maximumFractionDigits: decimalDigits })}</span>
                          </div>
                        )}
                        {showEMA && data.ema !== undefined && (
                          <div className="flex justify-between gap-4 text-purple-400">
                            <span>EMA(8):</span>
                            <span className="font-bold">${data.ema.toLocaleString(undefined, { minimumFractionDigits: decimalDigits, maximumFractionDigits: decimalDigits })}</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="candle" 
                shape={<CandlestickShape />}
              />
              {showSMA && (
                <Line 
                  type="monotone" 
                  dataKey="sma" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="SMA 8"
                />
              )}
              {showEMA && (
                <Line 
                  type="monotone" 
                  dataKey="ema" 
                  stroke="#a855f7" 
                  strokeWidth={1.5} 
                  dot={false}
                  name="EMA 8"
                />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Volume Bar Sub-Chart */}
      <div className="h-[65px] mt-4 border-t border-slate-800/80 pt-4 flex flex-col justify-end" id="volume-subchart">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Historical Volume Index</span>
          <span className="text-[10px] font-mono text-slate-400 font-bold">
            Vol: {selectedAsset.volume24h.toLocaleString()} shares/tokens
          </span>
        </div>
        <div className="h-full max-h-[40px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
              <Bar 
                dataKey="volume" 
                fill={isPositive ? '#10b981' : '#f43f5e'} 
                radius={[2, 2, 0, 0]}
                opacity={0.3}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
