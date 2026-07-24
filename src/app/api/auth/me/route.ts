export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     description: Returns the logged-in user's profile including live subscription status fetched from the database.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Currently authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */

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