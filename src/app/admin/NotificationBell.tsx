'use client';

import { useEffect, useRef, useState } from 'react';
import { clientDb } from '@/lib/firebase-client';
import {
  ref,
  onValue,
  off,
  query,
  orderByChild,
  limitToLast,
  update,
} from 'firebase/database';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'new_order' | 'contact_form';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: number;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const notifQuery = query(
      ref(clientDb, 'notifications'),
      orderByChild('createdAt'),
      limitToLast(20)
    );

    // onValue fires immediately with current data AND again whenever data changes
    const unsubscribe = onValue(notifQuery, snapshot => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]) => ({ id, ...(val as Omit<Notification, 'id'>) }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(list);
      } else {
        setNotifications([]);
      }
    });

    return () => off(notifQuery);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    const updates: Record<string, boolean> = {};
    unread.forEach(n => { updates[`notifications/${n.id}/read`] = true; });
    try { await update(ref(clientDb), updates); } catch {}
  };

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) setTimeout(markAllRead, 800);
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleOpen}
        className="relative p-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Notifications">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-300 text-xs mt-1">
                  New orders and messages appear here in real-time
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${
                    !notif.read ? 'bg-indigo-50/40' : ''
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notif.type === 'new_order' ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      {notif.type === 'new_order' ? (
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{notif.title}</p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-300 mt-1">{timeAgo(notif.createdAt)}</p>
                      {notif.type === 'new_order' && (
                        <Link href="/admin/orders" onClick={() => setOpen(false)}
                          className="inline-block mt-1 text-xs text-indigo-600 hover:underline font-medium">
                          View order →
                        </Link>
                      )}
                      {notif.type === 'contact_form' && (
                        <Link href="/admin/contact" onClick={() => setOpen(false)}
                          className="inline-block mt-1 text-xs text-indigo-600 hover:underline font-medium">
                          View message →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}