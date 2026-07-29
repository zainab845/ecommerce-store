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
      const res = await fetch('/api/chat/token');
      if (!res.ok) return;
      const { token } = await res.json();

      const socket = io(CHAT_SERVER, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        setConnected(true);
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      socket.on('connect_error', () => {
        setConnected(false);
      });

      socket.on('conversation_ready', ({ conversationId: convId }: { conversationId: string }) => {
        setConversationId(convId);
        conversationIdRef.current = convId;
        socket.emit('load_history', { conversationId: convId });
      });

      socket.on('new_message', (message: ChatMessage) => {
        setMessages(prev => {
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });

        if (message.senderRole === 'admin' || message.senderRole === 'ai') {
          setUnreadFromAdmin(prev => prev + 1);
        }

        setAdminTyping(false);
      });

      socket.on('message_history', ({ messages: history }: { messages: ChatMessage[] }) => {
        setMessages(history);
        const unread = history.filter(
          m => (m.senderRole === 'admin' || m.senderRole === 'ai') && !m.read
        ).length;
        setUnreadFromAdmin(unread);
      });

      socket.on('typing_update', ({ who, typing }: { who: string; typing: boolean }) => {
        if (who === 'admin') setAdminTyping(typing);
      });


      // When admin reads messages, update ALL message ticks to double-tick
      socket.on('messages_read', ({ readBy }: { conversationId: string; readBy: string }) => {
        if (readBy === 'admin') {
          setMessages(prev =>
            prev.map(m =>
              // Only update messages sent by this user (ticks only apply to sent messages)
              m.senderRole === 'user' ? { ...m, read: true } : m
            )
          );
        }
      });

      socket.on('conversation_closed', () => {
        setMessages(prev => [
          ...prev,
          {
            _id: `system-${Date.now()}`,
            conversationId: conversationIdRef.current || '',
            senderId: 'system',
            senderName: 'System',
            senderRole: 'ai',
            content: 'This conversation has been closed. Send a new message to open a new one.',
            read: true,
            createdAt: new Date().toISOString(),
          },
        ]);
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
    socketRef.current.emit('typing_stop', { conversationId: conversationIdRef.current });
  }, []);

  const sendTypingStart = useCallback(() => {
    if (!socketRef.current?.connected || !conversationIdRef.current) return;
    socketRef.current.emit('typing_start', { conversationId: conversationIdRef.current });
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
    unreadFromAdmin,
    markRead,
  };
}