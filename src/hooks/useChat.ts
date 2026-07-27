'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin' | 'ai';
  content: string;
  read: boolean;
  createdAt: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  conversationId: string | null;
  connected: boolean;
  adminTyping: boolean;
  sendMessage: (content: string) => void;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  loadHistory: () => void;
  unreadFromAdmin: number;
  markRead: () => void;
}

const CHAT_SERVER = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';

export function useChat(): UseChatReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [adminTyping, setAdminTyping] = useState(false);
  const [unreadFromAdmin, setUnreadFromAdmin] = useState(0);
  const conversationIdRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(async () => {
    if (socketRef.current?.connected) return;

    try {
      // Get the JWT token from our secure endpoint
      const res = await fetch('/api/chat/token');
      if (!res.ok) return;
      const { token } = await res.json();

      const socket = io(CHAT_SERVER, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        setConnected(true);
        console.log('Chat connected');
      });

      socket.on('disconnect', () => {
        setConnected(false);
        console.log('Chat disconnected');
      });

      socket.on('connect_error', (err) => {
        console.error('Chat connection error:', err.message);
        setConnected(false);
      });

      // Server tells us our conversation ID after connecting
      socket.on('conversation_ready', ({ conversationId: convId }: { conversationId: string }) => {
        setConversationId(convId);
        conversationIdRef.current = convId;
        // Load message history as soon as we know our conversation
        socket.emit('load_history', { conversationId: convId });
      });

      // A new message arrived
      socket.on('new_message', (message: ChatMessage) => {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });

        if (message.senderRole === 'admin' || message.senderRole === 'ai') {
          setUnreadFromAdmin(prev => prev + 1);
        }

        // Stop typing indicator when a message arrives
        setAdminTyping(false);
      });

      // Historical messages loaded
      socket.on('message_history', ({ messages: history }: { messages: ChatMessage[] }) => {
        setMessages(history);
        // Count unread messages from admin in history
        const unread = history.filter(
          m => (m.senderRole === 'admin' || m.senderRole === 'ai') && !m.read
        ).length;
        setUnreadFromAdmin(unread);
      });

      // Typing indicator from admin
      socket.on('typing_update', ({ who, typing }: { who: string; typing: boolean }) => {
        if (who === 'admin') {
          setAdminTyping(typing);
        }
      });

      // Conversation was closed by admin
      socket.on('conversation_closed', () => {
        setMessages(prev => [
          ...prev,
          {
            _id: `system-${Date.now()}`,
            conversationId: conversationIdRef.current || '',
            senderId: 'system',
            senderName: 'System',
            senderRole: 'ai',
            content: 'This conversation has been closed by the support team. Start a new message to open a new one.',
            read: true,
            createdAt: new Date().toISOString(),
          },
        ]);
      });

      socket.on('messages_read', ({ readBy }: { readBy: string }) => {
        if (readBy === 'admin') {
          setMessages(prev => prev.map(m => ({ ...m, read: true })));
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Failed to connect to chat:', err);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current?.disconnect();
    };
  }, [connect]);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current?.connected || !conversationIdRef.current || !content.trim()) return;
    socketRef.current.emit('send_message', {
      conversationId: conversationIdRef.current,
      content: content.trim(),
    });
    // Stop typing indicator when message is sent
    socketRef.current.emit('typing_stop', { conversationId: conversationIdRef.current });
  }, []);

  const sendTypingStart = useCallback(() => {
    if (!socketRef.current?.connected || !conversationIdRef.current) return;
    socketRef.current.emit('typing_start', { conversationId: conversationIdRef.current });

    // Auto-stop typing after 3 seconds of no input
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.connected && conversationIdRef.current) {
        socketRef.current.emit('typing_stop', { conversationId: conversationIdRef.current });
      }
    }, 3000);
  }, []);

  const sendTypingStop = useCallback(() => {
    if (!socketRef.current?.connected || !conversationIdRef.current) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('typing_stop', { conversationId: conversationIdRef.current });
  }, []);

  const loadHistory = useCallback(() => {
    if (!socketRef.current?.connected || !conversationIdRef.current) return;
    socketRef.current.emit('load_history', { conversationId: conversationIdRef.current });
  }, []);

  const markRead = useCallback(() => {
    setUnreadFromAdmin(0);
  }, []);

  return {
    messages,
    conversationId,
    connected,
    adminTyping,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    loadHistory,
    unreadFromAdmin,
    markRead,
  };
}