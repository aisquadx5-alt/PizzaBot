"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase, isMockMode, ChatSession, ChatMessage } from '@/utils/supabase';
import { Lock, Mail, ShieldAlert, Users, LogOut, RefreshCw, MessageSquare, Terminal, AlertTriangle, Eye } from 'lucide-react';

export default function AdminPage() {
  // Auth state
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Dashboard state
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [totalChatsCount, setTotalChatsCount] = useState(0);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Check active session on mount
  useEffect(() => {
    async function initSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setSessionUser(user);
      } catch (err) {
        console.error('Error fetching initial session:', err);
      } finally {
        setCheckingSession(false);
      }
    }
    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setSessionUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch admin logs when authenticated
  useEffect(() => {
    if (sessionUser && sessionUser.email === 'ailearner@admin.com') {
      fetchChatsList();
    }
  }, [sessionUser]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (selectedChatId) {
      fetchChatMessages(selectedChatId);
    } else {
      setMessages([]);
    }
  }, [selectedChatId]);

  // Auto-scroll messages list to the bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Autopilot login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Please fill in both fields.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      // Attempt Sign In
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        // Mock Mode Autopilot: If sign-in fails because user does not exist, automatically sign them up!
        if (isMockMode && (error.message.includes('Invalid') || error.message.includes('not found') || error.message.includes('credentials'))) {
          console.log('Mock Mode: Auto-registering admin account...');
          const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
            email: email.trim(),
            password
          });
          if (signUpErr) throw signUpErr;
          setSessionUser(signUpData.user);
        } else {
          throw error;
        }
      } else {
        setSessionUser(data.user);
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setAuthError(err.message || 'Verification rejected. Please review credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setSessionUser(null);
      setSelectedChatId(null);
      setChats([]);
      setMessages([]);
      setTotalChatsCount(0);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchChatsList = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoadingChats(true);

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const chatSessions = data || [];
      setChats(chatSessions);
      setTotalChatsCount(chatSessions.length);

      // Auto-select first chat if none is selected
      if (chatSessions.length > 0 && !selectedChatId) {
        setSelectedChatId(chatSessions[0].id);
      }
    } catch (err) {
      console.error('Error fetching admin chats list:', err);
    } finally {
      setLoadingChats(false);
      setRefreshing(false);
    }
  };

  const fetchChatMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const getFormattedTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  // --- RENDERING ROUTER ---

  // 1. Loading active session overlay
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0D0C0A] flex flex-col items-center justify-center font-mono text-gray-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-500 mb-3" />
        <span>INITIALIZING_SECURE_AUTH_NODE...</span>
      </div>
    );
  }

  // 2. Sleek Dark Login Form (If not logged in)
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-[#0D0C0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#14120E] border border-[#2E271F] rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden orange-neon-border relative">
          
          <div className="flex items-center space-x-2 border-b border-[#2E271F] px-6 py-4 bg-[#181612]">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500 font-mono tracking-widest text-xs font-semibold uppercase">
              PIZZA BITES ADMIN PORTAL
            </span>
          </div>

          {isMockMode && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-[10px] text-amber-500 font-mono flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
              <span>MOCK AUTH ACTIVE // Autopilot login for ailearner@admin.com enabled</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="p-6 space-y-4 font-sans">
            
            {authError && (
              <div className="bg-red-950/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-mono">
                LOGIN_FAILED: {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] tracking-wider text-gray-400 font-mono block">ADMINISTRATOR_EMAIL</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ailearner@admin.com"
                  className="w-full bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] tracking-wider text-gray-400 font-mono block">SECURITY_ACCESS_KEY</label>
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
                  className="w-full bg-[#1C1A15] border border-[#2E271F] focus:border-amber-500/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-[#0D0C0A] font-mono text-xs font-bold uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-all cursor-pointer mt-2"
            >
              {authLoading ? 'ESTABLISHING_LINK...' : 'AUTHENTICATE_SIGNATURE'}
            </button>
          </form>

          <div className="bg-[#181612]/30 px-6 py-4 border-t border-[#2E271F] flex justify-center text-[8px] text-gray-600 font-mono tracking-wider">
            PIZZA BITES ADMIN CONSOLE V2.4
          </div>

        </div>
      </div>
    );
  }

  // 3. Access Denied Shield (If logged in email is NOT ailearner@admin.com)
  if (sessionUser.email !== 'ailearner@admin.com') {
    return (
      <div className="min-h-screen bg-[#0D0C0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#14120E] border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] p-6 text-center space-y-5 relative">
          
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full w-14 h-14 flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold font-mono text-red-500 uppercase tracking-widest">
              ACCESS_DENIED // SECURITY_BREACH
            </h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Your profile is not authorized to access the Pizza Bites Control Center. Authorized sessions require the secure email `ailearner@admin.com`.
            </p>
          </div>

          <div className="bg-[#1C1A15] border border-[#2E271F] p-3.5 rounded-xl font-mono text-[10px] text-gray-500 text-left truncate">
            <span className="text-gray-600 block mb-1">CONNECTED_SIGNATURE:</span>
            {sessionUser.email}
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-[#1C1A15] hover:bg-red-500/10 border border-[#2E271F] hover:border-red-500/30 text-gray-300 hover:text-red-400 font-mono text-xs font-semibold py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>TERMINATE_SESSION</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Admin Dashboard Layout (Authenticated Admin)
  return (
    <div className="h-screen bg-[#0D0C0A] flex flex-col overflow-hidden font-sans">
      
      {/* Dashboard Top Header */}
      <header className="border-b border-[#2E271F] bg-[#14120E] px-6 py-4 flex items-center justify-between z-30 flex-shrink-0 select-none">
        
        <div className="flex items-center space-x-3">
          <h1 className="text-base md:text-lg font-bold tracking-tight bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            Pizza Bites Control Center
          </h1>
          <span className="text-gray-600 font-mono text-[9px] md:inline hidden select-none">|</span>
          <span className="text-gray-500 font-mono text-[9px] tracking-widest md:inline hidden uppercase">
            ADMIN_CONSOLE_NODE
          </span>
        </div>

        {/* Header center: stats box */}
        <div className="hidden lg:flex items-center space-x-6 bg-[#0D0C0A] border border-[#2E271F] px-4 py-2 rounded-xl text-xs font-mono">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-amber-500" />
            <span className="text-gray-400">Total Customer Threads:</span>
            <span className="text-amber-500 font-bold text-sm">{totalChatsCount}</span>
          </div>
        </div>

        {/* Actions right */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <button
            onClick={() => fetchChatsList(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-lg bg-[#0D0C0A] border border-[#2E271F] hover:border-amber-500/40 text-gray-300 hover:text-amber-500 cursor-pointer flex items-center space-x-1.5 transition-all"
            title="Fetch Latest Chat Nodes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span className="md:inline hidden">Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 cursor-pointer flex items-center space-x-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="md:inline hidden">Logout</span>
          </button>
        </div>

      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden w-full">
        
        {/* Left chats sidebar */}
        <aside className="w-80 border-r border-[#2E271F] bg-[#14120E] flex flex-col h-full flex-shrink-0 select-none hidden md:flex">
          
          <div className="text-[10px] tracking-widest text-gray-500 font-mono px-4 py-3 border-b border-[#2E271F]/40 uppercase flex items-center justify-between">
            <span>Customer Thread Archives</span>
            {refreshing && <span className="text-amber-500 animate-pulse">Syncing...</span>}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
            {loadingChats ? (
              <div className="text-center py-12 text-gray-600 font-mono text-xs">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-amber-500/50 mb-2" />
                <span>QUERYING_ACTIVE_NODES...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-mono text-xs italic">
                No active matrices found.
              </div>
            ) : (
              chats.map((chat) => {
                const isActive = chat.id === selectedChatId;
                return (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`group flex items-center space-x-2.5 px-3 py-3 rounded-lg cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-amber-500/5 border-amber-500/30 text-amber-500'
                        : 'bg-transparent border-transparent text-gray-400 hover:bg-[#181612] hover:text-gray-200'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActive ? 'text-amber-500' : 'text-gray-500'}`} />
                    <div className="overflow-hidden">
                      <div className="text-xs font-semibold truncate font-sans">{chat.title || 'Pizza Bites Session'}</div>
                      <div className="text-[8px] text-gray-500 font-mono mt-0.5">{getRelativeTime(chat.created_at)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </aside>

        {/* Main right transcript viewport (WhatsApp Web style) */}
        <main className="flex-1 flex flex-col bg-[#0D0C0A] h-full overflow-hidden w-full">
          
          {!selectedChatId ? (
            /* Blank state screen */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
              <Eye className="w-12 h-12 text-[#2E271F] mb-3 animate-pulse" />
              <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                SELECT_MONITOR_NODE
              </h3>
              <p className="text-xs text-gray-600 mt-2 font-sans max-w-xs leading-relaxed">
                Click a customer ordering session from the sidebar index to stream the live conversation transcript.
              </p>
            </div>
          ) : (
            /* Selected Chat viewport */
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
              
              {/* Header details */}
              <div className="px-6 py-3 border-b border-[#2E271F] bg-[#14120E]/40 flex justify-between items-center select-none flex-shrink-0">
                <div>
                  <h3 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-wider">
                    {chats.find(c => c.id === selectedChatId)?.title || 'Pizza Bites Session'}
                  </h3>
                  <p className="text-[8px] text-gray-500 font-mono mt-0.5 uppercase tracking-widest">
                    NODE_ID: {selectedChatId}
                  </p>
                </div>
                
                <div className="flex items-center space-x-1.5 text-[8px] text-green-500 bg-green-500/5 border border-green-500/10 px-2 py-1 rounded font-mono uppercase tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-ping" />
                  <span>SECURE_MONITORING</span>
                </div>
              </div>

              {/* Chat timeline body */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
              >
                {loadingMessages ? (
                  <div className="text-center py-24 text-gray-600 font-mono text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-amber-500/50 mb-2" />
                    <span>FETCHING_TRANSCRIPT_LOGS...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-24 text-gray-600 font-mono text-xs italic">
                    Empty conversation logs.
                  </div>
                ) : (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {messages.map((msg) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div 
                          key={msg.id} 
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow relative border ${
                            isUser 
                              ? 'bg-[#14120E]/40 border-[#2E271F] rounded-br-sm text-right' 
                              : 'bg-[#14120E] border-l-2 border-amber-500 border-[#2E271F] rounded-bl-sm text-left'
                          }`}>
                            <div className="text-[8px] font-mono text-gray-500 tracking-wider mb-1 uppercase font-bold select-none">
                              {isUser ? 'Customer' : 'SliceAI 🍕'}
                            </div>
                            <p className="text-xs md:text-sm text-gray-200 font-sans whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </p>
                            {getFormattedTime(msg.created_at) && (
                              <div className="text-[7px] text-gray-600 font-mono mt-1 select-none">
                                {getFormattedTime(msg.created_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Read only status bar */}
              <div className="p-4 border-t border-[#2E271F] bg-[#14120E] flex items-center justify-center space-x-2 select-none flex-shrink-0">
                <Terminal className="w-4 h-4 text-amber-500/60" />
                <span className="text-[9px] tracking-widest text-amber-500/60 font-mono uppercase">
                  MONITOR NODE ONLY // Secure Transcript Stream Active
                </span>
              </div>

            </div>
          )}

        </main>

      </div>
      
    </div>
  );
}
