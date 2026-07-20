import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
  }
}

export const adminDb = getDatabase();

// Admin-side notifications (shown in admin NotificationBell)
export async function pushNotification(notification: {
  type: 'new_order' | 'contact_form';
  title: string;
  message: string;
  orderId?: string;
}) {
  try {
    const ref = adminDb.ref('notifications').push();
    await ref.set({
      ...notification,
      read: false,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to push admin notification:', error);
  }
}

// User-specific notifications (shown in user's NotificationBell)
export async function pushUserNotification(
  userId: string,
  notification: {
    type: 'order_accepted' | 'order_refunded' | 'order_updated';
    title: string;
    message: string;
    orderId?: string;
  }
) {
  try {
    const ref = adminDb.ref(`user-notifications/${userId}`).push();
    await ref.set({
      ...notification,
      read: false,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error('Failed to push user notification:', error);
  }
}