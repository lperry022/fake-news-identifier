// backend/sockets/initSockets.js
export function initSockets(io, sessionMiddleware) {
  // share express-session with socket.io
  io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

  io.on("connection", (socket) => {
    const uid = socket.request?.session?.userId;
    if (uid) socket.join(`user:${uid}`); // room per user
  });
}
