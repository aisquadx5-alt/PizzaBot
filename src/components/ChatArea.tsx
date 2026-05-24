"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import { TypewriterText } from './TypewriterText';
import { Send, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';

export const ChatArea: React.FC = () => {
  const {
    messages,
    sendMessage,
    isLoading,
    isTypewriting,
    currentlyTypewritingId,
    completeTypewriter,
    apiError,
    clearApiError,
    user,
    guestMessageCount,
    selectedLanguage,
    setSelectedLanguage,
    setAuthModalOpen,
    setAuthModalTab
  } = useChat();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const guestLocked = !user && guestMessageCount >= 4;
  const isInputLocked = isLoading || isTypewriting || guestLocked;

  // Auto-scroll to bottom of chat feed
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isTypewriting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isInputLocked) return;

    const query = input;
    setInput('');
    await sendMessage(query);
  };

  const getFormattedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0C0A] overflow-hidden relative w-full">
      
      {/* Messages Scroll Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6"
      >
        
        {messages.length === 0 ? (
          /* Landing Screen (Clean Warm B2C Dashboard Style) - Overhauled */
          <div className="max-w-2xl mx-auto mt-6 md:mt-12 space-y-6 select-none animate-fade-in px-2">
            
            {/* Welcoming Card */}
            <div className="bg-[#14120E] border border-[#2E271F] p-6 rounded-2xl relative overflow-hidden orange-neon-border group">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/10">
                  🍕
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-100">Welcome to Pizza Bites! 🍕</h3>
                  <p className="text-xs text-amber-500/90 font-medium">Your AI assistant is here to help you order the perfect pizza.</p>
                </div>
              </div>

              <div className="space-y-2 text-xs md:text-sm text-gray-400 leading-relaxed border-t border-[#2E271F]/40 pt-4 font-sans">
                <p>Hello! I am **SliceAI**, your personal Pizza Bites customer support assistant.</p>
                <p>Whether you want to explore toppings, check pizza prices, or draft a full custom order, I am here to assist. Just type your question or order details below to begin!</p>
              </div>
            </div>

            {/* Normal suggestion boxes grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              
              <button 
                onClick={() => sendMessage("What is on the menu?")}
                className="bg-[#14120E]/50 hover:bg-[#181612] border border-[#2E271F] hover:border-amber-500/40 p-4 rounded-xl text-left cursor-pointer transition-all text-xs group"
              >
                <div className="text-amber-500 font-mono font-bold mb-1.5 group-hover:text-amber-400">[01] MENU</div>
                <div className="text-gray-300 font-medium font-sans">"What is on the menu?"</div>
              </button>
              
              <button 
                onClick={() => sendMessage("How much is a large Pepperoni?")}
                className="bg-[#14120E]/50 hover:bg-[#181612] border border-[#2E271F] hover:border-amber-500/40 p-4 rounded-xl text-left cursor-pointer transition-all text-xs group"
              >
                <div className="text-amber-500 font-mono font-bold mb-1.5 group-hover:text-amber-400">[02] PRICES</div>
                <div className="text-gray-300 font-medium font-sans">"How much is a large Pepperoni?"</div>
              </button>

              <button 
                onClick={() => sendMessage("Do you have any side items?")}
                className="bg-[#14120E]/50 hover:bg-[#181612] border border-[#2E271F] hover:border-amber-500/40 p-4 rounded-xl text-left cursor-pointer transition-all text-xs group"
              >
                <div className="text-amber-500 font-mono font-bold mb-1.5 group-hover:text-amber-400">[03] SIDES</div>
                <div className="text-gray-300 font-medium font-sans">"Do you have any side items?"</div>
              </button>

            </div>

          </div>
        ) : (
          /* Render Messages Feed */
          <div className="max-w-3xl mx-auto space-y-6">
            
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isBeingTypewritten = currentlyTypewritingId === msg.id;

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end items-end space-x-2">
                    <div className="max-w-[85%] bg-[#14120E]/30 border border-[#2E271F] px-4 py-3 rounded-2xl rounded-br-sm relative shadow-md">
                      <div className="text-xs md:text-sm text-gray-200 font-sans">{msg.content}</div>
                      {getFormattedTime(msg.created_at) && (
                        <div className="text-[8px] text-gray-500 font-mono text-right mt-1.5 uppercase select-none">
                          SENT {getFormattedTime(msg.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Assistant friendly message card
              return (
                <div key={msg.id} className="bg-[#14120E] border-l-2 border-amber-500 border border-[#2E271F] p-4 md:p-5 rounded-r-2xl rounded-bl-2xl shadow-lg relative overflow-hidden group">
                  
                  {/* Clean title panel */}
                  <div className="flex items-center space-x-2.5 mb-3 pb-3 border-b border-[#2E271F]/40 select-none">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-mono text-[9px] text-[#0D0C0A] font-bold">
                      🍕
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase">
                        SliceAI Assistant 🍕
                      </div>
                    </div>
                    <span className="text-[8px] text-green-500 font-mono uppercase tracking-wider">
                      Online
                    </span>
                  </div>

                  {/* Body Text */}
                  <div className="text-xs md:text-sm font-sans text-gray-200 min-h-[20px] pr-2">
                    <TypewriterText 
                      content={msg.content}
                      msgId={msg.id}
                      isActive={isBeingTypewritten}
                      onComplete={completeTypewriter}
                    />
                  </div>

                </div>
              );
            })}

            {/* Typing status loading bar */}
            {isLoading && (
              <div className="bg-[#14120E]/40 border border-dashed border-[#2E271F] p-4 rounded-2xl flex items-center space-x-3 animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  SliceAI is writing a response...
                </div>
              </div>
            )}

            {/* Error handling card */}
            {apiError && (
              <div className="bg-amber-500/5 border border-amber-500/30 p-4 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 text-amber-500/20 font-mono text-[60px] leading-none pointer-events-none select-none font-bold">
                  ERROR
                </div>
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-amber-500 tracking-wider uppercase">CONNECTION_FAILURE</h4>
                    <p className="text-xs text-gray-400 font-mono leading-relaxed">{apiError}</p>
                    <button 
                      onClick={clearApiError}
                      className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 text-amber-500 font-mono text-[9px] px-3 py-1.5 rounded transition-all cursor-pointer uppercase font-bold"
                    >
                      Acknowledge Failure
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Inputs Form */}
      <div className="p-4 md:p-6 border-t border-[#2E271F] bg-[#0D0C0A]/95 relative z-10 w-full">
        <form 
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto"
        >
          {/* Locked status banner indicator */}
          {isLoading || isTypewriting ? (
            <div className="flex items-center space-x-1.5 mb-2 pl-3 text-[9px] text-amber-500 font-mono uppercase tracking-widest animate-pulse select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>TERMINAL: SliceAI is typing order response...</span>
            </div>
          ) : guestLocked ? (
            <div className="flex items-center space-x-1.5 mb-2 pl-3 text-[9px] text-red-500 font-mono uppercase tracking-widest select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>TERMINAL: GUEST SESSION MESSAGE LIMIT EXCEEDED</span>
            </div>
          ) : null}

          {/* Form input elements wrapper with guest lock overlay positioning */}
          <div className="relative">
            <div className={`flex items-center bg-[#14120E] border rounded-2xl px-4 py-2 transition-all shadow-lg ${
              isInputLocked 
                ? 'border-amber-500/20 opacity-60 shadow-none' 
                : 'border-[#2E271F] focus-within:border-amber-500/60 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.06)]'
            }`}>
              
              {/* Input field */}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isInputLocked}
                placeholder={
                  guestLocked
                    ? "Chat locked. Please register to continue."
                    : isInputLocked 
                      ? "Please wait... SliceAI is writing..."
                      : "Ask about our pizzas, toppings, or menu..."
                }
                className={`flex-1 bg-transparent px-2 py-2 text-sm text-gray-200 focus:outline-none placeholder-gray-600 disabled:cursor-not-allowed ${
                  isInputLocked ? 'select-none' : ''
                }`}
              />

              {/* Accessories */}
              <div className="flex items-center">
                <button
                  type="submit"
                  disabled={isInputLocked || !input.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-[#1E1C18] disabled:to-[#1E1C18] disabled:opacity-30 disabled:text-gray-600 text-[#0D0C0A] transition-all hover:scale-105 active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100 cursor-pointer shadow-md shadow-amber-500/5 hover:shadow-amber-500/15"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Guest Lock overlay banner */}
            {guestLocked && (
              <div className="absolute inset-0 bg-[#0D0C0A]/95 backdrop-blur-sm rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between px-5 py-3 animate-fade-in z-20 gap-3 sm:gap-0">
                <span className="text-xs text-gray-300 font-sans font-medium text-center sm:text-left leading-relaxed">
                  To continue chatting and place an order, please Create an Account.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('signup');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0D0C0A] font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-[0.98] flex-shrink-0"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
          
          {/* Language Selection Row & Fineprint */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-3.5 px-2 gap-2 sm:gap-0 select-none">
            <span className="text-[9px] text-gray-600 tracking-widest font-mono uppercase">
              PIZZA BITES // CHANNEL: {selectedLanguage}
            </span>
            
            <div className="flex items-center space-x-1.5">
              <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Reply Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                disabled={isLoading || isTypewriting}
                className="bg-[#14120E] border border-[#2E271F] focus:border-amber-500/50 text-[10px] font-mono text-gray-300 rounded-lg px-2.5 py-1 focus:outline-none transition-all cursor-pointer hover:bg-[#181612]"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
                <option value="Roman Urdu">Roman Urdu</option>
              </select>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
};
