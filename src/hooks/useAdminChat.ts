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

export interface Conversation {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: 'open' | 'closed';
  lastMessage: string;
  lastMessageAt: string;
  unreadByAdmin: number;
  adminTyping: boolean;
  userTyping: boolean;
  createdAt: string;
}

interface UseAdminChatReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: ChatMessage[];
  connected: boolean;
  userTyping: boolean;
  openConversation: (conv: Conversation) => void;
  sendMessage: (content: string) => void;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  closeConversation: (conversationId: string) => void;
  totalUnread: number;
}

const CHAT_SERVER = process.env.NEXT_PUBLIC_CHAT_SERVER_URL || 'http://localhost:3001';

export function useAdminChat(): UseAdminChatReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userTyping, setUserTyping] = useState(false);

  const activeConvRef = useRef<Conversation | null>(null);
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
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on('connect', () => {
        setConnected(true);
        // Immediately request all conversations
        socket.emit('get_conversations');
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('connect_error', (err) => {
        console.error('Admin chat error:', err.message);
        setConnected(false);
      });

      // Full conversation list from server
      socket.on('conversations_list', ({ conversations: convList }: { conversations: Conversation[] }) => {
        setConversations(convList);
      });

      // A conversation's metadata changed (new message from user)
      socket.on('conversation_updated', (update: {
        conversationId: string;
        lastMessage: string;
        lastMessageAt: string;
        unreadByAdmin: number;
      }) => {
        setConversations(prev =>
          prev
            .map(c =>
              c._id === update.conversationId
                ? {
                    ...c,
                    lastMessage: update.lastMessage,
                    lastMessageAt: update.lastMessageAt,
                    unreadByAdmin: update.unreadByAdmin,
                  }
                : c
            )
            .sort((a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            )
        );
      });

      // History for an opened conversation
      socket.on('message_history', ({ conversationId, messages: history }: {
        conversationId: string;
        messages: ChatMessage[];
      }) => {
        if (activeConvRef.current?._id === conversationId) {
          setMessages(history);
        }
      });

      // New real-time message
      socket.on('new_message', (message: ChatMessage) => {
        // If this message belongs to the open conversation, add it
        if (activeConvRef.current?._id === message.conversationId) {
          setMessages(prev => {
            if (prev.find(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
          setUserTyping(false);
        }

        // Update sidebar regardless
        setConversations(prev =>
          prev
            .map(c =>
              c._id === message.conversationId
                ? {
                    ...c,
                    lastMessage: message.content,
                    lastMessageAt: message.createdAt,
                    // Only increment unread if it's not the active conversation
                    unreadByAdmin:
                      activeConvRef.current?._id === message.conversationId
                        ? 0
                        : c.unreadByAdmin + (message.senderRole === 'user' ? 1 : 0),
                  }
                : c
            )
            .sort((a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            )
        );
      });

      // Typing indicator from user
      socket.on('typing_update', ({ conversationId, who, typing }: {
        conversationId: string;
        who: string;
        typing: boolean;
      }) => {
        if (
          activeConvRef.current?._id === conversationId &&
          who === 'user'
        ) {
          setUserTyping(typing);
        }
      });

      // Conversation closed
      socket.on('conversation_closed', ({ conversationId }: { conversationId: string }) => {
        setConversations(prev =>
          prev.map(c =>
            c._id === conversationId ? { ...c, status: 'closed' } : c
          )
        );
        if (activeConvRef.current?._id === conversationId) {
          setActiveConversation(prev => prev ? { ...prev, status: 'closed' } : null);
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Failed to connect admin chat:', err);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socketRef.current?.disconnect();
    };
  }, [connect]);

 const openConversation = useCallback((conv: Conversation) => {
  setActiveConversation(conv);
  activeConvRef.current = conv;
  setMessages([]);
  setUserTyping(false);

  setConversations(prev =>
    prev.map(c => c._id === conv._id ? { ...c, unreadByAdmin: 0 } : c)
  );

  // Tell server we're leaving previous conversation (stops auto-read for old one)
  socketRef.current?.emit('admin_close_active');

  // Tell server which conversation admin is now viewing
  socketRef.current?.emit('admin_open_conversation', {
    conversationId: conv._id,
  });
}, []);

  const sendMessage = useCallback((content: string) => {
    if (!socketRef.current?.connected || !activeConvRef.current || !content.trim()) return;
    socketRef.current.emit('send_message', {
      conversationId: activeConvRef.current._id,
      content: content.trim(),
    });
    socketRef.current.emit('typing_stop', {
      conversationId: activeConvRef.current._id,
    });
  }, []);

  const sendTypingStart = useCallback(() => {
    if (!socketRef.current?.connected || !activeConvRef.current) return;
    socketRef.current.emit('typing_start', {
      conversationId: activeConvRef.current._id,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current?.connected && activeConvRef.current) {
        socketRef.current.emit('typing_stop', {
          conversationId: activeConvRef.current._id,
        });
      }
    }, 3000);
  }, []);

  const sendTypingStop = useCallback(() => {
    if (!socketRef.current?.connected || !activeConvRef.current) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socketRef.current.emit('typing_stop', {
      conversationId: activeConvRef.current._id,
    });
  }, []);

  const closeConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('close_conversation', { conversationId });
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadByAdmin, 0);

  return {
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
    totalUnread,
  };
}