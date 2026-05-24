"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isMockMode, ChatSession, ChatMessage } from '@/utils/supabase';

interface TelemetryState {
  hydration: number;     // e.g. 72%
  temperature: number;   // e.g. 450°C
  crispIndex: string;    // e.g. "HIGH"
  status: string;        // e.g. "ENCODING_FLAVOR_MATRICES"
}

interface ChatContextType {
  isWidgetMode: boolean;
  isWidgetOpen: boolean;
  chats: ChatSession[];
  currentChatId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isTypewriting: boolean;
  currentlyTypewritingId: string | null;
  user: any | null;
  authModalOpen: boolean;
  authModalTab: 'signin' | 'signup';
  apiError: string | null;
  telemetry: TelemetryState;
  guestId: string;
  isSidebarOpen: boolean;
  
  toggleMode: () => void;
  setWidgetOpen: (open: boolean) => void;
  startNewChat: (title?: string) => Promise<string | null>;
  selectChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setAuthModalOpen: (open: boolean) => void;
  setAuthModalTab: (tab: 'signin' | 'signup') => void;
  logout: () => Promise<void>;
  clearApiError: () => void;
  completeTypewriter: (msgId: string) => void;
  updateTelemetry: (fields: Partial<TelemetryState>) => void;
  setSidebarOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const DEFAULT_TELEMETRY: TelemetryState = {
  hydration: 65,
  temperature: 400,
  crispIndex: "STANDARD",
  status: "Ready to assist",
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // UI toggles
  const [isWidgetMode, setIsWidgetMode] = useState<boolean>(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  
  // Mobile sidebar state
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // Chats and State
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Loading & Typewriter locks
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTypewriting, setIsTypewriting] = useState<boolean>(false);
  const [currentlyTypewritingId, setCurrentlyTypewritingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Custom pizza telemetry
  const [telemetry, setTelemetry] = useState<TelemetryState>(DEFAULT_TELEMETRY);
  
  // User Auth & Unique Guest ID
  const [user, setUser] = useState<any | null>(null);
  const [guestId, setGuestId] = useState<string>('');

  // Initialize modes, check session, and generate guest ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedMode = localStorage.getItem('pizza_is_widget_mode');
      if (storedMode) {
        setIsWidgetMode(storedMode === 'true');
      }

      // Generate or load unique Guest ID (Issue 1)
      let id = localStorage.getItem('pizza_guest_id');
      if (!id) {
        id = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('pizza_guest_id', id);
      }
      setGuestId(id);
    }

    // Subscribe to Supabase auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (event === 'SIGNED_IN') {
        setAuthModalOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch chats list whenever user or guestId changes
  useEffect(() => {
    if (guestId || user) {
      fetchChats();
    }
  }, [user, guestId]);

  // Read telemetry metrics from the latest messages
  useEffect(() => {
    if (messages.length === 0) {
      setTelemetry(DEFAULT_TELEMETRY);
      return;
    }

    // Scan messages for clean status updates
    let detectedHydration = DEFAULT_TELEMETRY.hydration;
    let detectedTemperature = DEFAULT_TELEMETRY.temperature;
    let detectedCrisp = DEFAULT_TELEMETRY.crispIndex;
    let detectedStatus = "Ready to assist";

    messages.forEach(msg => {
      const txt = msg.content.toLowerCase();
      
      if (txt.includes('margherita')) {
        detectedStatus = "Drafting Margherita Order 🍕";
      } else if (txt.includes('pepperoni')) {
        detectedStatus = "Drafting Pepperoni Order 🍕";
      } else if (txt.includes('menu')) {
        detectedStatus = "Browsing Menu 🍕";
      }

      // Simple temperature parsing
      const tempMatch = txt.match(/(\d+)\s*(?:°c|c|degrees|degree)/);
      if (tempMatch && tempMatch[1]) {
        detectedTemperature = parseInt(tempMatch[1]);
      }
    });

    setTelemetry({
      hydration: detectedHydration,
      temperature: detectedTemperature,
      crispIndex: detectedCrisp,
      status: detectedStatus
    });

  }, [messages]);

  const toggleMode = () => {
    setIsWidgetMode(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pizza_is_widget_mode', String(next));
      }
      return next;
    });
  };

  const setWidgetOpen = (open: boolean) => {
    setIsWidgetOpen(open);
  };

  const fetchChats = async () => {
    try {
      let query = supabase.from('chats').select('*');
      
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        const activeGuestId = guestId || (typeof window !== 'undefined' ? localStorage.getItem('pizza_guest_id') : null);
        if (activeGuestId) {
          query = query.eq('user_id', activeGuestId);
        } else {
          return; // Wait until guestId is generated
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      const chatSessions: ChatSession[] = data || [];
      setChats(chatSessions);

      // Auto-select latest chat session if any and none is active
      if (chatSessions.length > 0 && !currentChatId) {
        selectChat(chatSessions[0].id);
      } else if (chatSessions.length === 0) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  const selectChat = async (chatId: string) => {
    try {
      setCurrentChatId(chatId);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Stop typing if we switch chats
      setIsTypewriting(false);
      setCurrentlyTypewritingId(null);
    } catch (err) {
      console.error('Error selecting chat:', err);
    }
  };

  const startNewChat = async (title: string = 'New Order') => {
    try {
      const activeUserId = user ? user.id : (guestId || (typeof window !== 'undefined' ? localStorage.getItem('pizza_guest_id') : null) || 'guest');
      const newChat = {
        title,
        user_id: activeUserId,
        created_at: new Date().toISOString(),
      };

      let created: ChatSession;

      try {
        const { data, error } = await supabase.from('chats').insert(newChat).select();
        if (error) throw error;
        created = data?.[0] as ChatSession;
      } catch (dbErr) {
        console.error('Supabase chat insert failed, falling back to local memory session:', dbErr);
        created = {
          id: 'local_' + Math.random().toString(36).substring(2, 15),
          user_id: activeUserId,
          title,
          created_at: new Date().toISOString()
        };
      }

      setChats(prev => [created, ...prev]);
      setCurrentChatId(created.id);
      setMessages([]);
      
      setIsTypewriting(false);
      setCurrentlyTypewritingId(null);
      return created.id;
    } catch (err) {
      console.error('Error creating chat:', err);
      return null;
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase.from('chats').delete().eq('id', chatId);
      if (error) throw error;

      setChats(prev => prev.filter(c => c.id !== chatId));

      if (currentChatId === chatId) {
        const remaining = chats.filter(c => c.id !== chatId);
        if (remaining.length > 0) {
          selectChat(remaining[0].id);
        } else {
          setCurrentChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading || isTypewriting) return;

    let activeId = currentChatId;
    
    // Auto-create chat if none is active
    if (!activeId) {
      const sliceTitle = content.length > 25 ? content.substring(0, 22) + '...' : content;
      activeId = await startNewChat(sliceTitle);
      if (!activeId) return;
    }

    // 1. Prepare User Message Local State Object with temp id
    const userMsg: ChatMessage = {
      id: 'local_user_' + Math.random().toString(36).substring(2, 15),
      chat_id: activeId,
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setIsLoading(true);
    setApiError(null);

    // Instantly append user message to local state so the UI updates immediately!
    setMessages(prev => [...prev, userMsg]);

    // Save user message to database inside a safe, isolated try/catch block
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: activeId,
          role: 'user',
          content: content.trim(),
          created_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error('Supabase user message insert error caught, falling back to memory:', error.message || error);
      } else if (data && data[0]) {
        // Swap out the local temp id with the real saved database id if successful
        const savedMsg = data[0] as ChatMessage;
        setMessages(prev => prev.map(m => m.id === userMsg.id ? savedMsg : m));
      }
    } catch (dbErr) {
      console.error('Database write error (User Message) caught gracefully. Continuing execution...', dbErr);
    }

    // Update Chat Session Title if it's currently the default
    try {
      const currentChat = chats.find(c => c.id === activeId);
      if (currentChat && (currentChat.title === 'New Order' || currentChat.title === 'Chef.Protocol Engine')) {
        const cleanTitle = content.length > 25 ? content.substring(0, 22) + '...' : content;
        setChats(prev => prev.map(c => c.id === activeId ? { ...c, title: cleanTitle } : c));
        
        // Attempt database write asynchronously
        supabase.from('chats').update({ title: cleanTitle }).eq('id', activeId).catch(() => {});
      }
    } catch (titleErr) {
      console.error('Gracefully caught chat title update error:', titleErr);
    }

    // Gather conversation history for OpenRouter
    // We construct the thread from local state history + current input to guarantee correctness
    const threadHistory = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content
    }));

    let aiContent = '';
    let apiSuccess = false;

    // 2. Fetch AI Response from our secure local endpoint (Issue 4)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: threadHistory }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Server error occurred communicating with OpenRouter');
      }

      const resData = await response.json();
      aiContent = resData.content;
      apiSuccess = true;
    } catch (err: any) {
      console.error('Error calling /api/chat OpenRouter API route:', err);
      setIsLoading(false);
      setApiError(err.message || 'Connection failed. Please inspect your OpenRouter API Key.');
      return; // Do not block UI, display error card instead
    }

    // 3. Save and display the AI assistant response
    if (apiSuccess && aiContent) {
      const aiMsgId = 'local_ai_' + Math.random().toString(36).substring(2, 15);
      
      const assistantMsg: ChatMessage = {
        id: aiMsgId,
        chat_id: activeId,
        role: 'assistant',
        content: aiContent,
        created_at: new Date().toISOString(),
      };

      // Lock UI for the typewriter animation duration (Typewriter Sync)
      setIsLoading(false);
      setIsTypewriting(true);
      setCurrentlyTypewritingId(aiMsgId);
      
      // Append the assistant message into state to start the typewriter effect
      setMessages(prev => [...prev, assistantMsg]);

      // Save AI response to database inside a safe, isolated try/catch block
      try {
        const { data, error } = await supabase
          .from('messages')
          .insert({
            chat_id: activeId,
            role: 'assistant',
            content: aiContent,
            created_at: new Date().toISOString()
          })
          .select();

        if (error) {
          console.error('Supabase assistant message insert error caught, falling back to memory:', error.message || error);
        } else if (data && data[0]) {
          // Swap temp ID with final ID
          const savedAiMsg = data[0] as ChatMessage;
          setMessages(prev => prev.map(m => m.id === aiMsgId ? savedAiMsg : m));
          setCurrentlyTypewritingId(savedAiMsg.id);
        }
      } catch (dbErr) {
        console.error('Database write error (AI Message) caught gracefully. Continuing execution...', dbErr);
      }
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setCurrentChatId(null);
      setMessages([]);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const clearApiError = () => {
    setApiError(null);
  };

  const completeTypewriter = (msgId: string) => {
    if (currentlyTypewritingId === msgId) {
      setIsTypewriting(false);
      setCurrentlyTypewritingId(null);
    }
  };

  const updateTelemetry = (fields: Partial<TelemetryState>) => {
    setTelemetry(prev => ({ ...prev, ...fields }));
  };

  return (
    <ChatContext.Provider value={{
      isWidgetMode,
      isWidgetOpen,
      chats,
      currentChatId,
      messages,
      isLoading,
      isTypewriting,
      currentlyTypewritingId,
      user,
      authModalOpen,
      authModalTab,
      apiError,
      telemetry,
      guestId,
      isSidebarOpen,
      toggleMode,
      setWidgetOpen,
      startNewChat,
      selectChat,
      deleteChat,
      sendMessage,
      setAuthModalOpen,
      setAuthModalTab,
      logout,
      clearApiError,
      completeTypewriter,
      updateTelemetry,
      setSidebarOpen
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
