import { Server } from "socket.io";

let io: Server;

export const setSocketIO = (server: any) => {
  io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado por Socket.IO:", socket.id);
  });

  return io;
};

export const getSocketIO = () => io;