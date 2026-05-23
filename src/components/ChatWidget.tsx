"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { TypewriterText } from './TypewriterText';
import { Send, X, MessageSquare, AlertTriangle } from 'lucide-react';

export const ChatWidget: React.FC = () => {
  const {
    messages,
    sendMessage,
    isLoading,
    isTypewriting,
    currentlyTypewritingId,
    completeTypewriter,
    isWidgetOpen,
    setWidgetOpen,
    apiError,
    clearApiError
  } = useChat();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInputLocked = isLoading || isTypewriting;

  // Auto-scroll the widget feed to the bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isTypewriting, isWidgetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isInputLocked) return;

    const query = input;
    setInput('');
    await sendMessage(query);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans select-none">
      
      {/* Floating launcher button */}
      <button
        onClick={() => setWidgetOpen(!isWidgetOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0D0C0A] flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer relative orange-neon-border"
      >
        {isWidgetOpen ? (
          <X className="w-6 h-6 text-[#0D0C0A]" />
        ) : (
          <div className="relative">
            <span className="text-xl">🍕</span>
            {messages.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#0D0C0A] border border-amber-500 rounded-full flex items-center justify-center text-[7px] text-amber-500 font-mono font-bold">
                !
              </span>
            )}
          </div>
        )}
      </button>

      {/* Expandable glassmorphic chat container */}
      {isWidgetOpen && (
        <div 
          className="absolute bottom-18 right-0 w-85 md:w-96 h-[480px] bg-[#14120E]/95 border border-[#2E271F] rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden flex flex-col orange-neon-border animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#181612] border-b border-[#2E271F] flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[9px]">
                🍕
              </div>
              <div>
                <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">SliceAI Assistant 🍕</h3>
                <p className="text-[7px] text-green-500 font-mono tracking-wider">Online</p>
              </div>
            </div>
            <button 
              onClick={() => setWidgetOpen(false)}
              className="p-1 hover:bg-[#2E271F] rounded text-gray-500 hover:text-gray-300 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages body */}
          <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#0D0C0A]/40"
          >
            {messages.length === 0 ? (
              /* Greeting */
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-full animate-pulse">
                  <MessageSquare className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider">SliceAI Support Core Online</h4>
                  <p className="text-[10px] text-gray-500 font-sans mt-2 leading-relaxed">
                    Welcome to Pizza Bites! How can I help you order the perfect pizza today?
                  </p>
                </div>
                
                <div className="w-full bg-[#14120E] border border-[#2E271F] p-3 rounded-lg text-[9px] font-mono text-amber-500/90 text-left space-y-1">
                  <div>• Margherita: $10</div>
                  <div>• Pepperoni: $12</div>
                  <div className="text-gray-500">Explore our delicious, fresh artisanal pizzas.</div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isBeingTypewritten = currentlyTypewritingId === msg.id;

                if (isUser) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[85%] bg-[#14120E]/30 border border-[#2E271F] px-3.5 py-2.5 rounded-xl rounded-br-sm text-[11px] text-gray-200 font-sans shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="bg-[#14120E]/90 border border-[#2E271F] p-3.5 rounded-r-xl rounded-bl-xl text-[11px] font-sans text-gray-200">
                    <div className="text-[8px] font-mono text-amber-500 tracking-wider mb-1.5 font-bold uppercase">
                      SliceAI Assistant 🍕
                    </div>
                    
                    <TypewriterText 
                      content={msg.content}
                      msgId={msg.id}
                      isActive={isBeingTypewritten}
                      onComplete={completeTypewriter}
                    />
                  </div>
                );
              })
            )}

            {/* Waiting indicator */}
            {isLoading && (
              <div className="bg-[#14120E]/40 border border-dashed border-[#2E271F] p-3 rounded-xl flex items-center space-x-2 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-[8px] font-mono text-gray-500 tracking-wider uppercase">SliceAI is typing...</span>
              </div>
            )}

            {/* Inline Error Card */}
            {apiError && (
              <div className="bg-amber-500/5 border border-amber-500/30 p-3 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-500 font-mono text-[9px] font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Connection Alert</span>
                </div>
                <p className="text-[9px] font-mono text-gray-400">{apiError}</p>
                <button 
                  onClick={clearApiError}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-mono text-[8px] uppercase font-bold py-1 px-2.5 rounded border border-amber-500/20 cursor-pointer"
                >
                  Clear Alert
                </button>
              </div>
            )}

          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-[#14120E] border-t border-[#2E271F]">
            <form onSubmit={handleSubmit} className="flex items-center space-x-2 relative">
              
              {/* Sync status labels */}
              {isInputLocked && (
                <div className="absolute -top-6 left-1 text-[7px] text-amber-500 font-mono uppercase tracking-widest flex items-center space-x-1 animate-pulse">
                  <span>SliceAI is writing a response...</span>
                </div>
              )}

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isInputLocked}
                placeholder={
                  isInputLocked 
                    ? "Please wait..." 
                    : "Ask a question..."
                }
                className="flex-1 bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/40 rounded-xl px-3 py-2 text-[11px] text-gray-200 focus:outline-none placeholder-gray-600 disabled:cursor-not-allowed"
              />

              <button
                type="submit"
                disabled={isInputLocked || !input.trim()}
                className="p-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-[#1E1C18] disabled:to-[#1E1C18] disabled:opacity-30 disabled:text-gray-600 text-[#0D0C0A] transition-all cursor-pointer flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>

            </form>
          </div>

        </div>
      )}

    </div>
  );
};
