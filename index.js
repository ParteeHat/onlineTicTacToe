var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = 3000;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

server.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});

var matcheso = [];
io.on("connection", (socket) => {
  socket.username = undefined;
  socket.roomID = undefined;

  const getIndexOfRoom = (room) => {
    for (let roomNum in matcheso) {
      if (matcheso[roomNum].roomID == room) {
        return roomNum;
      }
    }
    return "ROOM NUMBER DNE";
  };

  socket.on("get all rooms", () => {
    io.emit("update entire room list", JSON.stringify(matcheso));
  });

  socket.on("update username", (data) => {
    socket.username = data;
    console.log("Username: " + socket.username);
    io.emit("update entire room list", JSON.stringify(matcheso));
  });
  socket.on("make room", (data, pri) => {
    let failed = false;
    if (socket.roomNum != undefined) {
      failed = true;
    }
    for (let room of matcheso) {
      if (room.roomID == data) {
        console.log("ROOM ALREADY EXISTS");
        failed = true;
        break;
      }
    }
    if (!failed) {
      socket.join(data);
      socket.roomID = data;
      matcheso.push({
        roomID: socket.roomID,
        pri: pri,
        user1: socket.username,
        user2: undefined,
        currentTurn: "X",
        board: [
          ["&nbsp;", "&nbsp;", "&nbsp;"],
          ["&nbsp;", "&nbsp;", "&nbsp;"],
          ["&nbsp;", "&nbsp;", "&nbsp;"],
        ],
      });
      socket.emit(
        "update current room",
        JSON.stringify(matcheso[matcheso.length - 1])
      );
      io.emit("update entire room list", JSON.stringify(matcheso));
      io.to(String(socket.roomID)).emit(
        "update title",
        `Your room ID is ${socket.roomID}`
      );
      // console.log(socket.username + ' has made the room "' + socket.roomID + '"')
      // console.log("List of all matches: " + JSON.stringify(matcheso))
    }
  });
  socket.on("join room", (data) => {
    let failed = true;
    let connectedRoomID;
    for (let roomNum in matcheso) {
      if (
        matcheso[roomNum].roomID == data &&
        matcheso[roomNum].user1 != socket.username &&
        matcheso[roomNum].user2 == undefined
      ) {
        failed = false;
        connectedRoomID = roomNum;
      }
      if (
        matcheso[roomNum].user1 == socket.username ||
        matcheso[roomNum].user2 == socket.username
      ) {
        failed = true;
        console.log("ALREADY CONNECTED TO MATCH");
      }
    }
    if (!failed) {
      socket.join(data);
      socket.roomID = data;
      matcheso[connectedRoomID].user2 = socket.username;
      // console.log(Object.keys(io.sockets.adapter.rooms))
      // console.log(Object.keys(io.sockets.adapter.sids[socket.id]))
      io.to(String(socket.roomID)).emit(
        "update current room",
        JSON.stringify(matcheso[connectedRoomID])
      );
      io.emit("update entire room list", JSON.stringify(matcheso));
      console.log("List of all matches: " + JSON.stringify(matcheso));
      console.log(
        socket.username + ' has joined the room "' + socket.roomID + '"'
      );
      io.to(String(socket.roomID)).emit(
        "update title",
        `It is ${matcheso[getIndexOfRoom(socket.roomID)].user1}'s turn (X)`
      );
    } else {
      console.log("IT FAILED FOR VARIOUS REASONS");
    }
  });

  socket.on("disconnect", () => {
    if (
      socket.roomID != undefined &&
      matcheso[getIndexOfRoom(socket.roomID)] != undefined
    ) {
      if (matcheso[getIndexOfRoom(socket.roomID)].user1 == socket.username) {
        matcheso.splice([getIndexOfRoom(socket.roomID)], 1);
      } else if (
        matcheso[getIndexOfRoom(socket.roomID)].user2 == socket.username
      ) {
        matcheso[getIndexOfRoom(socket.roomID)].user2 = undefined;
        matcheso[getIndexOfRoom(socket.roomID)].board = [
          ["&nbsp;", "&nbsp;", "&nbsp;"],
          ["&nbsp;", "&nbsp;", "&nbsp;"],
          ["&nbsp;", "&nbsp;", "&nbsp;"],
        ];
      }
      socket.emit("update current room", JSON.stringify({}));
      io.emit("update entire room list", JSON.stringify(matcheso));
    }
    socket.roomID = undefined;
  });

  socket.on("chat message", (data, user) => {
    if (socket.roomID != undefined) {
      console.log(String(socket.roomID));
      io.to(String(socket.roomID)).emit("new message", data, user);
    }
  });

  socket.on("reset", () => {
    matcheso[getIndexOfRoom(socket.roomID)].board = [
      ["&nbsp;", "&nbsp;", "&nbsp;"],
      ["&nbsp;", "&nbsp;", "&nbsp;"],
      ["&nbsp;", "&nbsp;", "&nbsp;"],
    ];
    io.to(String(socket.roomID)).emit(
      "update current room",
      JSON.stringify(matcheso[getIndexOfRoom(socket.roomID)])
    );
    if (matcheso[getIndexOfRoom(socket.roomID)].currentTurn == "O") {
      io.to(String(socket.roomID)).emit(
        "update title",
        `It is ${matcheso[getIndexOfRoom(socket.roomID)].user2}'s turn (O)`
      );
    } else {
      io.to(String(socket.roomID)).emit(
        "update title",
        `It is ${matcheso[getIndexOfRoom(socket.roomID)].user1}'s turn (X)`
      );
    }
  });

  const win = (turn) => {
    if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][0] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][1] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][2]
    ) {
      return true;
    } else if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][0] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][1] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][2]
    ) {
      return true;
    } else if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][2] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][2] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][2]
    ) {
      return true;
    } else if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][1] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][1] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][1]
    ) {
      return true;
    } else if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][0] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][0] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][0]
    ) {
      return true;
    } else if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][0] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][1] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[0][2]
    ) {
      return true;
    } else if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][0] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][1] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[1][2]
    ) {
      return true;
    } else if (
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][0] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][1] &&
      turn == matcheso[getIndexOfRoom(socket.roomID)].board[2][2]
    ) {
      return true;
    } else {
      for (let x in matcheso[getIndexOfRoom(socket.roomID)].board) {
        for (let y in matcheso[getIndexOfRoom(socket.roomID)].board[x]) {
          if (matcheso[getIndexOfRoom(socket.roomID)].board[x][y] == "&nbsp;") {
            return false;
          }
        }
      }
      return "tie";
    }
  };

  socket.on("input", (x, y, u) => {
    if (matcheso[getIndexOfRoom(socket.roomID)] != undefined) {
      if (
        matcheso[getIndexOfRoom(socket.roomID)].user1 != undefined &&
        matcheso[getIndexOfRoom(socket.roomID)].user2 != undefined &&
        matcheso[getIndexOfRoom(socket.roomID)].board[x][y] == "&nbsp;"
      ) {
        if (
          matcheso[getIndexOfRoom(socket.roomID)].currentTurn == "X" &&
          matcheso[getIndexOfRoom(socket.roomID)].user1 == u
        ) {
          matcheso[getIndexOfRoom(socket.roomID)].board[x][y] = "X";
          matcheso[getIndexOfRoom(socket.roomID)].currentTurn = "O";
          io.to(String(socket.roomID)).emit(
            "update title",
            `It is ${matcheso[getIndexOfRoom(socket.roomID)].user2}'s turn (O)`
          );
          if (win("X") == true) {
            io.to(String(socket.roomID)).emit(
              "update title",
              `${matcheso[getIndexOfRoom(socket.roomID)].user1} (X) wins!`
            );
          } else if (win("X") == "tie") {
            io.to(String(socket.roomID)).emit("update title", "Tie");
          }
        } else if (
          matcheso[getIndexOfRoom(socket.roomID)].currentTurn == "O" &&
          matcheso[getIndexOfRoom(socket.roomID)].user2 == u
        ) {
          matcheso[getIndexOfRoom(socket.roomID)].board[x][y] = "O";
          matcheso[getIndexOfRoom(socket.roomID)].currentTurn = "X";
          io.to(String(socket.roomID)).emit(
            "update title",
            `It is ${matcheso[getIndexOfRoom(socket.roomID)].user1}'s turn (X)`
          );
          if (win("O") == true) {
            io.to(String(socket.roomID)).emit(
              "update title",
              `${matcheso[getIndexOfRoom(socket.roomID)].user2} (O) wins!`
            );
          } else if (win("O") == "tie") {
            io.to(String(socket.roomID)).emit("update title", "Tie");
          }
        } else {
          console.log("ITS NOT YOUR TURN");
        }
        io.to(String(socket.roomID)).emit(
          "update current room",
          JSON.stringify(matcheso[getIndexOfRoom(socket.roomID)])
        );
      } else {
        console.log("PERSON LEFT");
      }
    }
  });
});

// TODO
// ADD STOP ROOM FOR BOTH OWNER AND GEUST OF ROOM
// Prevent the creation of multiple rooms (might be a glitch if website doesn tload fast enough)
// Add check for username at the start
// Fix the deletion of join table when joining a full or invalid session
// https://coolors.co/202c39-283845-b8b08d-f2d492-f29559
