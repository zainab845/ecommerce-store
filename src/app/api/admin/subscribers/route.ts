import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * @swagger
 * /api/admin/subscribers:
 *   get:
 *     tags: [Admin - Subscribers]
 *     summary: Get all active Premium subscribers
 *     description: Returns users with `subscription.status = active` along with stats (total count and monthly revenue).
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Subscribers list and stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscribers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       subscription:
 *                         type: object
 *                 stats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     monthlyRevenue:
 *                       type: number
 */

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const subscribers = await User.find({
      'subscription.status': 'active',
    })
      .select('name email subscription createdAt')
      .sort({ 'subscription.currentPeriodEnd': 1 })
      .lean();

    const stats = {
      total: subscribers.length,
      monthlyRevenue: subscribers.length * 9.99,
    };

    return NextResponse.json({ subscribers, stats });
  } catch (error) {
    console.error('Admin subscribers error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}