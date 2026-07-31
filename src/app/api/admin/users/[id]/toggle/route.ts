import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    const { id } = await params;

    // Prevent admin from disabling themselves
    if (id === payload.id) {
      return NextResponse.json(
        { error: 'You cannot disable your own account' },
        { status: 400 }
      );
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent disabling other admins
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot disable admin accounts' },
        { status: 400 }
      );
    }

    user.isActive = !user.isActive;
    await user.save();

    return NextResponse.json({
      message: `User ${user.isActive ? 'enabled' : 'disabled'} successfully`,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('Toggle user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}