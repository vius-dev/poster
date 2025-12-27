
import { api } from '@/lib/api';
import { useAuthStore } from '@/state/auth';
import { User } from '@/types/user';
import React, { createContext, useContext, useEffect, useState } from 'react';


interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (session) {
        setLoading(true);
        try {
          const userId = session.user.id;

          // Auto-provision profile if needed (Simulate Supabase Trigger)
          await api.ensureProfileExists(session.user);

          // Determine if we should map to the Dev Team user
          // For now, we'll map a specific dev email or just the '0' ID fallback
          const isDevEmail = session.user.email?.toLowerCase().includes('devteam') ||
            session.user.email?.toLowerCase().includes('handi');

          const effectiveId = isDevEmail ? '0' : userId;

          // Sync with API
          api.setSessionUser(effectiveId);

          // Attempt to fetch user
          let res = await api.fetchUser(effectiveId);

          setUser(res || null);
        } catch (error) {
          console.error('[AuthProvider] Failed to hydrate user:', error);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    };

    fetchUser();
  }, [session]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
