/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Key, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onLoginSuccess: (userEmail: string, userName: string, initialBalance?: number) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [seedBalance, setSeedBalance] = useState('25000');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess('trader@demo.com', 'Demo Trader');
      setLoading(false);
    }, 850);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fully fill out all required credentials.');
      return;
    }

    if (!isLogin && !name) {
      setError('Your profile username is required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must feature a minimum of 6 characters.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      // Get registered users list or initialize it
      const usersRaw = localStorage.getItem('trading_platform_users');
      const users = usersRaw ? JSON.parse(usersRaw) : [];

      if (isLogin) {
        // Authenticate
        const userFound = users.find(
          (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );

        if (userFound) {
          onLoginSuccess(userFound.email, userFound.name);
        } else if (email === 'trader@demo.com' && password === 'demo123') {
          onLoginSuccess('trader@demo.com', 'Demo Trader');
        } else {
          setError('Invalid email or secure password combination.');
        }
      } else {
        // Register new
        const exists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (exists || email === 'trader@demo.com') {
          setError('A profile with this email address already exists.');
          setLoading(false);
          return;
        }

        const newUser = {
          email,
          name,
          password,
          balance: parseFloat(seedBalance) || 10000,
          holdings: {},
          watchlist: ['BTC', 'ETH', 'AAPL', 'TSLA'],
          transactions: [],
          activeOrders: []
        };

        users.push(newUser);
        localStorage.setItem('trading_platform_users', JSON.stringify(users));
        
        // Auto-login newly registered
        onLoginSuccess(newUser.email, newUser.name, newUser.balance);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      
      {/* Decorative top-tier polished design backstage glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-[0_0_50px_-12px_rgba(16,185,129,0.1)] relative z-10"
        id="auth-card-container"
      >
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="p-3 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/30 text-emerald-400 shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white mt-1">
            {isLogin ? 'Access Trading Hub' : 'Establish New Account'}
          </h1>
          <p className="text-xs text-slate-450 text-center max-w-[280px]">
            {isLogin 
              ? 'Authorize or bypass below to enter the live market workspace.' 
              : 'Configure your portfolio initial seed funding details.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-xl flex items-start gap-2.5 text-xs inline-flex w-full" id="auth-error-msg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Full Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  placeholder="e.g. Satoshi Nakamoto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all duration-150"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all duration-150"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="auth-password-input"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all duration-150"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Initial Seed Balance ($ USD)
              </label>
              <select
                id="auth-seed-balance"
                value={seedBalance}
                onChange={(e) => setSeedBalance(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition-all duration-150"
              >
                <option value="5000">$5,000 USD (Starter)</option>
                <option value="25000">$25,000 USD (Recommended)</option>
                <option value="100000">$100,000 USD (Advanced)</option>
                <option value="500000">$500,000 USD (Institutional)</option>
              </select>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-555 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-md shadow-emerald-900/10 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800/50" />
          <span className="relative z-10 px-3 py-1 bg-[#151f32] text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-none">
            Demo Sandbox Portal
          </span>
        </div>

        {/* Demo Portal Easy login Button */}
        <div className="space-y-4">
          <button
            id="auth-demo-btn"
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="w-full bg-slate-800/50 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 font-bold rounded-xl py-2.5 text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.99]"
          >
            <span>Bypass with Demo Account</span>
          </button>
          
          <p className="text-center text-xs text-slate-400">
            {isLogin ? "Don't have an active terminal key?" : "Already registered to a workstation?"}{' '}
            <button
              id="auth-toggle-mode"
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 ml-1 cursor-pointer"
            >
              {isLogin ? 'Register Portal' : 'Login Port'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
