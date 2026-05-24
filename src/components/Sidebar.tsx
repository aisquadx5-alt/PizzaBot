"use client";

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { Plus, MessageSquare, Trash2, LogIn, UserPlus, X } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { 
    chats, 
    currentChatId, 
    selectChat, 
    deleteChat, 
    startNewChat, 
    user, 
    setAuthModalOpen, 
    setAuthModalTab,
    isSidebarOpen,
    setSidebarOpen
  } = useChat();

  const handleNewChat = async () => {
    await startNewChat();
    setSidebarOpen(false); // Auto-collapse drawer on mobile
  };

  const handleChatSelect = async (chatId: string) => {
    await selectChat(chatId);
    setSidebarOpen(false); // Auto-collapse drawer on mobile
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  // --- REUSABLE CHATS LIST LAYOUT ---
  const renderHistoryList = () => {
    return (
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        <div className="text-[10px] tracking-widest text-gray-500 font-mono px-3 mb-2 uppercase">
          Recent Sessions
        </div>

        {chats.length === 0 ? (
          <div className="text-center py-8 text-gray-600 font-mono text-xs italic">
            No active orders.
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat.id === currentChatId;
            return (
              <div 
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all border ${
                  isActive 
                    ? 'bg-amber-500/5 border-amber-500/30 text-amber-500' 
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-[#181612] hover:text-gray-200'
                }`}
              >
                <div className="flex items-start space-x-2.5 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-amber-500' : 'text-gray-500'}`} />
                  <div className="overflow-hidden">
                    <div className="text-xs font-medium truncate font-sans">{chat.title}</div>
                    <div className="text-[9px] text-gray-500 font-mono mt-0.5">{getRelativeTime(chat.created_at)}</div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this session archive?')) deleteChat(chat.id);
                  }}
                  className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // --- REUSABLE BOTTOM PROFILE CARD ---
  const renderProfilePanel = () => {
    return (
      <div className="p-4 border-t border-[#2E271F] bg-[#100E0A] space-y-3">
        {/* Auth Buttons for Guests */}
        {!user && (
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() => {
                setAuthModalTab('signin');
                setAuthModalOpen(true);
                setSidebarOpen(false);
              }}
              className="py-2.5 text-center bg-[#181612] border border-[#2E271F] hover:border-amber-500/40 text-gray-300 hover:text-amber-500 rounded-lg cursor-pointer transition-all flex items-center justify-center space-x-1.5"
            >
              <span>Login</span>
            </button>
            <button
              onClick={() => {
                setAuthModalTab('signup');
                setAuthModalOpen(true);
                setSidebarOpen(false);
              }}
              className="py-2.5 text-center bg-gradient-to-r from-amber-600 to-amber-500 text-[#0D0C0A] font-bold rounded-lg cursor-pointer hover:shadow-lg hover:shadow-amber-500/5 active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5"
            >
              <span>Sign Up</span>
            </button>
          </div>
        )}

        {/* Guest / Account Panel */}
        <div className="bg-[#14120E] border border-[#2E271F]/80 p-3 rounded-lg flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 font-mono text-xs font-semibold ${
            user 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
              : 'bg-[#1C1A15] border-[#2E271F] text-gray-500'
          }`}>
            {user ? user.email[0].toUpperCase() : 'G'}
          </div>

          <div className="overflow-hidden">
            <div className="text-xs font-semibold text-gray-200 truncate">
              {user ? user.email : 'Guest User'}
            </div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-amber-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className="text-[8px] text-gray-500 tracking-wider font-mono uppercase truncate">
                {user ? 'Status: Online' : 'Status: Guest'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ==========================================
         REPRESENTATION A: Desktop Side-by-Side Sidebar
         ========================================== */}
      <aside className="hidden md:flex w-80 bg-[#14120E] border-r border-[#2E271F] flex-col h-full select-none flex-shrink-0">
        {/* New Chat Button */}
        <div className="p-4 border-b border-[#2E271F]/40">
          <button 
            onClick={handleNewChat}
            className="w-full bg-transparent hover:bg-amber-500/5 text-amber-500 border border-amber-500/30 hover:border-amber-500/80 font-mono text-xs font-semibold uppercase tracking-wider py-3 rounded-lg flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* History Feed */}
        {renderHistoryList()}

        {/* Auth Panel */}
        {renderProfilePanel()}
      </aside>

      {/* ==========================================
         REPRESENTATION B: Mobile Overlay Drawer (Issue 3)
         ========================================== */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex overflow-hidden">
          
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Sliding Container */}
          <div className="relative w-68 max-w-xs bg-[#14120E] border-r border-[#2E271F] flex flex-col h-full shadow-2xl transition-transform duration-300 ease-out z-10 animate-slide-in">
            
            {/* Drawer Header Close Row */}
            <div className="flex justify-between items-center p-4 border-b border-[#2E271F]/40 bg-[#100E0A] flex-shrink-0">
              <span className="text-[10px] tracking-widest text-amber-500 font-mono uppercase font-bold">
                Order History
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-[#2E271F] rounded-md text-gray-500 hover:text-gray-300 transition-all cursor-pointer flex items-center justify-center"
                title="Close Sidebar"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Drawer Actions */}
            <div className="p-3 border-b border-[#2E271F]/40 flex-shrink-0">
              <button 
                onClick={handleNewChat}
                className="w-full bg-transparent hover:bg-amber-500/5 text-amber-500 border border-amber-500/30 font-mono text-xs font-semibold uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Chat</span>
              </button>
            </div>

            {/* Drawer Chat History Feed */}
            {renderHistoryList()}

            {/* Drawer Bottom Profile Card */}
            {renderProfilePanel()}

          </div>
        </div>
      )}
    </>
  );
};
