"use client";

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { Settings, HelpCircle, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  const { isWidgetMode, toggleMode, setAuthModalOpen, setAuthModalTab, user, logout } = useChat();

  return (
    <header className="border-b border-[#2E271F] bg-[#0D0C0A] px-6 py-4 flex items-center justify-between relative z-40 select-none">
      
      {/* Brand Logo - Left */}
      <div className="flex items-center space-x-3">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
          Pizza Bites
        </h1>
        <span className="text-gray-600 font-mono text-[9px] md:inline hidden select-none">|</span>
        <span className="text-gray-500 font-mono text-[9px] tracking-widest md:inline hidden uppercase">
          V2.4.0_STABLE
        </span>

        {isWidgetMode && (
          <div className="hidden lg:flex items-center space-x-4 pl-4 text-xs font-mono text-gray-400">
            <span className="hover:text-amber-500 transition-colors cursor-pointer">[ History ]</span>
            <span className="hover:text-amber-500 transition-colors cursor-pointer">[ Favorites ]</span>
          </div>
        )}
      </div>

      {/* Pill Toggle - Center */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="bg-[#181612] border border-[#2E271F] p-1 rounded-full flex items-center shadow-lg relative max-w-[280px]">
          
          {/* Active sliding background */}
          <div 
            className="absolute h-[80%] rounded-full bg-gradient-to-r from-amber-600 to-amber-500 transition-all duration-300 ease-out shadow-md shadow-amber-500/10"
            style={{
              width: 'calc(50% - 4px)',
              left: isWidgetMode ? 'calc(50% + 2px)' : '4px',
            }}
          />

          {/* Full Screen Mode */}
          <button 
            onClick={() => isWidgetMode && toggleMode()}
            className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase transition-colors relative z-10 w-[110px] md:w-[125px] text-center cursor-pointer ${
              !isWidgetMode ? 'text-[#0D0C0A]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Full Screen
          </button>

          {/* Widget Mode */}
          <button 
            onClick={() => !isWidgetMode && toggleMode()}
            className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase transition-colors relative z-10 w-[110px] md:w-[125px] text-center cursor-pointer ${
              isWidgetMode ? 'text-[#0D0C0A]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Widget Mode
          </button>
          
        </div>
      </div>

      {/* Actions - Right */}
      <div className="flex items-center space-x-3 text-gray-400">
        
        {/* Settings button */}
        <button 
          onClick={() => {
            if (user) {
              if (confirm('Disconnect/Log out user session?')) logout();
            } else {
              setAuthModalTab('signin');
              setAuthModalOpen(true);
            }
          }}
          className={`p-1.5 rounded-md hover:bg-[#181612] hover:text-amber-500 border border-transparent hover:border-[#2E271F] transition-all cursor-pointer ${
            user ? 'text-amber-500 border-[#2E271F]/40 bg-amber-500/5' : ''
          }`}
          title={user ? `Signed in as ${user.email}. Click to Logout.` : "Connect Profile / Login"}
        >
          <Settings className={`w-4 h-4 ${user ? 'animate-spin-slow' : ''}`} />
        </button>

        {/* Help icon */}
        <button 
          onClick={() => alert("Pizza Bites AI Support Center V2.4\nSliceAI is here to help you order delicious pizza.\nMenu:\n• Margherita: $10\n• Pepperoni: $12\n\nAsk questions about our toppings, check prices, or write your custom order directly!")}
          className="p-1.5 rounded-md hover:bg-[#181612] hover:text-amber-500 border border-transparent hover:border-[#2E271F] transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

      </div>

    </header>
  );
};
