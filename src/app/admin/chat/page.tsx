'use client';

import { useState, useRef, useEffect } from 'react';
import { useAdminChat, Conversation, ChatMessage } from '@/hooks/useAdminChat';

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = [];
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

// ── Conversation list item ────────────────────────────────────────────
function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-start gap-3 transition-colors border-b border-gray-100 last:border-0 ${
        isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        isActive ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-200 text-gray-700'
      }`}>
        {conv.userName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-900' : 'text-gray-900'}`}>
            {conv.userName}
          </p>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {formatRelativeTime(conv.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">{conv.userEmail}</p>
        <p className={`text-xs mt-0.5 truncate ${conv.unreadByAdmin > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
          {conv.lastMessage || 'No messages yet'}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {conv.unreadByAdmin > 0 && (
          <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {conv.unreadByAdmin > 9 ? '9+' : conv.unreadByAdmin}
          </span>
        )}
        {conv.status === 'closed' && (
          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
            Closed
          </span>
        )}
        {conv.userTyping && (
          <span className="text-[10px] text-green-600 font-medium">typing...</span>
        )}
      </div>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function AdminChatPage() {
  const {
    conversations,
    activeConversation,
    messages,
    connected,
    userTyping,
    openConversation,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    closeConversation,
    reopenConversation,
    totalUnread,
  } = useAdminChat();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, userTyping]);

  // Focus input when conversation changes
  useEffect(() => {
    if (activeConversation) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeConversation]);

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
      sendTypingStart();
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    if (!activeConversation) return;
    if (!window.confirm('Close this conversation? The user will see a closed message.')) return;
    closeConversation(activeConversation._id);
  };

  const filteredConversations = conversations.filter(c =>
    c.userName.toLowerCase().includes(search.toLowerCase()) ||
    c.userEmail.toLowerCase().includes(search.toLowerCase())
  );

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 border-r border-gray-100 flex-shrink-0`}>
        {/* Sidebar header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900">Support Inbox</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                {totalUnread > 0 && (
                  <span className="ml-1 text-indigo-600 font-medium">
                    · {totalUnread} unread
                  </span>
                )}
              </p>
            </div>
            {/* Connection status dot */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-400">{connected ? 'Live' : 'Offline'}</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-gray-100 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-400 font-medium">
                {search ? 'No conversations match your search' : 'No conversations yet'}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {!search && 'Customer messages will appear here'}
              </p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <ConversationItem
                key={conv._id}
                conv={conv}
                isActive={activeConversation?._id === conv._id}
                onClick={() => {
                  openConversation(conv);
                  setSidebarOpen(false); // on mobile, hide sidebar when conv opens
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Chat area ─────────────────────────────────────────────── */}
      <div className={`${!sidebarOpen ? 'flex' : 'hidden'} md:flex flex-col flex-1 min-w-0`}>
        {activeConversation ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                {/* Mobile back button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-700">
                  {activeConversation.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {activeConversation.userName}
                  </p>
                  <p className="text-xs text-gray-400">{activeConversation.userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeConversation.status === 'open' ? (
                  <>
                    <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Open
                    </span>
                    <button
                      onClick={handleClose}
                      className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                      Closed
                    </span>
                    <button
                      onClick={() => reopenConversation(activeConversation._id)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      Reopen
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* AI responded — prompt admin to take over */}
{messages.length > 0 &&
  messages[messages.length - 1]?.senderRole === 'ai' && (
  <div className="mx-5 mb-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <span className="text-sm">🤖</span>
      <p className="text-xs text-amber-700 font-medium">
        AI assistant responded. Reply to take over the conversation.
      </p>
    </div>
  </div>
)}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50 space-y-1">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">Loading messages...</p>
                </div>
              ) : (
                messageGroups.map((group, gIdx) => (
                  <div key={gIdx}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-100 rounded-full">
                        {group.date}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {group.messages.map((msg, mIdx) => {
                      const isAdmin = msg.senderRole === 'admin';
                      const isAi = msg.senderRole === 'ai';
                      const isFromAdmin = isAdmin || isAi;
                      const showLabel =
                        mIdx === 0 ||
                        group.messages[mIdx - 1]?.senderRole !== msg.senderRole;

                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col mb-2 ${isFromAdmin ? 'items-end' : 'items-start'}`}
                        >
                          {showLabel && (
                            <span className={`text-[11px] font-medium mb-1 ${
                              isFromAdmin ? 'text-indigo-500 mr-1' : 'text-gray-400 ml-1'
                            }`}>
                              {isAi ? '🤖 AI Assistant' : isAdmin ? '👤 You (Admin)' : msg.senderName}
                            </span>
                          )}

                          <div className={`flex items-end gap-1.5 max-w-[75%] ${isFromAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isAdmin
                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                : isAi
                                ? 'bg-purple-100 text-purple-900 rounded-br-sm border border-purple-200'
                                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                            }`}>
                              {msg.content}
                            </div>
                          </div>

                          <span className={`text-[10px] text-gray-400 mt-0.5 ${isFromAdmin ? 'mr-1' : 'ml-1'}`}>
                            {formatTime(msg.createdAt)}
                            {isFromAdmin && !isAi && (
                              <span className="ml-1">
                                {msg.read ? (
                                  <span className="text-indigo-400">✓✓</span>
                                ) : (
                                  <span>✓</span>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* User typing indicator */}
              {userTyping && (
                <div className="flex items-start gap-2">
                  <div className="bg-white border border-gray-200 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 self-end mb-0.5">
                    {activeConversation.userName} is typing...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white border-t border-gray-100">
              {activeConversation.status === 'closed' ? (
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">This conversation is closed.</p>
                  <button
                    onClick={() => reopenConversation(activeConversation._id)}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Reopen Conversation
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={connected ? `Reply to ${activeConversation.userName}...` : 'Connecting...'}
                    disabled={!connected}
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-indigo-200 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || !connected}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">Select a conversation</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Choose a conversation from the left to start replying to customers in real time.
            </p>
            <div className={`mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              connected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-gray-300'}`} />
              {connected ? 'Connected — messages arrive in real time' : 'Connecting to chat server...'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}