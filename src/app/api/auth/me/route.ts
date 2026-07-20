export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      name: string;
      email: string;
      role: 'user' | 'admin';
    };

    await dbConnect();

    const dbUser = await User.findById(decoded.id)
      .select('subscription')
      .lean();

    return NextResponse.json({
      user: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role,
        subscription: dbUser?.subscription ?? { status: 'none' },
      },
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}