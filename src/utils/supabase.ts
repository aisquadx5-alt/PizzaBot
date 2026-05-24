import { createClient } from '@supabase/supabase-js';

// Environment variables check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if we are using placeholder or empty keys
const isPlaceholder = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('placeholder-project') || 
  supabaseUrl.includes('mock.supabase.co');

// Type declarations for our database entities
export interface UserProfile {
  id: string;
  email: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string | null;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  metrics?: {
    hydration?: number; // e.g. 72
    temperature?: number; // e.g. 450
    crust?: string; // e.g. "Thin-Crust"
    crispIndex?: string; // e.g. "HIGH"
  };
  created_at: string;
}

// ----------------------------------------------------
// Mock Supabase Client for local simulation
// ----------------------------------------------------
class MockSupabaseClient {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setStorageItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  private getProfiles(): UserProfile[] {
    return this.getStorageItem<UserProfile[]>('pizza_profiles', []);
  }

  private getChats(): ChatSession[] {
    return this.getStorageItem<ChatSession[]>('pizza_chats', []);
  }

  private getMessages(): ChatMessage[] {
    return this.getStorageItem<ChatMessage[]>('pizza_messages', []);
  }

  // --- Auth Simulation ---
  auth = {
    getUser: async () => {
      if (typeof window === 'undefined') return { data: { user: null }, error: null };
      const session = this.getStorageItem<any>('pizza_session', null);
      return { data: { user: session ? { id: session.id, email: session.email } : null }, error: null };
    },

    signUp: async ({ email, password }: any) => {
      const profiles = this.getProfiles();
      const existing = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return { data: { user: null }, error: new Error('User already exists') };
      }

      const newId = Math.random().toString(36).substring(2, 15);
      const newProfile: UserProfile = {
        id: newId,
        email: email,
        updated_at: new Date().toISOString(),
      };

      profiles.push(newProfile);
      this.setStorageItem('pizza_profiles', profiles);

      // Save credentials for sign-in lookup in mock mode
      const credentials = this.getStorageItem<any[]>('pizza_credentials', []);
      credentials.push({ email, password, id: newId });
      this.setStorageItem('pizza_credentials', credentials);

      const session = { id: newId, email };
      this.setStorageItem('pizza_session', session);

      this.triggerAuthChange('SIGNED_IN', session);

      return { data: { user: session }, error: null };
    },

