'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

type Tab = 'profile' | 'security' | 'account';

export default function SettingsPage() {
  const { user, setUser, logout, refreshUser, isPremium } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [fullUser, setFullUser] = useState<any>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    fetch('/api/user/settings')
      .then(r => r.json())
      .then(d => { if (d.user) setFullUser(d.user); })
      .catch(() => {});
  }, [user]);

  const isGoogleOnly = fullUser?.authProvider === 'google';

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to load portal');
      }
    } catch (error) {
      alert('Something went wrong.');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }), // Only send name
      });
      const data = await res.json();
      if (res.ok) {
        setProfileMessage({ text: 'Profile updated successfully!', ok: true });
        await refreshUser();
      } else {
        setProfileMessage({ text: data.error || 'Update failed', ok: false });
      }
    } catch {
      setProfileMessage({ text: 'Something went wrong', ok: false });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'Passwords do not match', ok: false });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ text: 'Password must be at least 8 characters', ok: false });
      return;
    }
    setPasswordLoading(true);
    try {
      const body: Record<string, string> = { newPassword };
      if (!isGoogleOnly) body.currentPassword = currentPassword;
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage({ text: 'Password updated successfully!', ok: true });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await refreshUser();
      } else {
        setPasswordMessage({ text: data.error || 'Update failed', ok: false });
      }
    } catch {
      setPasswordMessage({ text: 'Something went wrong', ok: false });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      const body: Record<string, string> = isGoogleOnly
        ? { confirmation: deleteConfirm }
        : { password: deletePassword };
      const res = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(null);
        router.push('/');
      } else {
        setDeleteError(data.error || 'Deletion failed');
      }
    } catch {
      setDeleteError('Something went wrong');
    } finally {
      setDeleteLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-colors';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'account', label: 'Account' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-6">
          {isPremium && (
            <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">Premium Member</p>
                <button 
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="text-xs text-indigo-600 hover:underline font-medium text-left"
                >
                  {portalLoading ? 'Opening Portal...' : 'Manage subscription →'}
                </button>
              </div>
            </div>
          )}

          {fullUser && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Connected Accounts</h2>

              <div className="flex items-center justify-between py-3 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email & Password</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  fullUser.authProvider === 'email' || fullUser.authProvider === 'both'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {fullUser.authProvider === 'email' || fullUser.authProvider === 'both'
                    ? 'Connected' : 'Not connected'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Google</p>
                    <p className="text-xs text-gray-400">Sign in with your Google account</p>
                  </div>
                </div>
                {fullUser.authProvider === 'google' || fullUser.authProvider === 'both' ? (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
                    Connected
                  </span>
                ) : (
                  <a href="/api/auth/google?from=/settings" className="text-xs font-medium px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    Connect
                  </a>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className={inputClass} placeholder="Your full name" />
            </div>
            
            {/* The Email Field is now fully disabled and styled differently */}
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" value={email} disabled
                className={`${inputClass} bg-gray-50 opacity-70 cursor-not-allowed`} placeholder="your@email.com" />
              <p className="text-xs text-gray-400 mt-1">Email addresses cannot be changed.</p>
            </div>

            {profileMessage && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
                profileMessage.ok
                  ? 'bg-green-50 border border-green-100 text-green-700'
                  : 'bg-red-50 border border-red-100 text-red-700'
              }`}>
                {profileMessage.text}
              </div>
            )}
            <button type="submit" disabled={profileLoading}
              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handlePasswordChange}
          className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
            {isGoogleOnly && (
              <p className="text-xs text-gray-500 mt-1">
                You signed in with Google. Set a password to also enable email login.
              </p>
            )}
          </div>

          {!isGoogleOnly && (
            <div>
              <label className={labelClass}>Current Password</label>
              <input type="password" value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className={inputClass} placeholder="Enter current password" />
            </div>
          )}

          <div>
            <label className={labelClass}>New Password</label>
            <input type="password" value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={inputClass} placeholder="Min. 8 characters" />
          </div>

          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input type="password" value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={inputClass} placeholder="Repeat new password" />
          </div>

          {passwordMessage && (
            <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
              passwordMessage.ok
                ? 'bg-green-50 border border-green-100 text-green-700'
                : 'bg-red-50 border border-red-100 text-red-700'
            }`}>
              {passwordMessage.text}
            </div>
          )}

          <button type="submit" disabled={passwordLoading}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
            {passwordLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Account Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Plan</span>
                <span className={`font-medium ${isPremium ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {isPremium ? 'Premium' : 'Free'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-red-800 mb-1">Danger Zone</h2>
            <p className="text-xs text-red-600 mb-4">
              Deleting your account is permanent and cannot be undone.
              {isPremium && ' Your active Premium subscription will also be cancelled.'}
            </p>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
              >
                Delete My Account
              </button>
            ) : (
              <div className="space-y-3">
                {isGoogleOnly ? (
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Type <strong>delete my account</strong> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={e => setDeleteConfirm(e.target.value)}
                      placeholder="delete my account"
                      className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-red-400 bg-white"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-red-700 mb-1">
                      Enter your password to confirm
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={e => setDeletePassword(e.target.value)}
                      placeholder="Your current password"
                      className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-red-400 bg-white"
                    />
                  </div>
                )}

                {deleteError && (
                  <p className="text-xs text-red-700 font-medium">{deleteError}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={
                      deleteLoading ||
                      (isGoogleOnly
                        ? deleteConfirm.toLowerCase() !== 'delete my account'
                        : !deletePassword)
                    }
                    className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleteLoading ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirm('');
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                    className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}