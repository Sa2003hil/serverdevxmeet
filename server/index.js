const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map(); // this map will store the email and socket id of the user
const socketidToEmailMap = new Map(); // this map will store the socket id and email of the user

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("room:join", (data) => {
    // Step 1: destructure the email and room from the data
    const { email, room } = data;
    // Step 2: set the email and socket id in the map
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);
    // Step 5: Notify all the users in the room that a new user has joined
    io.to(room).emit("user:joined", { email, id: socket.id });
    // Step 4: Join the room
    socket.join(room);

    // Step 3: Send the user the list of all the users in the room
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("disconnect", () => {
    const email = socketidToEmailMap.get(socket.id);
    if (email) {
      socketidToEmailMap.delete(socket.id);
      emailToSocketIdMap.delete(email);
      // Broadcast the disconnection event to all users in the room
      io.emit("user:disconnect", { email });
    }
  });
});

module.exports = io;