    signInWithPassword: async ({ email, password }: any) => {
      const credentials = this.getStorageItem<any[]>('pizza_credentials', []);
      const matched = credentials.find(
        (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
      );

      if (!matched) {
        return { data: { user: null }, error: new Error('Invalid login credentials') };
      }

      const session = { id: matched.id, email: matched.email };
      this.setStorageItem('pizza_session', session);

      this.triggerAuthChange('SIGNED_IN', session);

      return { data: { user: session }, error: null };
    },

    signOut: async () => {
      this.setStorageItem('pizza_session', null);
      this.triggerAuthChange('SIGNED_OUT', null);
      return { error: null };
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      if (typeof window === 'undefined') return { data: { subscription: { unsubscribe: () => {} } } };
      
      const listener = (e: CustomEvent) => {
        callback(e.detail.event, e.detail.session);
      };
      
      window.addEventListener('mock-auth-change' as any, listener);

      // Instantly trigger initial check
      const currentSession = this.getStorageItem<any>('pizza_session', null);
      setTimeout(() => {
        callback(currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', currentSession ? { user: currentSession } : null);
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              window.removeEventListener('mock-auth-change' as any, listener);
            },
          },
        },
      };
    },
  };

  private triggerAuthChange(event: string, user: any) {
    if (typeof window === 'undefined') return;
    const customEvent = new CustomEvent('mock-auth-change', {
      detail: { event, session: user ? { user } : null },
    });
    window.dispatchEvent(customEvent);
  }

  // --- Database Simulation ---
  from(table: string) {
    const self = this;
    return {
      select: (columns: string = '*') => {
        return {
          eq: (field: string, value: any) => {
            return {
              order: (orderField: string, { ascending = true } = {}) => {
                let data: any[] = [];
                if (table === 'chats') {
                  data = self.getChats().filter((c: any) => c[field] === value);
                } else if (table === 'messages') {
                  data = self.getMessages().filter((m: any) => m[field] === value);
                }

                data.sort((a, b) => {
                  const timeA = new Date(a[orderField]).getTime();
                  const timeB = new Date(b[orderField]).getTime();
                  return ascending ? timeA - timeB : timeB - timeA;
                });

                return Promise.resolve({ data, error: null });
              },
              then: (resolve: any) => {
                let data: any[] = [];
                if (table === 'chats') {
                  data = self.getChats().filter((c: any) => c[field] === value);
                } else if (table === 'messages') {
                  data = self.getMessages().filter((m: any) => m[field] === value);
                }
                resolve({ data, error: null });
              }
            };
          },
          order: (orderField: string, { ascending = true } = {}) => {
            let data: any[] = [];
            if (table === 'chats') {
              data = self.getChats();
            } else if (table === 'messages') {
              data = self.getMessages();
            }

            data.sort((a, b) => {
              const timeA = new Date(a[orderField]).getTime();
              const timeB = new Date(b[orderField]).getTime();
              return ascending ? timeA - timeB : timeB - timeA;
            });

            return Promise.resolve({ data, error: null });
          },
          then: (resolve: any) => {
            let data: any[] = [];
            if (table === 'chats') {
              data = self.getChats();
            } else if (table === 'messages') {
              data = self.getMessages();
            }
            resolve({ data, error: null });
          }
        };
      },

      insert: (payload: any) => {
        let insertedData = Array.isArray(payload) ? payload : [payload];
        
        if (table === 'chats') {
          const chats = self.getChats();
          const newChats = insertedData.map(c => ({
            id: c.id || Math.random().toString(36).substring(2, 15),
            user_id: c.user_id || null,
            title: c.title || 'New Chat Session',
            created_at: c.created_at || new Date().toISOString()
          }));
          
          self.setStorageItem('pizza_chats', [...chats, ...newChats]);
          return Promise.resolve({ data: newChats, error: null });
        } else if (table === 'messages') {
          const messages = self.getMessages();
          const newMessages = insertedData.map(m => ({
            id: m.id || Math.random().toString(36).substring(2, 15),
            chat_id: m.chat_id,
            role: m.role,
            content: m.content,
            metrics: m.metrics || null,
            created_at: m.created_at || new Date().toISOString()
          }));

          self.setStorageItem('pizza_messages', [...messages, ...newMessages]);
          return Promise.resolve({ data: newMessages, error: null });
        }

        return Promise.resolve({ data: null, error: new Error('Unknown table') });
      },

      delete: () => {
        return {
          eq: (field: string, value: any) => {
            if (table === 'chats') {
              const chats = self.getChats().filter((c: any) => c[field] !== value);
              const messages = self.getMessages().filter((m: any) => {
                // Cascading delete messages of this chat
                if (field === 'id') return m.chat_id !== value;
                return true;
              });
              self.setStorageItem('pizza_chats', chats);
              self.setStorageItem('pizza_messages', messages);
            } else if (table === 'messages') {
              const messages = self.getMessages().filter((m: any) => m[field] !== value);
              self.setStorageItem('pizza_messages', messages);
            }
            return Promise.resolve({ error: null });
          }
        };
      },

      update: (fields: any) => {
        return {
          eq: (field: string, value: any) => {
            if (table === 'chats') {
              const chats = self.getChats().map((c: any) => {
                if (c[field] === value) return { ...c, ...fields };
                return c;
              });
              self.setStorageItem('pizza_chats', chats);
            }
            return Promise.resolve({ error: null });
          }
        };
      }
    };
  }
}

// Export initialization details
export const isMockMode = isPlaceholder;

let supabaseInstance: any;

if (isPlaceholder) {
  supabaseInstance = new MockSupabaseClient();
} else {
  try {
    // Wrap createClient in try/catch to handle malformed or empty env URLs gracefully
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to initialize live Supabase client. Activating mock fallback:', err);
    supabaseInstance = new MockSupabaseClient();
  }
}

export const supabase = supabaseInstance;
