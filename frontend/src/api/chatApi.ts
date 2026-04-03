import axiosInstance from './axiosInstance';

interface RawUserRef {
  _id?: string;
  id?: string;
  username?: string;
  profileUrl?: string;
}

interface RawChatMessage {
  _id: string;
  sender: string | RawUserRef;
  recipient: string | RawUserRef;
  content: string;
  createdAt: string;
}

export interface ChatHistoryMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
}

export interface ChatConversation {
  userId: string;
  username: string;
  profileUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

const resolveUserId = (value: string | RawUserRef): string => {
  if (typeof value === 'string') {
    return value;
  }
  return value._id || value.id || '';
};

export const getChatHistory = async (userId: string): Promise<ChatHistoryMessage[]> => {
  const { data } = await axiosInstance.get<RawChatMessage[]>(`/chat/${userId}`);

  return data.map((message) => ({
    id: message._id,
    senderId: resolveUserId(message.sender),
    receiverId: resolveUserId(message.recipient),
    text: message.content,
    createdAt: message.createdAt,
  }));
};

export const getConversations = async (): Promise<ChatConversation[]> => {
  const { data } = await axiosInstance.get<ChatConversation[]>('/chat/conversations');
  return data;
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  await axiosInstance.post(`/chat/message/${messageId}/read`);
};
