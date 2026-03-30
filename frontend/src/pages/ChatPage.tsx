import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getUserById } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import type { UserProfileData } from '../types';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

const STORAGE_PREFIX = 'direct-chat';

const buildConversationKey = (firstUserId: string, secondUserId: string) => {
  const [idA, idB] = [firstUserId, secondUserId].sort();
  return `${STORAGE_PREFIX}:${idA}:${idB}`;
};

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
  const conversationKey = useMemo(() => {
    if (!canStartChat || isSelfChat) {
      return '';
    }
    return buildConversationKey(currentUserId, targetUserId);
  }, [canStartChat, currentUserId, isSelfChat, targetUserId]);

  const [targetUser, setTargetUser] = useState<UserProfileData | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [targetError, setTargetError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    let active = true;
    const loadMessages = async () => {
      await Promise.resolve();
      if (!active) {
        return;
      }
      if (!canStartChat || isSelfChat || !conversationKey) {
        setMessages([]);
        return;
      }
      const rawMessages = localStorage.getItem(conversationKey);
      if (!rawMessages) {
        setMessages([]);
        return;
      }
      try {
        const parsedMessages = JSON.parse(rawMessages) as ChatMessage[];
        if (!Array.isArray(parsedMessages)) {
          setMessages([]);
          return;
        }
        const safeMessages = parsedMessages.filter(
          (message) =>
            typeof message?.id === 'string' &&
            typeof message?.senderId === 'string' &&
            typeof message?.text === 'string' &&
            typeof message?.createdAt === 'string',
        );
        setMessages(safeMessages);
      } catch {
        setMessages([]);
      }
    };
    loadMessages();
    return () => {
      active = false;
    };
  }, [canStartChat, conversationKey, isSelfChat]);

  useEffect(() => {
    if (!conversationKey) {
      return;
    }
    localStorage.setItem(conversationKey, JSON.stringify(messages));
  }, [conversationKey, messages]);

  useEffect(() => {
    let active = true;
    const loadTargetUser = async () => {
      await Promise.resolve();
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

  const sendMessage = () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || !currentUserId || !targetUserId || isSelfChat) {
      return;
    }
    const nextMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      senderId: currentUserId,
      text: trimmedDraft,
      createdAt: new Date().toISOString(),
    };
    setMessages((existingMessages) => [...existingMessages, nextMessage]);
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

        <div className="chat-input-row">
          <input
            type="text"
            className="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleSendOnEnter}
            placeholder="Type your message..."
            disabled={!canStartChat || Boolean(targetError) || loadingTarget || isSelfChat}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={!draft.trim() || !canStartChat || Boolean(targetError) || loadingTarget || isSelfChat}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
