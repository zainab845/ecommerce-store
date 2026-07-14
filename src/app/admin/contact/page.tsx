'use client';

import { useState, useEffect } from 'react';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  replied: boolean;
  repliedAt?: string;
  createdAt: string;
}

interface ReplyModal {
  open: boolean;
  contactId: string;
  toName: string;
  toEmail: string;
  originalSubject?: string;
  replySubject: string;
  replyBody: string;
}

const closedModal: ReplyModal = {
  open: false, contactId: '', toName: '', toEmail: '',
  replySubject: '', replyBody: '',
};

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ReplyModal>(closedModal);
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contact');
      const data = await res.json();
      setMessages(data.contacts ?? []);
    } catch {
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openReplyModal = (msg: ContactMessage) => {
    setReplyError('');
    setModal({
      open: true,
      contactId: msg._id,
      toName: msg.name,
      toEmail: msg.email,
      originalSubject: msg.subject,
      replySubject: `Re: ${msg.subject || 'Your message'}`,
      replyBody: '',
    });
  };

  const handleSendReply = async () => {
    if (!modal.replySubject.trim() || !modal.replyBody.trim()) {
      setReplyError('Both subject and reply message are required.');
      return;
    }
    setReplyError('');
    setSending(true);
    try {
      const res = await fetch(`/api/admin/contact/${modal.contactId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replySubject: modal.replySubject,
          replyBody: modal.replyBody,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Reply sent successfully', 'success');
        setModal(closedModal);
        loadMessages();
      } else {
        setReplyError(data.error || 'Failed to send reply');
      }
    } catch {
      setReplyError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'} received
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Messages list */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No messages yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {messages.map(msg => (
              <div key={msg._id} className="p-5 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{msg.name}</p>
                      {msg.replied && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Replied
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{msg.email}</p>
                    {msg.subject && (
                      <p className="text-xs text-indigo-600 font-medium mt-1">{msg.subject}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <button
                      onClick={() => openReplyModal(msg)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Reply
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-gray-700 text-sm leading-relaxed">{msg.message}</p>
                {msg.replied && msg.repliedAt && (
                  <p className="mt-2 text-xs text-green-600">
                    Replied on {new Date(msg.repliedAt).toLocaleDateString('en-US', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Reply to {modal.toName}</h2>
                <p className="text-sm text-gray-500">{modal.toEmail}</p>
              </div>
              <button onClick={() => setModal(closedModal)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                <input type="text" value={modal.replySubject}
                  onChange={e => setModal(prev => ({ ...prev, replySubject: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-indigo-400 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea rows={6} value={modal.replyBody}
                  onChange={e => setModal(prev => ({ ...prev, replyBody: e.target.value }))}
                  placeholder="Type your reply here..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-colors resize-none" />
              </div>

              {replyError && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {replyError}
                </p>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setModal(closedModal)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSendReply} disabled={sending}
                className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {sending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </>
                ) : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}