
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

type AuthState = {
  session: any | null;
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading
  setSession: (session) => {
    console.log('Auth store setSession called with:', session);
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isLoading: false,
    });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isAuthenticated: false });
  },
  initialize: async () => {
    console.log('Auth store initialize called');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Initialize got session:', session);

    if (session) {
      set({
        session,
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      // Mock session for development: Dev Team
      console.log('No real session found, injecting mock Dev Team session');
      const mockSession = {
        user: {
          id: '0',
          email: 'devteam@postr.com',
          user_metadata: {
            username: 'devteam',
            name: 'Dev Team'
          }
        },
        access_token: 'mock-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };
      set({
        session: mockSession,
        user: mockSession.user,
        isAuthenticated: true,
        isLoading: false,
      });
    }
  },
}));

console.log('Setting up onAuthStateChange listener');
supabase.auth.onAuthStateChange((_event: any, session: any) => {
  console.log('onAuthStateChange triggered:', { _event, session });
  useAuthStore.getState().setSession(session);
});
