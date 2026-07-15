import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!process.env.FIREBASE_PROJECT_ID || 
        !process.env.FIREBASE_CLIENT_EMAIL || 
        !privateKey) {
      throw new Error('Missing Firebase credentials in environment variables');
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

export const adminDb = getDatabase();
export const adminAuth = getAuth();

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
    console.error('Failed to push Firebase notification:', error);
  }
}