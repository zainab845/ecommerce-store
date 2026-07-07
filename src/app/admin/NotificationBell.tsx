'use client';

import { useState, useEffect } from 'react';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.notifications.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-3 hover:bg-gray-100 rounded-xl transition-colors text-2xl"
        aria-label="Notifications"
      >
        🛎️
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-96 overflow-auto">
          <div className="p-4 border-b sticky top-0 bg-white">
            <h3 className="font-semibold">Notifications</h3>
          </div>
          
          {notifications.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No notifications yet</p>
          ) : (
            notifications.map((notif: any) => (
              <div 
                key={notif._id}
                onClick={() => markAsRead(notif._id)}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-indigo-50' : ''}`}
              >
                <p className="font-medium text-sm">{notif.title}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notif.createdAt).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
      {/* Test Button */}
<div className="p-4 border-t bg-gray-50 sticky bottom-0">
  <button 
    onClick={async () => {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_order',
          title: 'Test Notification',
          message: 'This is a test notification from admin panel'
        })
      });
      window.location.reload();
    }}
    className="w-full text-xs py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium"
  >
    + Create Test Notification
  </button>
</div>
    </div>
  );
}