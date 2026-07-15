'use client';

import { createContext, useContext, useState, useEffect } from 'react';
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

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = res.ok ? await res.json() : null;
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  // Convenience derived value
  const isPremium = user?.subscription?.status === 'active';

  return (
    <AuthContext.Provider value={{ user, loading, isPremium, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}