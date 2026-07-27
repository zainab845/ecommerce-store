'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group messages by date for date separators
function groupMessagesByDate(messages: ReturnType<typeof useChat>['messages']) {
  const groups: { date: string; messages: typeof messages }[] = [];
  let currentDate = '';

  messages.forEach(msg => {
    const date = formatDate(msg.createdAt);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });

  return groups;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    connected,
    adminTyping,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    unreadFromAdmin,
    markRead,
  } = useChat();

  // Scroll to bottom when new messages arrive or chat opens
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, adminTyping]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (open && unreadFromAdmin > 0) {
      markRead();
    }
  }, [open, unreadFromAdmin, markRead]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.trim() && !isTyping) {
      setIsTyping(true);
      sendTypingStart();
    } else if (!val.trim() && isTyping) {
      setIsTyping(false);
      sendTypingStop();
    } else if (val.trim()) {
      sendTypingStart(); // refresh the 3-second auto-stop timer
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render for admins or unauthenticated users
  if (!user || user.role === 'admin') return null;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <>
      {/* ── Chat window ─────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-96 max-h-[600px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-indigo-600">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                {/* Online indicator */}
                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-indigo-600 ${
                  connected ? 'bg-green-400' : 'bg-gray-400'
                }`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">E-Shop Support</p>
                <p className="text-xs text-indigo-200">
                  {connected ? 'Online' : 'Connecting...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-indigo-200 hover:text-white transition-colors rounded-lg hover:bg-indigo-500"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50 min-h-0 max-h-[420px]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">How can we help?</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                  Send a message and our team will get back to you shortly.
                </p>
              </div>
            ) : (
              <>
                {messageGroups.map((group, groupIdx) => (
                  <div key={groupIdx}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium px-2">{group.date}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {group.messages.map((msg, msgIdx) => {
                      const isUser = msg.senderId === user.id;
                      const isAi = msg.senderRole === 'ai';
                      const showName =
                        !isUser &&
                        (msgIdx === 0 ||
                          group.messages[msgIdx - 1]?.senderRole !== msg.senderRole);

                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} mb-1`}
                        >
                          {/* Sender name for admin/AI messages */}
                          {!isUser && showName && (
                            <span className="text-xs text-gray-400 mb-1 ml-1">
                              {isAi ? '🤖 AI Assistant' : '👤 Support Team'}
                            </span>
                          )}

                          <div className={`flex items-end gap-1.5 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                              className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                isUser
                                  ? 'bg-indigo-600 text-white rounded-br-sm'
                                  : isAi
                                  ? 'bg-purple-100 text-purple-900 rounded-bl-sm border border-purple-200'
                                  : 'bg-white text-gray-900 rounded-bl-sm border border-gray-100 shadow-sm'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>

                          {/* Timestamp */}
                          <span className={`text-[10px] text-gray-400 mt-0.5 ${isUser ? 'mr-1' : 'ml-1'}`}>
                            {formatTime(msg.createdAt)}
                            {isUser && (
                              <span className="ml-1">
                                {msg.read ? (
                                  // Double tick — read
                                  <span className="text-indigo-400">✓✓</span>
                                ) : (
                                  // Single tick — sent
                                  <span>✓</span>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Typing indicator */}
                {adminTyping && (
                  <div className="flex items-start gap-2 mb-1">
                    <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 self-end mb-0.5">Support is typing...</span>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={connected ? 'Type a message...' : 'Connecting...'}
                disabled={!connected}
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-indigo-200 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !connected}
                className="flex-shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Send message"
              >
                <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-center text-[10px] text-gray-300 mt-2">
              Typically replies within a few minutes
            </p>
          </div>
        </div>
      )}

      {/* ── Floating chat button ─────────────────────────────────── */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="fixed bottom-5 right-4 sm:right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center"
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {/* Unread badge */}
        {!open && unreadFromAdmin > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadFromAdmin > 9 ? '9+' : unreadFromAdmin}
          </span>
        )}

        {/* Toggle icon */}
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </>
  );
}