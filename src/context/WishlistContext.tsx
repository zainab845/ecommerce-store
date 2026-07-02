'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface WishlistContextType {
  items: string[];
  totalItems: number;
  toggleItem: (id: string) => void;
  isWishlisted: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('wishlist');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const isWishlisted = (id: string) => items.includes(id);

  return (
    <WishlistContext.Provider value={{
      items,
      totalItems: items.length,
      toggleItem,
      isWishlisted,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}