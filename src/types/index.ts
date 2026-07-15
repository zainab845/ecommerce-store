export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: Category | string;
  stock: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  createdAt: string;
  isPremiumOnly: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}