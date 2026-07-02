import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { authenticateUser } from '@/lib/controllers/authController';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { token, role } = await authenticateUser(body);

    
    const cookieStore: any = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return NextResponse.json({ message: 'Login successful', token, role }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 401 });
  }
}