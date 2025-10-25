/* ---------- Firebase Config (replace only if needed) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyApUlRA73t4YzntbsAs05njdOuOrllX92Q",
  authDomain: "barbie-doll-game-759cc.firebaseapp.com",
  databaseURL: "https://barbie-doll-game-759cc-default-rtdb.firebaseio.com",
  projectId: "barbie-doll-game-759cc",
  storageBucket: "barbie-doll-game-759cc.firebasestorage.app",
  messagingSenderId: "550459181007",
  appId: "1:550459181007:web:271589827bd734ba11b4ba",
  measurementId: "G-8931YWS3ZF"
};

/* ---------- Initialize Firebase (compat) ---------- */
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------- DOM refs ---------- */
const board = document.getElementById('board');
const resetBtn = document.getElementById('resetBtn');
const hostBtn = document.getElementById('hostBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomIdInput');
const roomInfo = document.getElementById('roomInfo');
const turnColor = document.getElementById('turnColor');

let roomId = null;
let selectedPiece = null;
let currentTurn = 'red';
let myColor = null; // 'red' or 'white'

function randomRoomID() {
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

/* ---------- Board creation ---------- */
function createBoard() {
  board.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell', (row + col) % 2 === 0 ? 'light' : 'dark');
      board.appendChild(cell);

      // initial pieces on dark squares
      if (cell.classList.contains('dark') && row < 3) {
        const piece = document.createElement('div');
        piece.classList.add('piece','white');
        cell.appendChild(piece);
      } else if (cell.classList.contains('dark') && row > 4) {
        const piece = document.createElement('div');
        piece.classList.add('piece','red');
        cell.appendChild(piece);
      }

      // attach click for move
      cell.addEventListener('click', () => handleMove(cell));
    }
  }
}

/* ---------- Utils ---------- */
function getRowCol(cell) {
  const index = Array.from(board.children).indexOf(cell);
  return [Math.floor(index/8), index % 8];
}

/* ---------- Move logic (basic checkers rules) ---------- */
function handleMove(cell) {
  if (!selectedPiece || !roomId) return; // require to be in a room
  if (!cell.classList.contains('dark')) return;
  const parent = selectedPiece.parentElement;
  const [fromRow, fromCol] = getRowCol(parent);
  const [toRow, toCol] = getRowCol(cell);
  const dir = selectedPiece.classList.contains('red') ? -1 : 1;
  const deltaRow = toRow - fromRow;
  const deltaCol = Math.abs(toCol - fromCol);

  if (cell.children.length === 0) {
    // normal move
    if (deltaRow === dir && deltaCol === 1) {
      movePiece(selectedPiece, cell);
    }
    // jump
    else if (deltaRow === dir*2 && deltaCol === 2) {
      const midRow = (fromRow + toRow)/2;
      const midCol = (fromCol + toCol)/2;
      const midCell = board.children[midRow*8 + midCol];
      if (midCell.children.length > 0) {
        const enemy = midCell.children[0];
        const enemyColor = enemy.classList.contains('red') ? 'red' : 'white';
        if (enemyColor !== (currentTurn === 'red' ? 'red' : 'white')) {
          // allowed capture only if enemy is the opposite color
          midCell.removeChild(enemy);
          movePiece(selectedPiece, cell);
        }
      }
    }
  }
}

/* ---------- Select piece (only your color and only on your turn) ---------- */
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('piece')) {
    // allow selection only if in a room, piece is your color, and it's your turn
    if (!roomId) return;
    const pieceColor = e.target.classList.contains('red') ? 'red' : 'white';
    if (pieceColor === myColor && pieceColor === currentTurn) {
      if (selectedPiece) selectedPiece.classList.remove('selected');
      selectedPiece = e.target;
      selectedPiece.classList.add('selected');
    }
  }
});

/* ---------- Move piece and save ---------- */
function movePiece(piece, targetCell) {
  piece.classList.remove('selected');
  targetCell.appendChild(piece);
  selectedPiece = null;
  currentTurn = currentTurn === 'red' ? 'white' : 'red';
  updateTurnDisplay();
  saveGameState();
}

/* ---------- UI ---------- */
function updateTurnDisplay() {
  turnColor.textContent = currentTurn === 'red' ? 'Red Player' : 'White Player';
  turnColor.style.color = currentTurn === 'red' ? 'red' : 'gray';
}

/* ---------- Reset ---------- */
resetBtn.addEventListener('click', () => {
  if (!roomId) return alert('پہلے Host کریں یا Room Join کریں۔');
  currentTurn = 'red';
  selectedPiece = null;
  createBoard();
  updateTurnDisplay();
  saveGameState();
});

/* ---------- Firebase save / listen ---------- */
function saveGameState() {
  if (!roomId) return;
  firebase.database().ref(`rooms/${roomId}`).set({
    html: board.innerHTML,
    turn: currentTurn
  });
}

function listenToRoom() {
  if (!roomId) return;
  firebase.database().ref(`rooms/${roomId}`).on('value', (snap) => {
    const data = snap.val();
    if (!data) return;
    board.innerHTML = data.html;
    currentTurn = data.turn || 'red';
    updateTurnDisplay();
    // reattach click listeners on cells after innerHTML replacement
    Array.from(board.children).forEach(cell => {
      cell.addEventListener('click', () => handleMove(cell));
    });
  });
}

/* ---------- Host / Join ---------- */
hostBtn.addEventListener('click', () => {
  roomId = randomRoomID();
  myColor = 'red';
  roomInfo.innerHTML = `🎮 Your Room ID: <b>${roomId}</b> <br> Share this ID with your friend!`;
  createBoard();
  saveGameState();
  listenToRoom();
});

joinBtn.addEventListener('click', () => {
  const id = roomInput.value.trim();
  if (!id) return alert('Enter Room ID!');
  roomId = id;
  myColor = 'white';
  roomInfo.innerHTML = `✅ Joined Room: <b>${roomId}</b>`;
  listenToRoom();
});

/* ---------- init ---------- */
createBoard();
updateTurnDisplay();