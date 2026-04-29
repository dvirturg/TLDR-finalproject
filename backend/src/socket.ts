import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import ChatMessage from "./models/chatModel";

export interface SendMessagePayload {
  senderId: string;
  receiverId: string;
  message: string;
}

const onlineUsers = new Map<string, Set<string>>();

function addOnline(userId: string, socketId: string): void {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId)!.add(socketId);
}

function removeSocket(socketId: string): string | null {
  for (const [userId, sockets] of onlineUsers) {
    if (sockets.has(socketId)) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
      }
      return userId;
    }
  }

  return null;
}

export function attachChatSocket(
  httpServer: http.Server,
  clientOrigin: string,
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Socket] Connected: ${socket.id}`);
    }

    socket.on("join", (userId: string) => {
      socket.join(userId);
      addOnline(userId, socket.id);
      io.emit("user_online", userId);
      socket.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("send_message", async (payload: SendMessagePayload) => {
      const { senderId, receiverId, message } = payload;

      try {
        const saved = await ChatMessage.create({
          sender: senderId,
          recipient: receiverId,
          content: message,
          read: false,
        });

        const emittedMessage = {
          _id: String(saved._id),
          senderId,
          receiverId,
          message: saved.content,
          timestamp: saved.createdAt,
        };

        io.to(receiverId).emit("receive_message", emittedMessage);
        io.to(senderId).emit("receive_message", emittedMessage);
      } catch (err) {
        console.error("Failed to save/emit chat message:", err);
        socket.emit("error", { message: "Failed to deliver message" });
      }
    });

    socket.on("disconnect", () => {
      const userId = removeSocket(socket.id);
      if (userId && !onlineUsers.has(userId)) {
        io.emit("user_offline", userId);
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Socket] Disconnected: ${socket.id}`);
      }
    });
  });

  return io;
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}
