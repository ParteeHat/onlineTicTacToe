/* global io */
const socket = io();
const privateCheckbox = document.getElementById("mPrivate");
const jRoom = document.getElementById("jRoom");
const makeRoom = document.getElementById("makeRoom");
const joinRoom = document.getElementById("joinRoom");
const user = document.getElementById("username");
const setUsername = document.getElementById("setUsername");
const title = document.getElementById("title");
const joinMakeListWrapper = document.getElementById("joinMakeListWrapper");
const chatForm = document.getElementById("chatForm");
const chatMessage = document.getElementById("chatMessage");
const chatBox = document.getElementById("chatBox");
var username = undefined;
var room = undefined;
var roomInfo = undefined;
var roomList = undefined;
var turnUsername;

if (localStorage.getItem("username") != null) {
  user.value = localStorage.getItem("username");
}

setUsername.addEventListener("submit", (e) => {
  e.preventDefault();
  localStorage.setItem("username", user.value);
  if (user.value != "") {
    if (checkIfUsernameIsInUse(user.value) == false) {
      username = user.value;
      socket.emit("update username", username);
      setUsername.parentNode.removeChild(setUsername);
      joinMakeListWrapper.classList.add("fadeIn");
    } else {
      console.log("Username already in use");
    }
  }
});

const checkIfUsernameIsInUse = (input) => {
  for (let room of roomList) {
    if (room.user1 == input || room.user2 == input) {
      return true;
    }
  }
  return false;
};

const join = (roomCode) => {
  if (roomCode != "" && username != undefined) {
    room = roomCode;
    socket.emit("join room", room);
    joinMakeListWrapper.parentNode.removeChild(joinMakeListWrapper);
    document.getElementById("chatGameWrapper").classList.add("fadeIn");
    socket.emit("chat message", `${username} has joined`, username);
  }
};

joinRoom.addEventListener("submit", (e) => {
  e.preventDefault();
  join(jRoom.value);
});

makeRoom.addEventListener("submit", (e) => {
  e.preventDefault();
  if (username != undefined) {
    room = Math.floor(Math.random() * 100 + 1);
    socket.emit("make room", room, privateCheckbox.checked);
    joinMakeListWrapper.parentNode.removeChild(joinMakeListWrapper);
    document.getElementById("chatGameWrapper").classList.add("fadeIn");
    document.body.style.overflow = "visible";
  }
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (chatMessage.value != "") {
    socket.emit("chat message", chatMessage.value, username);
    let chat = document.createElement("div");
    chat.innerHTML = `${chatMessage.value}`;
    chat.classList.add("ownBubble");
    chatBox.appendChild(chat);
    chatMessage.value = "";
  }
});

socket.on("connect", () => {
  socket.emit("get all rooms");
});

socket.on("new message", (data, user) => {
  if (user != username) {
    let chat = document.createElement("div");
    chat.innerHTML = `${data}`;
    chat.classList.add("otherBubble");
    chatBox.appendChild(chat);
    chat.value = "";
  }
});

socket.on("update current room", (data) => {
  roomInfo = JSON.parse(data);
  for (let x in roomInfo.board) {
    for (let y in roomInfo.board[x]) {
      document.getElementById(String(x) + String(y)).innerHTML =
        roomInfo.board[x][y];
      if (roomInfo.board[x][y] != "&nbsp;") {
        document.getElementById(String(x) + String(y)).disabled = true;
      } else {
        document.getElementById(String(x) + String(y)).disabled = false;
      }
    }
  }
});

socket.on("update entire room list", (data) => {
  if (document.getElementById("match") != null) {
    roomList = JSON.parse(data);

    let table = document.getElementById("match");
    let row = document.createElement("tr");
    table.innerHTML =
      '<tr class="matchTr"><th class="matchTh">Username\'s Room</th><th class="matchTh">Room ID</th><th class="matchTh">Join Button</th></tr>';
    for (let room of roomList) {
      if (room.pri == false) {
        let row = document.createElement("tr");
        row.innerHTML = `<th>${room.user1}</th><th>${room.roomID}</th><th><button class="joinRoomButton" id='joinRoomButton${room.roomID}'>JOIN</button></th>`;
        table.appendChild(row);
        eval(
          `document.getElementById('joinRoomButton${room.roomID}').addEventListener('click', function () {join(${room.roomID})});`
        );
      }
    }
  }
});

socket.on("update title", (data) => {
  title.innerHTML = data;
});

// const disableButtons = boo => {
//   document.getElementById('00').disabled = boo
//   document.getElementById('01').disabled = boo
//   document.getElementById('02').disabled = boo
//   document.getElementById('10').disabled = boo
//   document.getElementById('11').disabled = boo
//   document.getElementById('12').disabled = boo
//   document.getElementById('20').disabled = boo
//   document.getElementById('21').disabled = boo
//   document.getElementById('22').disabled = boo
// }

document.getElementById("00").addEventListener("click", function () {
  socket.emit("input", 0, 0, username);
});
document.getElementById("01").addEventListener("click", function () {
  socket.emit("input", 0, 1, username);
});
document.getElementById("02").addEventListener("click", function () {
  socket.emit("input", 0, 2, username);
});
document.getElementById("10").addEventListener("click", function () {
  socket.emit("input", 1, 0, username);
});
document.getElementById("11").addEventListener("click", function () {
  socket.emit("input", 1, 1, username);
});
document.getElementById("12").addEventListener("click", function () {
  socket.emit("input", 1, 2, username);
});
document.getElementById("20").addEventListener("click", function () {
  socket.emit("input", 2, 0, username);
});
document.getElementById("21").addEventListener("click", function () {
  socket.emit("input", 2, 1, username);
});
document.getElementById("22").addEventListener("click", function () {
  socket.emit("input", 2, 2, username);
});

document.getElementById("reset").addEventListener("click", function () {
  socket.emit("reset", 2, 2, username);
});
