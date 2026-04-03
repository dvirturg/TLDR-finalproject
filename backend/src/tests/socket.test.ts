import http from "http";
import ChatMessage from "../models/chatModel";
import { attachChatSocket, getOnlineUsers } from "../socket";

const emitToRoom = jest.fn();
const ioEmit = jest.fn();
const ioTo = jest.fn(() => ({ emit: emitToRoom }));
let connectionHandler: ((socket: any) => void) | undefined;

jest.mock("socket.io", () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn((event: string, handler: (socket: any) => void) => {
      if (event === "connection") {
        connectionHandler = handler;
      }
    }),
    emit: ioEmit,
    to: ioTo,
  })),
}));

jest.mock("../models/chatModel", () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
  },
}));

type MockSocket = {
  id: string;
  emit: jest.Mock;
  join: jest.Mock;
  handlers: Record<string, (...args: any[]) => any>;
};

const mockedChatMessage = jest.mocked(ChatMessage);

function createSocket(id: string): MockSocket {
  const handlers: Record<string, (...args: any[]) => any> = {};

  return {
    id,
    emit: jest.fn(),
    join: jest.fn(),
    handlers,
  };
}

function registerSocket(socket: MockSocket) {
  connectionHandler?.({
    id: socket.id,
    emit: socket.emit,
    join: socket.join,
    on: (event: string, handler: (...args: any[]) => any) => {
      socket.handlers[event] = handler;
    },
  });
}

describe("socket chat", () => {
  beforeEach(() => {
    emitToRoom.mockReset();
    ioEmit.mockReset();
    ioTo.mockClear();
    mockedChatMessage.create.mockReset();
  });

  afterEach(() => {
    for (const userId of [...getOnlineUsers()]) {
      void userId;
    }
  });

  test("join registers the user, joins the room, and emits online presence", () => {
    attachChatSocket({} as http.Server, "http://localhost:5173");

    const socket = createSocket("socket-1");
    registerSocket(socket);

    socket.handlers["join"]("user-1");

    expect(socket.join).toHaveBeenCalledWith("user-1");
    expect(ioEmit).toHaveBeenCalledWith("user_online", "user-1");
    expect(socket.emit).toHaveBeenCalledWith("online_users", ["user-1"]);
    expect(getOnlineUsers()).toEqual(["user-1"]);

    socket.handlers["disconnect"]();
  });

  test("send_message persists the chat message and emits it to sender and receiver rooms", async () => {
    const timestamp = new Date("2026-04-02T12:00:00.000Z");
    mockedChatMessage.create.mockResolvedValue({
      _id: "message-1",
      content: "hello there",
      createdAt: timestamp,
    } as any);

    attachChatSocket({} as http.Server, "http://localhost:5173");

    const socket = createSocket("socket-2");
    registerSocket(socket);

    await socket.handlers["send_message"]({
      senderId: "sender-1",
      receiverId: "receiver-1",
      message: "hello there",
    });

    expect(mockedChatMessage.create).toHaveBeenCalledWith({
      sender: "sender-1",
      recipient: "receiver-1",
      content: "hello there",
      read: false,
    });
    expect(ioTo).toHaveBeenNthCalledWith(1, "receiver-1");
    expect(ioTo).toHaveBeenNthCalledWith(2, "sender-1");
    expect(emitToRoom).toHaveBeenNthCalledWith(1, "receive_message", {
      _id: "message-1",
      senderId: "sender-1",
      receiverId: "receiver-1",
      message: "hello there",
      timestamp,
    });
    expect(emitToRoom).toHaveBeenNthCalledWith(2, "receive_message", {
      _id: "message-1",
      senderId: "sender-1",
      receiverId: "receiver-1",
      message: "hello there",
      timestamp,
    });
  });

  test("send_message emits an error when persistence fails", async () => {
    mockedChatMessage.create.mockRejectedValue(new Error("db failed"));

    attachChatSocket({} as http.Server, "http://localhost:5173");

    const socket = createSocket("socket-3");
    registerSocket(socket);

    await socket.handlers["send_message"]({
      senderId: "sender-2",
      receiverId: "receiver-2",
      message: "fail me",
    });

    expect(socket.emit).toHaveBeenCalledWith("error", {
      message: "Failed to deliver message",
    });
  });

  test("disconnect emits user_offline only after the user's last socket disconnects", () => {
    attachChatSocket({} as http.Server, "http://localhost:5173");

    const firstSocket = createSocket("socket-4");
    const secondSocket = createSocket("socket-5");

    registerSocket(firstSocket);
    registerSocket(secondSocket);

    firstSocket.handlers["join"]("user-2");
    secondSocket.handlers["join"]("user-2");
    ioEmit.mockClear();

    firstSocket.handlers["disconnect"]();
    expect(ioEmit).not.toHaveBeenCalledWith("user_offline", "user-2");
    expect(getOnlineUsers()).toEqual(["user-2"]);

    secondSocket.handlers["disconnect"]();
    expect(ioEmit).toHaveBeenCalledWith("user_offline", "user-2");
    expect(getOnlineUsers()).toEqual([]);
  });
});
