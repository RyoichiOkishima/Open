var board = Array(9).fill('');
var current = 'X';
var gameOver = false;
var mode = 'cpu';
var scores = { X: 0, O: 0, draw: 0 };
var soundOn = true;
var stats = loadStats();

var WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

var LEVEL_THRESHOLDS = [0, 2, 5, 10, 15, 25, 35, 50, 70, 100];
var audioCtx = null;

// === Sound effects (Web Audio API) ===
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, start, duration, type, vol) {
  var ctx = getAudioCtx();
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration);
}

function sfxPlace(mark) {
  if (!soundOn) return;
  playTone(mark === 'X' ? 660 : 520, 0, 0.08, 'sine', 0.15);
}

function sfxWin() {
  if (!soundOn) return;
  playTone(523, 0, 0.15, 'sine', 0.25);
  playTone(659, 0.12, 0.15, 'sine', 0.25);
  playTone(784, 0.24, 0.25, 'sine', 0.25);
  playTone(1047, 0.44, 0.35, 'triangle', 0.2);
}

function sfxLose() {
  if (!soundOn) return;
  playTone(440, 0, 0.2, 'sine', 0.2);
  playTone(349, 0.18, 0.2, 'sine', 0.2);
  playTone(294, 0.36, 0.35, 'sine', 0.2);
}

function sfxDraw() {
  if (!soundOn) return;
  playTone(440, 0, 0.12, 'triangle', 0.15);
  playTone(440, 0.18, 0.12, 'triangle', 0.15);
}

// === localStorage persistence ===
function loadStats() {
  try {
    var saved = localStorage.getItem('tictactoe_stats');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return { cpuWins: 0, cpuLosses: 0, cpuDraws: 0 };
}

function saveStats() {
  try {
    localStorage.setItem('tictactoe_stats', JSON.stringify(stats));
  } catch(e) {}
}

// === Level system ===
function getLevel() {
  var wins = stats.cpuWins;
  for (var i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (wins >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

function getLevelProgress() {
  var level = getLevel();
  if (level > LEVEL_THRESHOLDS.length) return { percent: 100, remaining: 0 };
  if (level >= LEVEL_THRESHOLDS.length) return { percent: 100, remaining: 0 };
  var cur = stats.cpuWins - LEVEL_THRESHOLDS[level - 1];
  var needed = LEVEL_THRESHOLDS[level] - LEVEL_THRESHOLDS[level - 1];
  return {
    percent: Math.floor((cur / needed) * 100),
    remaining: LEVEL_THRESHOLDS[level] - stats.cpuWins
  };
}

function getCpuDifficulty() {
  var level = getLevel();
  if (level <= 2) return 'easy';
  if (level <= 5) return 'normal';
  return 'hard';
}

// === Screen navigation ===
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
}

// === Pause menu ===
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

// === Game ===
function startGame(m) {
  mode = m;
  scores = { X: 0, O: 0, draw: 0 };
  updateScores();
  updateModeLabel();
  resetGame();
  showScreen('screen-game');
}

function updateModeLabel() {
  var levelEl = document.getElementById('level-indicator');
  if (mode === 'cpu') {
    document.getElementById('mode-label').textContent = 'vs CPU';
    levelEl.textContent = 'Lv.' + getLevel();
    levelEl.style.display = '';
  } else {
    document.getElementById('mode-label').textContent = '2人対戦';
    levelEl.style.display = 'none';
  }
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
  sfxPlace(current);

  var winLine = checkWin(current);
  if (winLine) {
    gameOver = true;
    winLine.forEach(function(i) { cells[i].classList.add('win'); });
    scores[current]++;
    updateScores();
    if (mode === 'cpu') {
      if (current === 'X') { stats.cpuWins++; sfxWin(); }
      else { stats.cpuLosses++; sfxLose(); }
      saveStats();
    } else {
      sfxWin();
    }
    setStatus('<span class="mark-' + current.toLowerCase() + '">' + current + '</span> の勝ち!');
    setTimeout(function() { showResult(current); }, 800);
    return;
  }

  if (board.every(function(c) { return c; })) {
    gameOver = true;
    scores.draw++;
    updateScores();
    if (mode === 'cpu') {
      stats.cpuDraws++;
      saveStats();
    }
    sfxDraw();
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

  var levelSection = document.getElementById('level-section');
  if (mode === 'cpu') {
    levelSection.classList.add('visible');
    var level = getLevel();
    var progress = getLevelProgress();
    document.getElementById('result-level').textContent = level;
    document.getElementById('result-bar').style.width = progress.percent + '%';
    if (progress.remaining > 0) {
      document.getElementById('result-info').textContent =
        '次のレベルまで あと' + progress.remaining + '勝';
    } else {
      document.getElementById('result-info').textContent = 'MAX LEVEL!';
    }
    var total = stats.cpuWins + stats.cpuLosses + stats.cpuDraws;
    document.getElementById('result-record').textContent =
      '通算 ' + total + '戦 ' + stats.cpuWins + '勝 ' + stats.cpuLosses + '敗 ' + stats.cpuDraws + '分';
  } else {
    levelSection.classList.remove('visible');
  }
  showScreen('screen-result');
}

function continueGame() {
  updateModeLabel();
  resetGame();
  showScreen('screen-game');
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

// === CPU AI (auto-adjusts to user level) ===
function cpuMove() {
  var diff = getCpuDifficulty();
  var move;
  if (diff === 'easy') {
    move = cpuEasy();
  } else if (diff === 'hard') {
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
