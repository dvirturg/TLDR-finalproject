import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { getChatHistory } from '../api/chatApi';
import { getUserById } from '../api/usersApi';
import { SOCKET_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import type { UserProfileData } from '../types';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

interface ReceiveMessagePayload {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string | Date;
}

const sortByCreatedAt = (items: ChatMessage[]): ChatMessage[] =>
  [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const targetUserId = searchParams.get('userId')?.trim() ?? '';
  const currentUserId = currentUser?.id ?? '';
  const hasCurrentUser = Boolean(currentUserId);
  const hasTargetUser = Boolean(targetUserId);
  const canStartChat = hasCurrentUser && hasTargetUser;
  const isSelfChat = canStartChat && currentUserId === targetUserId;

  const [targetUser, setTargetUser] = useState<UserProfileData | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [targetError, setTargetError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [socketError, setSocketError] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const appendIncomingMessage = useCallback((payload: ReceiveMessagePayload, partnerId: string) => {
    const isThisPair =
      (payload.senderId === currentUserId && payload.receiverId === partnerId) ||
      (payload.senderId === partnerId && payload.receiverId === currentUserId);
    if (!isThisPair) {
      return;
    }
    const next: ChatMessage = {
      id: payload._id,
      senderId: payload.senderId,
      text: payload.message,
      createdAt:
        payload.timestamp instanceof Date
          ? payload.timestamp.toISOString()
          : new Date(payload.timestamp).toISOString(),
    };
    setMessages((prev) => {
      if (prev.some((m) => m.id === next.id)) {
        return prev;
      }
      return sortByCreatedAt([...prev, next]);
    });
  }, [currentUserId]);

  useEffect(() => {
    let active = true;
    const loadTargetUser = async () => {
      if (!active) {
        return;
      }
      if (!canStartChat) {
        setTargetUser(null);
        setTargetError('');
        setLoadingTarget(false);
        return;
      }
      if (isSelfChat) {
        setTargetUser(null);
        setTargetError('You cannot start a chat with yourself.');
        setLoadingTarget(false);
        return;
      }
      setLoadingTarget(true);
      setTargetError('');
      try {
        const user = await getUserById(targetUserId);
        if (active) {
          setTargetUser(user);
          setTargetError('');
        }
      } catch {
        if (active) {
          setTargetUser(null);
          setTargetError('User not found.');
        }
      } finally {
        if (active) {
          setLoadingTarget(false);
        }
      }
    };
    loadTargetUser();

    return () => {
      active = false;
    };
  }, [canStartChat, isSelfChat, targetUserId]);

  useEffect(() => {
    let active = true;
    const loadHistory = async () => {
      if (!canStartChat || isSelfChat || !targetUserId) {
        setMessages([]);
        setHistoryError('');
        return;
      }
      setLoadingHistory(true);
      setHistoryError('');
      try {
        const rows = await getChatHistory(targetUserId);
        if (!active) {
          return;
        }
        setMessages(
          sortByCreatedAt(
            rows.map((row) => ({
              id: row.id,
              senderId: row.senderId,
              text: row.text,
              createdAt: row.createdAt,
            })),
          ),
        );
      } catch {
        if (active) {
          setMessages([]);
          setHistoryError('Could not load chat history. Try again.');
        }
      } finally {
        if (active) {
          setLoadingHistory(false);
        }
      }
    };
    loadHistory();
    return () => {
      active = false;
    };
  }, [canStartChat, isSelfChat, targetUserId]);

  useEffect(() => {
    if (!currentUserId || !targetUserId || isSelfChat) {
      return;
    }

    const socket = io(SOCKET_BASE_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    setSocketError('');

    socket.on('connect', () => {
      socket.emit('join', currentUserId);
    });

    socket.on('receive_message', (payload: ReceiveMessagePayload) => {
      appendIncomingMessage(payload, targetUserId);
    });

    socket.on('error', (payload: { message?: string }) => {
      setSocketError(payload?.message ?? 'Chat connection error.');
    });

    socket.on('connect_error', () => {
      setSocketError('Could not connect to chat server.');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [appendIncomingMessage, currentUserId, isSelfChat, targetUserId]);

  const sendMessage = () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || !currentUserId || !targetUserId || isSelfChat) {
      return;
    }
    const socket = socketRef.current;
    if (!socket?.connected) {
      setSocketError('Not connected. Wait a moment or refresh.');
      return;
    }
    setSocketError('');
    socket.emit('send_message', {
      senderId: currentUserId,
      receiverId: targetUserId,
      message: trimmedDraft,
    });
    setDraft('');
  };

  const handleSendOnEnter: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  };

  const getMessageClass = (senderId: string) => {
    if (senderId === currentUserId) {
      return 'chat-message chat-message--me';
    }
    return 'chat-message chat-message--other';
  };

  const renderState = () => {
    if (!hasCurrentUser) {
      return <p className="chat-empty-text">Sign in to use chat.</p>;
    }
    if (!hasTargetUser) {
      return <p className="chat-empty-text">Open chat from a user profile to start a conversation.</p>;
    }
    if (targetError) {
      return <p className="error-message">{targetError}</p>;
    }
    if (loadingTarget) {
      return <p className="chat-empty-text">Loading conversation...</p>;
    }
    if (historyError) {
      return <p className="error-message">{historyError}</p>;
    }
    if (loadingHistory) {
      return <p className="chat-empty-text">Loading messages...</p>;
    }
    if (messages.length === 0) {
      return <p className="chat-empty-text">No messages yet. Say hi to start the conversation.</p>;
    }
    return (
      <div className="chat-messages-list">
        {messages.map((message) => (
          <div key={message.id} className={getMessageClass(message.senderId)}>
            <p className="chat-message-text">{message.text}</p>
            <span className="chat-message-time">
              {new Date(message.createdAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="chat-page">
      <div className="chat-card">
        <div className="chat-header">
          <div>
            <h2 className="chat-title">
              {targetUser ? `Chat with ${targetUser.username}` : 'Direct Chat'}
            </h2>
          </div>
          <button className="chat-back-btn" onClick={() => navigate('/feed')}>
            Return to Feed
          </button>
        </div>

        <div className="chat-body">{renderState()}</div>
        {socketError ? <p className="error-message">{socketError}</p> : null}

        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleSendOnEnter}
            placeholder="Type your message..."
            disabled={
              !canStartChat ||
              Boolean(targetError) ||
              loadingTarget ||
              loadingHistory ||
              Boolean(historyError) ||
              isSelfChat
            }
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={
              !draft.trim() ||
              !canStartChat ||
              Boolean(targetError) ||
              loadingTarget ||
              loadingHistory ||
              Boolean(historyError) ||
              isSelfChat
            }
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
