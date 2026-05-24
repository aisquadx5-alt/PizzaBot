"use client";

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { supabase, isMockMode } from '@/utils/supabase';
import { X, Shield, Lock, Mail, CheckCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authModalTab, 
    setAuthModalTab 
  } = useChat();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setAuthModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (authModalTab === 'signin') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInErr) throw signInErr;
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else {
        const { error: signUpErr } = await supabase.auth.signUp({
          email,
          password
        });
        if (signUpErr) throw signUpErr;
        
        if (isMockMode) {
          setSuccess('Account created successfully! Logged in.');
          setTimeout(() => {
            handleClose();
          }, 1000);
        } else {
          setSuccess('Account created successfully! Please check your email inbox.');
        }
      }
    } catch (err: any) {
      console.error('Auth action failed:', err);
      setError(err.message || 'Authentication failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      
      {/* Container card */}
      <div 
        className="w-full max-w-md bg-[#14120E] border border-[#2E271F] rounded-xl shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden relative orange-neon-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#2E271F] px-6 py-4 bg-[#181612]">
          <div className="flex items-center space-x-2 text-amber-500 font-mono tracking-widest text-xs font-semibold uppercase">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Login or Create Account</span>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-[#2E271F] rounded-md text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Mode Badge */}
        {isMockMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center space-x-2 text-[10px] text-amber-500/90 font-mono">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            <span>Demo Mode: Accounts are simulated locally in browser storage.</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#2E271F] font-mono text-xs">
          <button
            onClick={() => {
              setAuthModalTab('signin');
              setError(null);
              setSuccess(null);
            }}
            className={`w-1/2 py-3 text-center transition-all ${
              authModalTab === 'signin' 
                ? 'bg-transparent text-amber-500 border-b-2 border-amber-500 font-semibold' 
                : 'bg-[#181612]/30 text-gray-500 hover:text-gray-400 hover:bg-[#181612]/50'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setAuthModalTab('signup');
              setError(null);
              setSuccess(null);
            }}
            className={`w-1/2 py-3 text-center transition-all ${
              authModalTab === 'signup' 
                ? 'bg-transparent text-amber-500 border-b-2 border-amber-500 font-semibold' 
                : 'bg-[#181612]/30 text-gray-500 hover:text-gray-400 hover:bg-[#181612]/50'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Alerts */}
          {error && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-mono">
              Alert: {error}
            </div>
          )}

          {success && (
            <div className="bg-green-950/30 border border-green-500/30 text-green-400 p-3 rounded-lg text-xs font-mono flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-gray-400 font-mono block">EMAIL ADDRESS</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@urbancrust.com"
                className="w-full bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-gray-400 font-mono block">PASSWORD</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Action button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-[#0D0C0A] font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer mt-2"
          >
            {loading ? 'Please wait...' : authModalTab === 'signin' ? 'Login' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-[#181612]/30 px-6 py-4 border-t border-[#2E271F] flex justify-center text-[9px] text-gray-600 font-mono tracking-wider">
          Pizza Bites © 2026
        </div>

      </div>
    </div>
  );
};
