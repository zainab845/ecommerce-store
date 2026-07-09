'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  items: CartItem[];
  totalItems: number;     // total quantity — used in cart page display
  uniqueItems: number;    // unique product count — used in navbar badge
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { items: state.items.filter(i => i.id !== action.payload) };
    case 'UPDATE_QUANTITY':
      return {
        items: state.items.map(i =>
          i.id === action.payload.id
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      };
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const parsed = JSON.parse(saved) as CartItem[];
      parsed.forEach(item => dispatch({ type: 'ADD_ITEM', payload: item }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const uniqueItems = state.items.length; // unique product count for badge
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems,
      uniqueItems,
      totalPrice,
      addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
      removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
      updateQuantity: (id, quantity) =>
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } }),
      clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}