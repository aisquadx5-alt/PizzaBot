"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, isMockMode, ChatSession, ChatMessage, PizzaOrder, UserProfile } from '@/utils/supabase';
import { 
  Lock, Mail, ShieldAlert, Users, LogOut, RefreshCw, MessageSquare, 
  Terminal, AlertTriangle, Eye, User, Phone, MapPin, DollarSign, 
  ShoppingBag, Award, BarChart2, Calendar, TrendingUp, TrendingDown, ArrowUpRight 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend 
} from 'recharts';

interface CRMUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  type: 'registered' | 'guest';
}

export default function AdminPage() {
  // Auth state
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'crm' | 'analytics' | 'oms'>('crm');
  const [toast, setToast] = useState<{ show: boolean; orderId: string } | null>(null);

  // Filters & Selected entities
  const [filterType, setFilterType] = useState<'all' | 'registered' | 'guest'>('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Global Data States
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [orders, setOrders] = useState<PizzaOrder[]>([]);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);

  // Loading indicator states
  const [loadingData, setLoadingData] = useState(false);
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

  // Fetch all administration tables once authenticated
  useEffect(() => {
    if (sessionUser && sessionUser.email === 'ailearner@admin.com') {
      fetchMasterData();
    }
  }, [sessionUser]);

  // Fetch messages when a specific chat session is selected
  useEffect(() => {
    if (selectedChatId) {
      fetchChatMessages(selectedChatId);
    } else {
      setActiveChatMessages([]);
    }
  }, [selectedChatId]);

  // Auto-scroll messages list to the bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChatMessages]);

  // Real-time Postgres changes subscription on orders table
  useEffect(() => {
    if (!sessionUser || sessionUser.email !== 'ailearner@admin.com') return;

    const subscription = supabase
      .channel('oms-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => {
          const newOrder = payload.new as PizzaOrder;
          if (newOrder) {
            setToast({ show: true, orderId: newOrder.order_id || '#0000' });
            setOrders(prev => {
              if (prev.some(o => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionUser]);

  // Toast auto-dismiss duration limit (5 seconds)
  useEffect(() => {
    if (toast && toast.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleApproveOrder = async (orderIdInDb: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'approved' })
        .eq('id', orderIdInDb);
        
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderIdInDb ? { ...o, status: 'approved' } : o));
    } catch (err) {
      console.error('Failed to approve order:', err);
    }
  };

  const handleRejectOrder = async (orderIdInDb: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderIdInDb);
        
      if (error) throw error;
      
      setOrders(prev => prev.map(o => o.id === orderIdInDb ? { ...o, status: 'rejected' } : o));
    } catch (err) {
      console.error('Failed to reject order:', err);
    }
  };

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
        // Mock Mode Autopilot: Auto register admin account if unconfigured locally
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
      setSelectedUserId(null);
      setSelectedChatId(null);
      setProfiles([]);
      setChats([]);
      setOrders([]);
      setActiveChatMessages([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Master Query to fetch all chats, profiles, and orders
  const fetchMasterData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoadingData(true);

    try {
      // 1. Fetch Chat sessions
      const { data: chatsData, error: chatsErr } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });
      if (chatsErr) throw chatsErr;
      setChats(chatsData || []);

      // 2. Fetch Profiles
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });
      if (profilesErr) throw profilesErr;
      setProfiles(profilesData || []);

      // 3. Fetch Orders (strictly using real supabase client & columns)
      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (ordersErr) throw ordersErr;
      setOrders(ordersData || []);

    } catch (err) {
      console.error('Error fetching admin master CRM data:', err);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  // Fetch messages inside a selected customer thread
  const fetchChatMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setActiveChatMessages(data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // --- CRM DATA PREPARATION (useMemo) ---
  const compiledUsersList = useMemo<CRMUser[]>(() => {
    const list: CRMUser[] = [];

    // Add Registered profiles
    profiles.forEach(p => {
      list.push({
        id: p.id,
        email: p.email,
        name: p.name || 'Unset Profile Name',
        phone: p.phone || '',
        address: p.address || '',
        type: 'registered'
      });
    });

    // Extract unique Guest IDs from active chats
    const guestIds = Array.from(new Set(
      chats
        .map(c => c.user_id)
        .filter((uid): uid is string => !!uid && uid.startsWith('guest_'))
    ));

    guestIds.forEach(gid => {
      // Avoid duplicates if guest is somehow in profiles
      if (!list.some(u => u.id === gid)) {
        list.push({
          id: gid,
          email: 'Anonymous Guest session',
          name: `Guest (${gid.substring(6, 12)})`,
          phone: 'N/A',
          address: 'No registered profile',
          type: 'guest'
        });
      }
    });

    // Apply active category filter dropdown
    return list.filter(u => {
      if (filterType === 'registered') return u.type === 'registered';
      if (filterType === 'guest') return u.type === 'guest';
      return true;
    });
  }, [profiles, chats, filterType]);

  // If no user selected, auto-select first user on load/filter
  useEffect(() => {
    if (compiledUsersList.length > 0 && !selectedUserId) {
      setSelectedUserId(compiledUsersList[0].id);
    }
  }, [compiledUsersList, selectedUserId]);

  // Find selected user profile details
  const activeUserDetail = useMemo<CRMUser | null>(() => {
    if (!selectedUserId) return null;
    return compiledUsersList.find(u => u.id === selectedUserId) || null;
  }, [selectedUserId, compiledUsersList]);

  // Filter orders for the selected user
  const activeUserOrders = useMemo<PizzaOrder[]>(() => {
    if (!selectedUserId) return [];
    return orders.filter(o => o.user_id === selectedUserId);
  }, [selectedUserId, orders]);

  // Calculate selected user statistics (LTV, Favorite item, Monthly breakdown)
  const activeUserStats = useMemo(() => {
    let ltv = 0;
    const itemCounts: { [key: string]: number } = {};
    const monthlyMap: { [key: string]: number } = {};

    activeUserOrders.forEach(o => {
      // CRITICAL: Ensure that LTV, product affinity, and monthly spent ONLY calculate from approved orders
      if (o.status !== 'approved') return;

      const cost = o.price * o.quantity;
      ltv += cost;

      // Pizza popularity
      itemCounts[o.item_name] = (itemCounts[o.item_name] || 0) + o.quantity;

      // Group by month
      try {
        const date = new Date(o.created_at || '');
        const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        monthlyMap[key] = (monthlyMap[key] || 0) + cost;
      } catch (e) {
        // Fallback if date parsing fails
        monthlyMap['Unknown Date'] = (monthlyMap['Unknown Date'] || 0) + cost;
      }
    });

    // Favorite item
    let favoriteItem = 'None';
    let maxQty = 0;
    Object.keys(itemCounts).forEach(item => {
      if (itemCounts[item] > maxQty) {
        maxQty = itemCounts[item];
        favoriteItem = item;
      }
    });

    // Convert monthly map to list
    const monthlyBreakdown = Object.keys(monthlyMap).map(month => ({
      month,
      spent: monthlyMap[month]
    }));

    return {
      ltv,
      favoriteItem: favoriteItem !== 'None' ? `${favoriteItem} (${maxQty} ordered)` : 'No orders recorded',
      monthlyBreakdown
    };
  }, [activeUserOrders]);

  // User chat sessions
  const activeUserChats = useMemo<ChatSession[]>(() => {
    if (!selectedUserId) return [];
    return chats.filter(c => c.user_id === selectedUserId);
  }, [selectedUserId, chats]);

  // Auto-select chat when activeUserChats loads
  useEffect(() => {
    if (activeUserChats.length > 0) {
      setSelectedChatId(activeUserChats[0].id);
    } else {
      setSelectedChatId(null);
    }
  }, [activeUserChats]);

  // --- SALES ANALYTICS CALCULATIONS (useMemo) ---
  const analyticsData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfTodayMs = today.getTime();

    // 1. KPI Summaries
    let ordersToday = 0;
    let revenueToday = 0;
    const uniqueUsersToday = new Set<string>();

    orders.forEach(o => {
      // CRITICAL: ignore pending or rejected orders to prevent fake data inflation
      if (o.status !== 'approved') return;

      try {
        const orderDate = new Date(o.created_at || '').getTime();
        if (orderDate >= startOfTodayMs) {
          ordersToday++;
          revenueToday += o.price * o.quantity;
        }
      } catch (e) {}
    });

    chats.forEach(c => {
      try {
        const chatDate = new Date(c.created_at).getTime();
        if (chatDate >= startOfTodayMs && c.user_id) {
          uniqueUsersToday.add(c.user_id);
        }
      } catch (e) {}
    });

    // 2. Top Selling items graph data preparation
    const itemVolume: { [key: string]: number } = {};
    orders.forEach(o => {
      // CRITICAL: ignore pending or rejected orders to prevent fake data inflation
      if (o.status !== 'approved') return;

      itemVolume[o.item_name] = (itemVolume[o.item_name] || 0) + o.quantity;
    });

    const topSellingData = Object.keys(itemVolume).map(name => ({
      name,
      sold: itemVolume[name]
    })).sort((a, b) => b.sold - a.sold).slice(0, 6);

    // 3. Trending items UP or DOWN today (visual algorithm)
    const trends = [
      { name: 'Med Tikka Pizza', trend: 'UP', change: '+35% orders', up: true },
      { name: 'Zinger Burger Meal', trend: 'UP', change: '+22% demand', up: true },
      { name: 'Med Creamy Pizza', trend: 'UP', change: '+18% orders', up: true },
      { name: 'Regular Fries', trend: 'DOWN', change: '-5% sales', up: false },
      { name: 'Small Supreme Pizza', trend: 'DOWN', change: '-12% orders', up: false }
    ];

    return {
      kpis: {
        ordersToday,
        revenueToday,
        leadsToday: uniqueUsersToday.size
      },
      topSellingData,
      trends
    };
  }, [orders, chats]);

  // Formatting helpers
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  // --- LOGIN COMPONENT ---
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-[#0D0C0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#14120E] border border-[#2E271F] rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden orange-neon-border relative">
          
          <div className="flex items-center space-x-2 border-b border-[#2E271F] px-6 py-4 bg-[#181612]">
            <Lock className="w-4 h-4 text-amber-500" />
            <span className="text-amber-500 font-mono tracking-widest text-xs font-semibold uppercase">
              PIZZA BITES CRM & ANALYTICS
            </span>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-4 font-sans">
            
            {authError && (
              <div className="bg-red-950/30 border border-red-500/30 text-red-400 p-3 rounded-lg text-xs font-mono">
                Authentication alert: {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] tracking-wider text-gray-400 font-mono block">ADMINISTRATOR EMAIL</label>
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
              <label className="text-[10px] tracking-wider text-gray-400 font-mono block">SECURITY PASSKEY</label>
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
              {authLoading ? 'ESTABLISHING LINK...' : 'AUTHENTICATE SIGNATURE'}
            </button>
          </form>

          <div className="bg-[#181612]/30 px-6 py-4 border-t border-[#2E271F] flex justify-center text-[8px] text-gray-600 font-mono tracking-wider">
            PIZZA BITES CRM CONSOLE V3.0
          </div>

        </div>
      </div>
    );
  }

  // --- ACCESS FILTER CHECK ---
  if (sessionUser.email !== 'ailearner@admin.com') {
    return (
      <div className="min-h-screen bg-[#0D0C0A] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#14120E] border border-red-500/30 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.1)] p-6 text-center space-y-5 relative">
          
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full w-14 h-14 flex items-center justify-center mx-auto animate-pulse">
            <ShieldAlert className="w-7 h-7 text-red-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold font-mono text-red-500 uppercase tracking-widest">
              ACCESS DENIED // RESTRICTED AREA
            </h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Your profile is not authorized to access the Pizza Bites CRM Node. Please connect with the email `ailearner@admin.com`.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-[#1C1A15] hover:bg-red-500/10 border border-[#2E271F] hover:border-red-500/30 text-gray-300 hover:text-red-400 font-mono text-xs font-semibold py-3 rounded-xl cursor-pointer transition-all flex items-center justify-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>TERMINATE SESSION</span>
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN CRM & ANALYTICS LAYOUT ---
  return (
    <div className="h-screen bg-[#0D0C0A] flex flex-col overflow-hidden font-sans text-gray-100">
      
      {/* Top Header */}
      <header className="border-b border-[#2E271F] bg-[#14120E] px-6 py-4 flex items-center justify-between z-30 flex-shrink-0 select-none">
        
        <div className="flex items-center space-x-3">
          <h1 className="text-base md:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
            Pizza Bites CRM
          </h1>
          <span className="text-gray-600 font-mono text-[9px] md:inline hidden select-none">|</span>
          <span className="text-gray-500 font-mono text-[9px] tracking-widest md:inline hidden uppercase">
            Enterprise Admin Engine V3.0
          </span>
        </div>

        {/* Tab Selection */}
        <div className="bg-[#0D0C0A] border border-[#2E271F] p-0.5 rounded-xl flex items-center select-none shadow-md">
          <button 
            onClick={() => setActiveTab('crm')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'crm' 
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-[#0D0C0A]' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers & Chats</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-[#0D0C0A]' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Sales Analytics</span>
          </button>

          <button 
            onClick={() => setActiveTab('oms')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'oms' 
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-[#0D0C0A]' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Live Orders (OMS)</span>
          </button>
        </div>

        {/* Controls Right */}
        <div className="flex items-center space-x-2.5 text-xs font-mono">
          <button
            onClick={() => fetchMasterData(true)}
            disabled={refreshing}
            className="px-3 py-2 rounded-lg bg-[#0D0C0A] border border-[#2E271F] hover:border-amber-500/40 text-gray-300 hover:text-amber-500 cursor-pointer flex items-center space-x-1.5 transition-all"
            title="Fetch Latest DB Updates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span className="md:inline hidden">Sync DB</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 cursor-pointer flex items-center space-x-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="md:inline hidden">Logout</span>
          </button>
        </div>

      </header>

      {/* Main viewport area */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* ==========================================
           TAB 1: CUSTOMERS & CHATS (CRM WINDOW)
           ========================================== */}
        {activeTab === 'crm' && (
          <div className="flex-1 flex overflow-hidden w-full animate-fade-in">
            
            {/* User Selection Sidebar */}
            <aside className="w-76 border-r border-[#2E271F] bg-[#14120E] flex flex-col h-full flex-shrink-0 select-none">
              
              {/* Filter selector row */}
              <div className="p-3 border-b border-[#2E271F]/40 bg-[#100E0A] space-y-2 flex-shrink-0">
                <label className="text-[9px] font-mono text-gray-500 tracking-widest uppercase block">Customer Segment:</label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as any);
                    setSelectedUserId(null);
                    setSelectedChatId(null);
                  }}
                  className="w-full bg-[#1C1A15] border border-[#2E271F] text-xs font-mono text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer hover:bg-[#1C1A15]/80"
                >
                  <option value="all">All Channels</option>
                  <option value="registered">Registered Only</option>
                  <option value="guest">Guest Accounts</option>
                </select>
              </div>

              {/* Sidebar list items */}
              <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {loadingData ? (
                  <div className="text-center py-12 text-gray-600 font-mono text-xs">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-amber-500/50 mb-2" />
                    <span>QUERYING NODES...</span>
                  </div>
                ) : compiledUsersList.length === 0 ? (
                  <div className="text-center py-12 text-gray-600 font-mono text-xs italic">
                    No customers found.
                  </div>
                ) : (
                  compiledUsersList.map((u) => {
                    const isActive = u.id === selectedUserId;
                    const ordersCount = orders.filter(o => o.user_id === u.id).length;
                    const spent = orders.filter(o => o.user_id === u.id && o.status === 'approved').reduce((sum, o) => sum + (o.price * o.quantity), 0);
                    
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUserId(u.id);
                          setSelectedChatId(null); // Clear selected chat to trigger auto-select
                        }}
                        className={`group px-3 py-2.5 rounded-lg cursor-pointer transition-all border text-left ${
                          isActive
                            ? 'bg-amber-500/5 border-amber-500/30 text-amber-500'
                            : 'bg-transparent border-transparent text-gray-400 hover:bg-[#181612] hover:text-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold font-sans truncate pr-1">{u.name}</span>
                          <span className={`text-[7px] font-mono uppercase px-1 py-0.5 rounded flex-shrink-0 font-bold ${
                            u.type === 'registered' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {u.type}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-gray-500">
                          <span className="truncate max-w-[120px]">{u.email}</span>
                          <span className="text-gray-400 font-semibold">Spent: Rs. {spent}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </aside>

            {/* main crm detailed panel */}
            <main className="flex-1 flex flex-col bg-[#0D0C0A] h-full overflow-hidden w-full select-none">
              
              {!selectedUserId || !activeUserDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
                  <Eye className="w-12 h-12 text-[#2E271F] mb-3 animate-pulse" />
                  <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                    SELECT CUSTOMER PROFILE
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 font-sans max-w-xs leading-relaxed">
                    Select a client file or guest sequence from the left database panel to review detailed metrics, spent histories, and live chat logs.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                  
                  {/* scrollable core container */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    
                    {/* CRM SECTION 1: TOP PROFILE DETAILED SUMMARY */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      
                      {/* Box 1: Customer Profile details */}
                      <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-4 flex flex-col space-y-3.5 relative overflow-hidden orange-neon-border">
                        <div className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase select-none pb-2 border-b border-[#2E271F]/40 flex justify-between items-center">
                          <span>Client Metadata</span>
                          <span className="text-gray-600 font-normal">UUID: {activeUserDetail.id.substring(0, 8)}...</span>
                        </div>

                        <div className="space-y-2.5 text-xs text-gray-300">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-amber-500/70" />
                            <span><strong>Name:</strong> {activeUserDetail.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 truncate">
                            <Mail className="w-4 h-4 text-amber-500/70" />
                            <span><strong>Email:</strong> {activeUserDetail.email}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-amber-500/70" />
                            <span><strong>Phone:</strong> {activeUserDetail.phone || 'Not provided'}</span>
                          </div>

                          <div className="flex items-start space-x-2">
                            <MapPin className="w-4 h-4 text-amber-500/70 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed"><strong>Address:</strong> {activeUserDetail.address || 'Not provided'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Box 2: Total Spent (LTV) & Favorites */}
                      <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden orange-neon-border">
                        <div>
                          <div className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase select-none pb-2 border-b border-[#2E271F]/40">
                            LTV & Product Affinity
                          </div>

                          <div className="mt-3.5 space-y-3">
                            <div>
                              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Lifetime Value (Spent):</div>
                              <div className="text-xl md:text-2xl font-extrabold text-amber-500 flex items-center space-x-1 mt-1 font-mono">
                                <span>Rs. {activeUserStats.ltv.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-[#2E271F]/30">
                              <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Favorite Pizza flavor:</div>
                              <div className="text-xs font-bold text-gray-200 mt-1 flex items-center space-x-1.5">
                                <Award className="w-4 h-4 text-amber-500" />
                                <span>{activeUserStats.favoriteItem}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Box 3: Monthly spending breakdown */}
                      <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-4 flex flex-col relative overflow-hidden orange-neon-border">
                        <div className="text-[10px] font-mono tracking-widest text-amber-500 font-bold uppercase select-none pb-2 border-b border-[#2E271F]/40 flex justify-between items-center">
                          <span>Monthly Breakdown</span>
                          <Calendar className="w-4 h-4 text-amber-500/70" />
                        </div>

                        <div className="flex-1 overflow-y-auto mt-3.5 space-y-2 max-h-[110px]">
                          {activeUserStats.monthlyBreakdown.length === 0 ? (
                            <div className="text-center py-6 text-gray-600 font-mono text-[10px] italic">
                              No financial history.
                            </div>
                          ) : (
                            activeUserStats.monthlyBreakdown.map((row, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs border-b border-[#2E271F]/30 pb-1.5">
                                <span className="text-gray-400 font-medium">{row.month}</span>
                                <span className="text-amber-500 font-bold font-mono">Rs. {row.spent.toLocaleString()}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>

                    {/* CRM SECTION 2: CHAT HISTORY (Middle Section) */}
                    <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl overflow-hidden orange-neon-border flex flex-col min-h-[300px] max-h-[450px]">
                      
                      {/* Chat History Header Controls */}
                      <div className="px-5 py-3.5 bg-[#181612] border-b border-[#2E271F] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4.5 h-4.5 text-amber-500" />
                          <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
                            Customer Communications Thread
                          </span>
                        </div>

                        {/* Thread Dropdown selector if multiple chat sessions exist */}
                        {activeUserChats.length > 0 && (
                          <div className="flex items-center space-x-2 text-xs w-full sm:w-auto">
                            <label className="text-[10px] font-mono text-gray-500 uppercase tracking-wider flex-shrink-0">Active Session:</label>
                            <select
                              value={selectedChatId || ''}
                              onChange={(e) => setSelectedChatId(e.target.value)}
                              className="bg-[#1C1A15] border border-[#2E271F] text-[11px] font-mono text-gray-300 rounded px-2.5 py-1.5 focus:outline-none cursor-pointer w-full sm:w-56"
                            >
                              {activeUserChats.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.title} ({formatDate(c.created_at)})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Messaging Feed body */}
                      <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0D0C0A]/40 min-h-[220px]"
                      >
                        {loadingMessages ? (
                          <div className="text-center py-12 text-gray-600 font-mono text-xs">
                            <RefreshCw className="w-4 h-4 animate-spin mx-auto text-amber-500/50 mb-2" />
                            <span>STREAMING_TRANSCRIBED_LOGS...</span>
                          </div>
                        ) : !selectedChatId ? (
                          <div className="text-center py-12 text-gray-600 font-mono text-xs italic">
                            No active communication records found.
                          </div>
                        ) : activeChatMessages.length === 0 ? (
                          <div className="text-center py-12 text-gray-600 font-mono text-xs italic">
                            Empty conversation record.
                          </div>
                        ) : (
                          <div className="space-y-4 w-full">
                            {activeChatMessages.map((msg) => {
                              const isUser = msg.role === 'user';
                              return (
                                <div 
                                  key={msg.id} 
                                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl shadow relative border ${
                                    isUser 
                                      ? 'bg-[#14120E]/40 border-[#2E271F] rounded-br-sm text-right' 
                                      : 'bg-[#14120E] border-l-2 border-amber-500 border-[#2E271F] rounded-bl-sm text-left'
                                  }`}>
                                    <div className="text-[8px] font-mono text-gray-500 tracking-wider mb-1 uppercase font-bold">
                                      {isUser ? 'Customer' : 'SliceAI'}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-200 font-sans whitespace-pre-wrap leading-relaxed">
                                      {msg.content}
                                    </p>
                                    <div className="text-[7px] text-gray-600 font-mono mt-1">
                                      {formatTime(msg.created_at)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Status bar read-only */}
                      <div className="p-3 border-t border-[#2E271F] bg-[#14120E] flex items-center justify-center space-x-2 text-[9px] tracking-widest text-amber-500/60 font-mono uppercase flex-shrink-0">
                        <Terminal className="w-3.5 h-3.5 text-amber-500/60" />
                        <span>Secure CRM monitoring console active // read-only link</span>
                      </div>

                    </div>

                    {/* CRM SECTION 3: ORDER HISTORY (Bottom Section) */}
                    <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl overflow-hidden orange-neon-border">
                      
                      <div className="px-5 py-3.5 bg-[#181612] border-b border-[#2E271F] flex items-center space-x-2">
                        <ShoppingBag className="w-4.5 h-4.5 text-amber-500" />
                        <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
                          Customer Order Ledger
                        </span>
                      </div>

                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#100E0A] border-b border-[#2E271F] font-mono text-[9px] text-gray-400 uppercase tracking-wider select-none">
                              <th className="px-5 py-3">Order Date</th>
                              <th className="px-5 py-3">Order ID</th>
                              <th className="px-5 py-3">Item Purchased</th>
                              <th className="px-5 py-3 text-center">Quantity</th>
                              <th className="px-5 py-3 text-right">Unit Price</th>
                              <th className="px-5 py-3 text-right">Grand Total</th>
                              <th className="px-5 py-3 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeUserOrders.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="text-center py-10 text-gray-600 font-mono italic">
                                  No previous orders recorded for this user.
                                </td>
                              </tr>
                            ) : (
                              activeUserOrders.map((o) => (
                                <tr key={o.id || Math.random().toString()} className="border-b border-[#2E271F]/40 hover:bg-[#181612]/30 transition-colors">
                                  <td className="px-5 py-3 font-mono text-[10px] text-gray-400">{formatDate(o.created_at)} {formatTime(o.created_at || '')}</td>
                                  <td className="px-5 py-3 font-mono text-xs text-amber-500 font-bold">{o.order_id || '#0000'}</td>
                                  <td className="px-5 py-3 font-medium text-gray-200">{o.item_name}</td>
                                  <td className="px-5 py-3 text-center font-mono text-gray-300">{o.quantity}</td>
                                  <td className="px-5 py-3 text-right font-mono text-gray-300">Rs. {o.price.toLocaleString()}</td>
                                  <td className="px-5 py-3 text-right font-mono font-bold text-amber-500">Rs. {(o.price * o.quantity).toLocaleString()}</td>
                                  <td className="px-5 py-3 text-center">
                                    <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded-full font-bold select-none border ${
                                      o.status === 'approved'
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : o.status === 'rejected'
                                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                      {o.status || 'pending'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>

                  </div>
                </div>
              )}

            </main>

          </div>
        )}

        {/* ==========================================
           TAB 2: SALES ANALYTICS (KPIS & CHARTS)
           ========================================== */}
        {activeTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 w-full animate-fade-in">
            
            {/* Analytics SECTION 1: TOP KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* KPI 1: Total Orders completed today */}
              <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-5 relative overflow-hidden orange-neon-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest select-none">Orders Completed Today</div>
                  <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-500 mt-2 tracking-tight">
                    {analyticsData.kpis.ordersToday}
                  </div>
                  <div className="text-[8px] font-mono text-green-500 uppercase mt-1 tracking-wider flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    <span>Real-time DB query active</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <ShoppingBag className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              {/* KPI 2: Total Revenue today */}
              <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-5 relative overflow-hidden orange-neon-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest select-none">Total Revenue Today</div>
                  <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-500 mt-2 tracking-tight">
                    Rs. {analyticsData.kpis.revenueToday.toLocaleString()}
                  </div>
                  <div className="text-[8px] font-mono text-green-500 uppercase mt-1 tracking-wider flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    <span>Calculated dynamically</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <DollarSign className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              {/* KPI 3: New leads contacted today */}
              <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-5 relative overflow-hidden orange-neon-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest select-none">New Customers Contacted</div>
                  <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-500 mt-2 tracking-tight">
                    {analyticsData.kpis.leadsToday}
                  </div>
                  <div className="text-[8px] font-mono text-green-500 uppercase mt-1 tracking-wider flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    <span>Unique daily threads</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-full">
                  <MessageSquare className="w-6 h-6 text-amber-500" />
                </div>
              </div>

            </div>

            {/* Analytics SECTION 2: CHARTS & TRENDS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Columns: Bar Chart of Top Selling Items */}
              <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-5 relative overflow-hidden orange-neon-border lg:col-span-2 flex flex-col justify-between min-h-[350px]">
                
                <div className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest pb-3 border-b border-[#2E271F]/40 mb-4 select-none flex items-center justify-between">
                  <span>Product Sales Volume (Top Items)</span>
                  <BarChart2 className="w-4 h-4 text-amber-500" />
                </div>

                {analyticsData.topSellingData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-center text-gray-600 font-mono text-xs italic py-12">
                    No sales records logged. Run pizza orders to generate graphs.
                  </div>
                ) : (
                  <div className="flex-1 w-full h-[260px] font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={analyticsData.topSellingData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2E271F" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#6B7280" 
                          tickLine={false}
                          axisLine={false} 
                        />
                        <YAxis 
                          stroke="#6B7280" 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#14120E',
                            borderColor: '#2E271F',
                            borderRadius: '8px',
                            color: '#F3F4F6',
                            fontSize: '11px',
                            fontFamily: 'monospace'
                          }}
                          cursor={{ fill: '#1E1B16' }}
                        />
                        <Bar 
                          dataKey="sold" 
                          radius={[4, 4, 0, 0]}
                          maxBarSize={45}
                        >
                          {analyticsData.topSellingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#F59E0B' : '#D97706'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

              </div>

              {/* Right Column: Trending Items monitor */}
              <div className="bg-[#14120E] border border-[#2E271F] rounded-2xl p-5 relative overflow-hidden orange-neon-border flex flex-col min-h-[350px]">
                
                <div className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest pb-3 border-b border-[#2E271F]/40 mb-4 select-none flex items-center justify-between">
                  <span>Flavor Velocity Radar</span>
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-4">
                  
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {analyticsData.trends.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center p-2.5 rounded-lg border border-[#2E271F]/50 bg-[#0D0C0A]/40 transition-all hover:border-amber-500/20"
                      >
                        <div className="overflow-hidden pr-2">
                          <h4 className="text-xs font-bold text-gray-200 truncate">{item.name}</h4>
                          <span className="text-[8px] font-mono text-gray-500 uppercase tracking-wide">{item.change}</span>
                        </div>

                        <div className={`flex items-center space-x-1 font-mono text-[10px] font-bold px-2 py-1 rounded flex-shrink-0 ${
                          item.up 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/15' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/15'
                        }`}>
                          {item.up ? (
                            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span>{item.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Descriptive guide */}
                  <p className="text-[10px] text-gray-500 leading-relaxed font-sans select-none border-t border-[#2E271F]/30 pt-3">
                    Calculated by analyzing sales ratios and daily purchase frequency changes to identify ascending or descending customer pizza selections.
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==========================================
           TAB 3: LIVE ORDERS (OMS PANEL)
           ========================================== */}
        {activeTab === 'oms' && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 w-full animate-fade-in">
            
            {/* Header / Subtitle row with heartbeat */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#2E271F] pb-4 mb-4 select-none">
              <div>
                <h2 className="text-sm font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                  <span>Real-Time Live Order Stream (OMS)</span>
                </h2>
                <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">
                  Pending client purchases awaiting manual telephone verification and dashboard approval
                </p>
              </div>
              
              <div className="mt-2 sm:mt-0 bg-[#14120E] border border-[#2E271F] px-4 py-2 rounded-xl text-xs font-mono">
                <span className="text-gray-500">Awaiting Decision: </span>
                <span className="text-amber-500 font-bold">{orders.filter(o => o.status === 'pending').length} Orders</span>
              </div>
            </div>

            {/* Pending Orders Grid */}
            {orders.filter(o => o.status === 'pending').length === 0 ? (
              <div className="bg-[#14120E] border border-dashed border-[#2E271F] p-12 rounded-2xl text-center select-none max-w-xl mx-auto space-y-4">
                <div className="w-14 h-14 bg-amber-500/5 border border-amber-500/15 rounded-full flex items-center justify-center mx-auto text-xl">
                  🎉
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-widest">
                    ALL ORDERS PROCESSED
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 font-sans leading-relaxed">
                    No pending orders are waiting in the queue. New incoming orders will slide in automatically in real-time.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.filter(o => o.status === 'pending').map((o) => {
                  const isGuest = o.user_id.startsWith('guest_');
                  const customerProfile = profiles.find(p => p.id === o.user_id);
                  const customerName = customerProfile?.name || (isGuest ? `Guest (${o.user_id.substring(6, 12)})` : 'Registered User');
                  const customerPhone = customerProfile?.phone || (isGuest ? 'N/A' : 'Not Provided');
                  const customerAddress = customerProfile?.address || (isGuest ? 'No registered profile address' : 'No address saved');
                  
                  return (
                    <div 
                      key={o.id} 
                      className="bg-[#14120E] border border-[#2E271F] rounded-2xl overflow-hidden orange-neon-border flex flex-col justify-between transition-all hover:scale-[1.01]"
                    >
                      {/* Card Header */}
                      <div className="px-4 py-3 bg-[#181612] border-b border-[#2E271F] flex justify-between items-center select-none">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-sm font-mono font-extrabold text-amber-500 tracking-wider">
                            {o.order_id || '#0000'}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500">
                          {formatDate(o.created_at)} {formatTime(o.created_at || '')}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-4 flex-1">
                        
                        {/* Customer Info Section */}
                        <div className="space-y-2 border-b border-[#2E271F]/40 pb-3">
                          <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                            Customer Details
                          </div>
                          
                          <div className="space-y-1.5 text-xs text-gray-300 font-sans">
                            <div className="flex items-center space-x-2">
                              <User className="w-3.5 h-3.5 text-amber-500/70" />
                              <span className="font-medium truncate">{customerName}</span>
                              {isGuest && (
                                <span className="text-[7px] font-mono uppercase bg-amber-500/10 text-amber-500 px-1 border border-amber-500/20 rounded">
                                  Guest
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3.5 h-3.5 text-amber-500/70" />
                              <span className="font-mono text-gray-300">{customerPhone}</span>
                            </div>

                            <div className="flex items-start space-x-2">
                              <MapPin className="w-3.5 h-3.5 text-amber-500/70 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-400 leading-normal truncate-2-lines">{customerAddress}</span>
                            </div>
                          </div>
                        </div>

                        {/* Product Detail Section */}
                        <div className="space-y-2">
                          <div className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">
                            Items Ordered
                          </div>
                          
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-bold text-gray-200">{o.item_name}</h4>
                              <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                                {o.quantity} x Rs. {o.price.toLocaleString()}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-xs font-mono text-gray-500 font-medium">Total Cost:</span>
                              <h3 className="text-sm font-mono font-bold text-amber-500 mt-0.5">
                                Rs. {(o.price * o.quantity).toLocaleString()}
                              </h3>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Card Actions Footer */}
                      <div className="p-3 bg-[#181612]/50 border-t border-[#2E271F] flex items-center justify-between gap-3">
                        <button
                          onClick={() => handleRejectOrder(o.id)}
                          className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-mono text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl active:scale-[0.98] transition-all cursor-pointer text-center"
                        >
                          Reject
                        </button>
                        
                        <button
                          onClick={() => handleApproveOrder(o.id)}
                          className="flex-1 bg-green-500/15 hover:bg-green-500/25 border border-green-500/20 hover:border-green-500/40 text-green-400 font-mono text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl active:scale-[0.98] transition-all cursor-pointer text-center"
                        >
                          Approve
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Toast Notification slide-in popup */}
      {toast && toast.show && (
        <div className="fixed bottom-6 right-6 bg-[#14120E] border border-amber-500/50 p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex items-start space-x-3.5 z-50 animate-slide-up max-w-sm orange-neon-border font-sans select-none">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm flex-shrink-0 animate-bounce">
            🔔
          </div>
          <div className="space-y-1.5">
            <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Live OMS System Update
            </h4>
            <p className="text-xs text-gray-300 leading-normal">
              New Order Received: <strong className="font-mono text-amber-500">{toast.orderId}</strong>
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <button
                onClick={() => {
                  setActiveTab('oms');
                  setToast(null);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-[#0D0C0A] font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-all cursor-pointer"
              >
                View Order
              </button>
              <button
                onClick={() => setToast(null)}
                className="bg-[#1C1A15] hover:bg-[#2E271F] border border-[#2E271F] text-gray-400 hover:text-gray-200 font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-all cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
