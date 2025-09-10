export function initSockets(io, sessionMiddleware) {
  // Share the Express session with Socket.IO
  io.use((socket, next) => sessionMiddleware(socket.request, {}, next));

  io.on("connection", (socket) => {
    const sess = socket.request.session;
    if (!sess?.userId) {
      socket.emit("unauthorized");
      return socket.disconnect(true);
    }
    const room = `user:${sess.userId}`;
    socket.join(room);
    socket.emit("welcome", { userId: sess.userId, name: sess.name });
  });
}
