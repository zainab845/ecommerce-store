'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';

export interface UserSubscription {
  status: 'none' | 'active' | 'cancelled' | 'past_due';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  subscription: UserSubscription;
  authProvider?: 'email' | 'google' | 'both';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // useCallback so refreshUser has a stable reference — safe to include in useEffect deps
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = res.ok ? await res.json() : null;
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []); // no deps — fetchUser never changes

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]); // stable because fetchUser is stable

  const isPremium = user?.subscription?.status === 'active';

  return (
    <AuthContext.Provider
      value={{ user, loading, isPremium, setUser, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}