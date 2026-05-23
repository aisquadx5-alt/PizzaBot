"use client";

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { ChatWidget } from '@/components/ChatWidget';

export default function Page() {
  const { isWidgetMode, telemetry } = useChat();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0D0C0A]">
      
      {/* Top Header Navigation - Sticky in both modes */}
      <Header />

      {/* Dual Mode Screen Renderer */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {!isWidgetMode ? (
          
          /* ==========================================
             MODE 1: Full-Screen Workspace
             ========================================== */
          <div className="flex-1 flex overflow-hidden animate-fade-in">
            {/* Sidebar history log */}
            <Sidebar />
            
            {/* Main chats window */}
            <ChatArea />
          </div>

        ) : (
          
          /* ==========================================
             MODE 2: Translucent Ambient Widget Stage
             ========================================== */
          <div className="flex-1 flex relative overflow-hidden bg-black select-none animate-fade-in">
            
            {/* Ambient Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 brightness-[0.3] contrast-[1.1] filter blur-[2px] transition-all duration-700 ease-in-out"
              style={{ backgroundImage: `url('/pizza_oven_backdrop.png')` }}
            />
            
            {/* Ambient vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />

            {/* Ambient Pizza Oven friendly center decorator */}
            <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none opacity-20">
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-widest font-sans uppercase text-amber-500/80 mb-2">
                Pizza Bites 🍕
              </h2>
              <div className="text-[10px] md:text-xs font-mono tracking-[0.4em] text-gray-500">
                AI CUSTOMER SUPPORT ACTIVE
              </div>
            </div>

            {/* Bottom-Left storefront status readouts (Image 2 style) */}
            <div className="absolute bottom-8 left-8 font-mono text-[10px] text-gray-500 tracking-widest leading-relaxed uppercase pointer-events-none select-none">
              
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">AGENT:</span>
                <span className="text-gray-400">SliceAI Support</span>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-600">STATUS:</span>
                <span className="text-amber-500 font-bold animate-pulse">{telemetry.status}</span>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-600">STORE:</span>
                <span className="text-gray-400">Urban Crust Pizza Shop</span>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-600">HOURS:</span>
                <span className="text-amber-500/80">OPEN_FOR_ORDERS</span>
              </div>

            </div>

            {/* Bottom-Right Floating chat widget */}
            <ChatWidget />

          </div>
        )}

      </div>
    </div>
  );
}
