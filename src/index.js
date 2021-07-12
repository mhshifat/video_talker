const express = require("express");
const socketIo = require("socket.io");
const { ExpressPeerServer } = require("peer");
const { v4: uuidV4 } = require("uuid");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/api", (_, res) => res.send("Hello from server"));

const server = app.listen(PORT, () => {
  console.log(`The server is running on http://localhost:${5000}`);
})

const peerServer = ExpressPeerServer(server, {
  debug: true
})

app.use("/peer", peerServer);
app.use(express.static(path.resolve(__dirname, "./client/build")));
app.get("*", function (request, response) {
  response.sendFile(path.resolve(__dirname, "./client/build", "index.html"));
});

peerServer.on("connection", (client) => {
  console.log(client.id);
})

const io = socketIo(server, {
  cors: {
    origin: "*"
  }
})

let peers = [];
let groups = [];
io.on("connection", (socket) => {
  socket.emit("connection", null);

  socket.on("register_naw_user", (data) => {
    peers.push(data);

    io.sockets.emit("broadcast", {
      event: "users",
      users: peers
    })

    io.sockets.emit("broadcast", {
      event: "groups",
      groups
    })
  })

  socket.on("pre_offer", (data) => {
    const { callee, caller } = data;
    io.to(callee.id).emit("pre_offer", caller);
  })


  socket.on("pre_offer_answer", (data) => {
    const { caller, answer } = data;
    io.to(caller.id).emit("pre_offer_answer", answer);
  })

  socket.on("web_rtc_offer", (data) => {
    const { callee, offer } = data;
    io.to(callee).emit("web_rtc_offer", offer);
  })

  socket.on("web_rtc_answer", (data) => {
    const { caller, answer } = data;
    io.to(caller).emit("web_rtc_answer", answer);
  })

  socket.on("send_ice_candidates", (data) => {
    const { callee, candidate } = data;
    io.to(callee).emit("send_ice_candidates", candidate);
  })

  socket.on("hang_up", (data) => {
    const { connectedUser } = data;
    io.to(connectedUser).emit("hang_up");
  })

  socket.on("register_new_room", (data) => {
    const roomId = uuidV4();
    socket.join(roomId);
    const newGroupCallData = {
      roomId,
      peerId: data.peerId,
      socketId: socket.id,
      host: data.username
    }
    groups.push(newGroupCallData);
    io.sockets.emit("broadcast", {
      event: "groups",
      groups
    })
  })

  socket.on("join_room_request", data => {
    io.to(data.roomId).emit("join_room_request", data);

    socket.join(data.roomId);
  })

  socket.on("leave_group", data => {
    io.to(data.roomId).emit("leave_group", data.streamId);

    socket.leave(data.roomId);
  })

  socket.on("disconnect", () => {
    peers = peers.filter(i => i.id !== socket.id);

    io.sockets.emit("broadcast", {
      event: "users",
      users: peers
    })
  })
})
