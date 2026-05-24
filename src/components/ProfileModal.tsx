"use client";

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { X, User, Phone, MapPin, AlertCircle, CheckCircle2, Save } from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const {
    profileModalOpen,
    setProfileModalOpen,
    profile,
    saveProfile,
    user
  } = useChat();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync inputs with state profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile, profileModalOpen]);

  if (!profileModalOpen || !user) return null;

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setProfileModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Basic Validations
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    // Phone Validation: strip non-digits and check if exactly 11 digits
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setError('Strict Validation: Phone number must contain exactly 11 digits (e.g. 03070999000).');
      return;
    }

    if (!address.trim()) {
      setError('Please provide your complete delivery address.');
      return;
    }

    setLoading(true);

    try {
      const res = await saveProfile(name.trim(), phone.trim(), address.trim());
      if (res.success) {
        setSuccess('Profile updated successfully! All order capabilities unlocked.');
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(res.error || 'Failed to update profile settings.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your profile.');
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
            <User className="w-4 h-4 text-amber-500" />
            <span>Profile Settings</span>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-[#2E271F] rounded-md text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3.5 flex items-start space-x-3 text-[11px] text-amber-500/90 leading-relaxed font-sans select-none">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-amber-500 mt-0.5" />
          <span>
            <strong>Note</strong>: Please provide a valid active phone number. All orders are manually verified via a phone call before dispatch to prevent spam.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {/* Alerts */}
          {error && (
            <div className="bg-red-950/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-mono">
              Alert: {error}
            </div>
          )}

          {success && (
            <div className="bg-green-950/30 border border-green-500/30 text-green-400 p-3 rounded-lg text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0 text-green-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-gray-400 font-mono block">FULL NAME</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jahaanzeb"
                className="w-full bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-gray-400 font-mono block">PHONE NUMBER (11 DIGITS)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0307-0999000"
                className="w-full bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] tracking-wider text-gray-400 font-mono block">DELIVERY ADDRESS</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-3 pointer-events-none text-gray-500">
                <MapPin className="w-4 h-4" />
              </div>
              <textarea
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Fawara Chowk, Dinga, Pakistan"
                className="w-full bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-[#0D0C0A] font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-lg shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer mt-2 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Changes...' : 'Save Profile settings'}</span>
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
