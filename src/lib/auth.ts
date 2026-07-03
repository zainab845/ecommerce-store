import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<JWTPayload | null> {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}