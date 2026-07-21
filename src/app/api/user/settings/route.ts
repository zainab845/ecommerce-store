import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import jwt from 'jsonwebtoken'; // <-- Added to sign the new cookie
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic'; // <-- Bypasses Vercel caching

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// GET — return current user's editable profile data
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    await dbConnect();

    const user = await User.findById(payload.id)
      .select('name email authProvider googleId subscription createdAt')
      .lean() as any;

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH — update name and/or email
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);

    let body: { name?: string; email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email } = body;

    if (!name?.trim() && !email?.trim()) {
      return NextResponse.json(
        { error: 'Provide at least one field to update' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check email uniqueness if changing
    if (email) {
      const existing = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: payload.id },
      }).lean();
      if (existing) {
        return NextResponse.json(
          { error: 'This email is already in use' },
          { status: 400 }
        );
      }
    }

    const update: Record<string, string> = {};
    if (name?.trim()) update.name = name.trim();
    if (email?.trim()) update.email = email.toLowerCase().trim();

    const updated = await User.findByIdAndUpdate(payload.id, update, { new: true })
      .select('name email authProvider role') // <-- Ensure role is fetched
      .lean() as any;

    // 🚨 THE FIX: Create a fresh token with the new name/email
    const newToken = jwt.sign(
      { 
        id: updated._id, 
        name: updated.name, 
        email: updated.email, 
        role: updated.role || payload.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ user: updated });
    
    // Set the new cookie so the frontend sees the changes instantly
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}