import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { registerUser } from '@/lib/controllers/authController';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const newUser = await registerUser(body);

    return NextResponse.json({ message: 'User created successfully', user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}