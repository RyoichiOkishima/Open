var board = Array(9).fill('');
var current = 'X';
var gameOver = false;
var mode = 'cpu';
var difficulty = 'normal';
var scores = { X: 0, O: 0, draw: 0 };
var soundOn = true;

var WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

// Pause menu
function togglePause() {
  document.getElementById('pause-overlay').classList.toggle('open');
}

function pauseRestart() {
  togglePause();
  scores = { X: 0, O: 0, draw: 0 };
  updateScores();
  resetGame();
}

function pauseModeSelect() {
  togglePause();
  showScreen('screen-mode');
}

function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('sound-icon').textContent = soundOn ? '🔊' : '🔇';
  document.getElementById('sound-label').textContent = soundOn ? '音量 ON' : '音量 OFF';
}

function startGame(m) {
  mode = m;
  difficulty = 'normal';
  scores = { X: 0, O: 0, draw: 0 };
  updateScores();
  updateModeLabel();
  updateDifficultyButtons();
  resetGame();
  showScreen('screen-game');
}

function updateModeLabel() {
  var label = '';
  if (mode === 'cpu') {
    var diffNames = { easy: 'かんたん', normal: 'ふつう', hard: 'つよい' };
    label = 'vs CPU（' + diffNames[difficulty] + '）';
  } else {
    label = '2人対戦';
  }
  document.getElementById('mode-label').textContent = label;
}

function initBoard() {
  var el = document.getElementById('board');
  el.innerHTML = '';
  for (var i = 0; i < 9; i++) {
    var cell = document.createElement('button');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', onCellClick);
    el.appendChild(cell);
  }
}

function onCellClick(e) {
  var idx = parseInt(e.target.dataset.index);
  if (board[idx] || gameOver) return;
  if (mode === 'cpu' && current === 'O') return;
  makeMove(idx);
  if (mode === 'cpu' && !gameOver && current === 'O') {
    setTimeout(cpuMove, 300);
  }
}

function makeMove(idx) {
  board[idx] = current;
  var cells = document.querySelectorAll('.cell');
  cells[idx].textContent = current;
  cells[idx].classList.add('taken', current.toLowerCase());

  var winLine = checkWin(current);
  if (winLine) {
    gameOver = true;
    winLine.forEach(function(i) { cells[i].classList.add('win'); });
    scores[current]++;
    updateScores();
    setStatus('<span class="mark-' + current.toLowerCase() + '">' + current + '</span> の勝ち!');
    setTimeout(function() { showResult(current); }, 800);
    return;
  }

  if (board.every(function(c) { return c; })) {
    gameOver = true;
    scores.draw++;
    updateScores();
    setStatus('引き分け!');
    setTimeout(function() { showResult(null); }, 800);
    return;
  }

  current = current === 'X' ? 'O' : 'X';
  setStatus('<span class="mark-' + current.toLowerCase() + '">' + current + '</span> の番です');
}

function showResult(winner) {
  var icon = document.getElementById('result-icon');
  var text = document.getElementById('result-text');
  if (winner === 'X') {
    icon.textContent = '🎉';
    text.innerHTML = '<span style="color:#e74c3c">X</span> の勝ち!';
  } else if (winner === 'O') {
    icon.textContent = '🎉';
    text.innerHTML = '<span style="color:#3498db">O</span> の勝ち!';
  } else {
    icon.textContent = '🤝';
    text.textContent = '引き分け!';
  }
  document.getElementById('rs-x').textContent = scores.X;
  document.getElementById('rs-o').textContent = scores.O;
  document.getElementById('rs-draw').textContent = scores.draw;
  var diffSection = document.getElementById('difficulty-section');
  if (mode === 'cpu') {
    diffSection.classList.add('visible');
  } else {
    diffSection.classList.remove('visible');
  }
  showScreen('screen-result');
}

function continueGame() {
  updateModeLabel();
  resetGame();
  showScreen('screen-game');
}

function setDifficulty(d) {
  difficulty = d;
  updateDifficultyButtons();
}

function updateDifficultyButtons() {
  var btns = document.querySelectorAll('.diff-btn');
  var levels = ['easy', 'normal', 'hard'];
  btns.forEach(function(btn, i) {
    btn.classList.toggle('selected', levels[i] === difficulty);
  });
}

function checkWin(mark) {
  for (var i = 0; i < WIN_LINES.length; i++) {
    var l = WIN_LINES[i];
    if (board[l[0]] === mark && board[l[1]] === mark && board[l[2]] === mark) {
      return l;
    }
  }
  return null;
}

// === CPU AI ===
function cpuMove() {
  var move;
  if (difficulty === 'easy') {
    move = cpuEasy();
  } else if (difficulty === 'hard') {
    move = cpuHard();
  } else {
    move = cpuNormal();
  }
  makeMove(move);
}

function cpuEasy() {
  var empty = board.map(function(v,i) { return v ? -1 : i; }).filter(function(i) { return i >= 0; });
  return empty[Math.floor(Math.random() * empty.length)];
}

function cpuNormal() {
  var move = findWinningMove('O');
  if (move === -1) move = findWinningMove('X');
  if (move === -1 && !board[4]) move = 4;
  if (move === -1) {
    var corners = [0,2,6,8].filter(function(i) { return !board[i]; });
    if (corners.length) move = corners[Math.floor(Math.random() * corners.length)];
  }
  if (move === -1) {
    var empty = board.map(function(v,i) { return v ? -1 : i; }).filter(function(i) { return i >= 0; });
    move = empty[Math.floor(Math.random() * empty.length)];
  }
  return move;
}

function cpuHard() {
  var bestScore = -Infinity;
  var bestMove = -1;
  for (var i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = 'O';
    var s = minimax(board, 0, false);
    board[i] = '';
    if (s > bestScore) { bestScore = s; bestMove = i; }
  }
  return bestMove;
}

function minimax(b, depth, isMax) {
  if (checkWin('O')) return 10 - depth;
  if (checkWin('X')) return depth - 10;
  if (b.every(function(c) { return c; })) return 0;
  if (isMax) {
    var best = -Infinity;
    for (var i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = 'O';
      best = Math.max(best, minimax(b, depth + 1, false));
      b[i] = '';
    }
    return best;
  } else {
    var best = Infinity;
    for (var i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = 'X';
      best = Math.min(best, minimax(b, depth + 1, true));
      b[i] = '';
    }
    return best;
  }
}

function findWinningMove(mark) {
  for (var i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = mark;
    if (checkWin(mark)) { board[i] = ''; return i; }
    board[i] = '';
  }
  return -1;
}

function setStatus(html) {
  document.getElementById('status').innerHTML = html;
}

function updateScores() {
  document.getElementById('score-x').textContent = scores.X;
  document.getElementById('score-o').textContent = scores.O;
  document.getElementById('score-draw').textContent = scores.draw;
}

function resetGame() {
  board = Array(9).fill('');
  current = 'X';
  gameOver = false;
  initBoard();
  setStatus('<span class="mark-x">X</span> の番です');
}
