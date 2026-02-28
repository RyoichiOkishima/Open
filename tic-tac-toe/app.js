var board = Array(9).fill('');
var current = 'X';
var gameOver = false;
var mode = 'cpu';
var playerMark = 'X';
var cpuMark = 'O';
var scores = { X: 0, O: 0, draw: 0 };
var winStreak = 0;
var isBossRound = false;
var lastBossLevel = 0;
var soundOn = true;
var hapticOn = loadHapticSetting();
var stats = migrateStats(loadStats());

var WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

var MAX_LEVEL = 100;
var lastXpGain = 0;
var lastBaseXp = 0;
var lastStreakBonus = 0;
var lastTimeBonus = 0;
var lastElapsed = 0;
var lastIsBoss = false;
var audioCtx = null;
var gameStartTime = 0;
var timerInterval = null;

// === Haptic feedback ===
var hapticSupported = !!navigator.vibrate;

function loadHapticSetting() {
  try { return localStorage.getItem('tictactoe_haptic') !== 'off'; } catch(e) { return true; }
}

function initHaptic() {
  var btn = document.querySelector('.pause-item[onclick="toggleHaptic()"]');
  if (!hapticSupported && btn) {
    btn.style.opacity = '0.4';
    btn.style.pointerEvents = 'none';
    document.getElementById('haptic-label').textContent = '振動 非対応';
    document.getElementById('haptic-icon').textContent = '📴';
  }
}

function toggleHaptic() {
  if (!hapticSupported) return;
  hapticOn = !hapticOn;
  try { localStorage.setItem('tictactoe_haptic', hapticOn ? 'on' : 'off'); } catch(e) {}
  document.getElementById('haptic-icon').textContent = hapticOn ? '📳' : '📴';
  document.getElementById('haptic-label').textContent = hapticOn ? '振動 ON' : '振動 OFF';
  if (hapticOn) haptic();
}

function haptic() {
  if (!hapticOn || !hapticSupported) return;
  navigator.vibrate(30);
}

function hapticStrong() {
  if (!hapticOn || !hapticSupported) return;
  navigator.vibrate([40, 30, 40]);
}

function hapticHeavy() {
  if (!hapticOn || !hapticSupported) return;
  navigator.vibrate([60, 40, 60, 40, 60]);
}

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

// === BGM (Web Audio API looping arpeggio) ===
var bgmTimer = null;
var bgmPlaying = false;
var bgmGain = null;

function bgmLoop(notes, tempo, vol) {
  if (bgmPlaying) return;
  var ctx = getAudioCtx();
  bgmGain = ctx.createGain();
  bgmGain.gain.value = vol;
  bgmGain.connect(ctx.destination);
  bgmPlaying = true;
  var step = 0;
  var beatMs = (60 / tempo) * 1000;

  function tick() {
    if (!bgmPlaying) return;
    var note = notes[step % notes.length];
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    var t = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.value = note;
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + beatMs / 1200);
    osc.connect(g);
    g.connect(bgmGain);
    osc.start(t);
    osc.stop(t + beatMs / 1000 + 0.05);
    step++;
    bgmTimer = setTimeout(tick, beatMs);
  }
  tick();
}

function startBgm() {
  if (!soundOn || bgmPlaying) return;
  // C major pentatonic arpeggio (C4 E4 G4 C5 G4 E4)
  var notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
  bgmLoop(notes, 100, 0.06);
}

function startBossBgm() {
  if (!soundOn || bgmPlaying) return;
  // A minor pattern (A3 C4 E4 A4 E4 C4 B3 E4)
  var notes = [220.00, 261.63, 329.63, 440.00, 329.63, 261.63, 246.94, 329.63];
  bgmLoop(notes, 140, 0.07);
}

function stopBgm() {
  if (!bgmPlaying) return;
  bgmPlaying = false;
  if (bgmTimer) { clearTimeout(bgmTimer); bgmTimer = null; }
  if (bgmGain) {
    var g = bgmGain;
    var now = getAudioCtx().currentTime;
    g.gain.linearRampToValueAtTime(0, now + 0.3);
    setTimeout(function() { try { g.disconnect(); } catch(e) {} }, 400);
    bgmGain = null;
  }
}

// === Timer ===
var pausedElapsed = 0;

function startTimer() {
  pausedElapsed = 0;
  gameStartTime = Date.now();
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function pauseTimer() {
  if (!timerInterval) return;
  pausedElapsed += (Date.now() - gameStartTime) / 1000;
  clearInterval(timerInterval);
  timerInterval = null;
}

function resumeTimer() {
  if (timerInterval) return;
  gameStartTime = Date.now();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function getElapsedSeconds() {
  return pausedElapsed + (Date.now() - gameStartTime) / 1000;
}

function updateTimerDisplay() {
  var el = document.getElementById('timer');
  if (el) el.textContent = Math.floor(getElapsedSeconds()) + 's';
}

// === localStorage persistence ===
function loadStats() {
  try {
    var saved = localStorage.getItem('tictactoe_stats');
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return { cpuWins: 0, cpuLosses: 0, cpuDraws: 0, xp: 0 };
}

function migrateStats(s) {
  if (s.xp === undefined) {
    s.xp = s.cpuWins * 10;
  }
  return s;
}

function saveStats() {
  try {
    localStorage.setItem('tictactoe_stats', JSON.stringify(stats));
  } catch(e) {}
}

// === Level system ===
function getLevelThreshold(n) {
  return Math.floor(10 * Math.pow(n - 1, 1.5));
}

function getLevel() {
  for (var i = MAX_LEVEL; i >= 1; i--) {
    if (stats.xp >= getLevelThreshold(i)) return i;
  }
  return 1;
}

function getLevelProgress() {
  var level = getLevel();
  if (level >= MAX_LEVEL) return { percent: 100, remaining: 0 };
  var cur = stats.xp - getLevelThreshold(level);
  var needed = getLevelThreshold(level + 1) - getLevelThreshold(level);
  return {
    percent: Math.floor((cur / needed) * 100),
    remaining: getLevelThreshold(level + 1) - stats.xp
  };
}

function getXpReward() {
  var level = getLevel();
  if (level <= 20) return 10;
  if (level <= 50) return 20;
  return 30;
}

function getCpuDifficulty() {
  var level = getLevel();
  if (level <= 20) return 'easy';
  if (level <= 50) return 'normal';
  return 'hard';
}

function getStreakMultiplier() {
  if (winStreak < 3) return 1;
  return Math.min(1 + (winStreak - 2) * 0.5, 3);
}

function getTimeBonus(baseXp, seconds) {
  if (seconds < 10) return Math.floor(baseXp * 0.5);
  if (seconds < 20) return Math.floor(baseXp * 0.25);
  return 0;
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
  var overlay = document.getElementById('pause-overlay');
  var opening = !overlay.classList.contains('open');
  overlay.classList.toggle('open');
  if (opening) {
    pauseTimer();
  } else {
    if (!gameOver) resumeTimer();
  }
}

function pauseRestart() {
  togglePause();
  scores = { X: 0, O: 0, draw: 0 };
  winStreak = 0;
  lastBossLevel = 0;
  updateScores();
  resetGame();
  updateModeLabel();
}

function pauseModeSelect() {
  togglePause();
  stopTimer();
  stopBgm();
  showScreen('screen-mode');
}

function toggleSound() {
  soundOn = !soundOn;
  document.getElementById('sound-icon').textContent = soundOn ? '🔊' : '🔇';
  document.getElementById('sound-label').textContent = soundOn ? '音量 ON' : '音量 OFF';
  if (!soundOn) {
    stopBgm();
  } else if (!gameOver) {
    if (isBossRound) { startBossBgm(); } else { startBgm(); }
  }
}

// === Death penalty ===
function showDeathPenalty(callback) {
  var gameScreen = document.getElementById('screen-game');
  gameScreen.classList.add('death-penalty');
  setTimeout(function() {
    gameScreen.classList.remove('death-penalty');
    callback();
  }, 1200);
}

// === Boss intro ===
function showBossIntro(callback) {
  var overlay = document.getElementById('boss-intro-overlay');
  var levelEl = document.getElementById('boss-intro-level');
  levelEl.textContent = 'Lv.' + Math.min(getLevel() + 20, 100);
  overlay.classList.add('show');
  hapticHeavy();
  setTimeout(function() {
    overlay.classList.remove('show');
    callback();
  }, 2200);
}

// === Coin toss ===
function sfxCoinSpin() {
  if (!soundOn) return;
  var ctx = getAudioCtx();
  // Metallic clinks that decelerate with the coin
  var ticks = 12;
  for (var i = 0; i < ticks; i++) {
    // Interval grows as coin slows: starts fast, ends slow
    var t = (i * (i + 1)) / (ticks * 2.5);
    var freq = 2800 + Math.random() * 1200 - i * 80;
    var vol = 0.08 - i * 0.004;
    playTone(freq, t, 0.04, 'sine', Math.max(vol, 0.01));
    // Subtle lower harmonic
    playTone(freq * 0.5, t, 0.03, 'triangle', Math.max(vol * 0.4, 0.005));
  }
  // Final landing clink
  playTone(3200, 1.9, 0.08, 'sine', 0.1);
  playTone(1600, 1.92, 0.12, 'triangle', 0.06);
}

function showCoinToss(mark, callback) {
  var overlay = document.getElementById('coin-toss-overlay');
  var inner = document.getElementById('coin-inner');
  var label = document.getElementById('coin-toss-label');
  var result = document.getElementById('coin-result');

  label.textContent = 'コイントス...';
  result.textContent = '';
  result.classList.remove('visible');
  inner.style.transition = 'none';
  inner.style.transform = 'rotateY(0deg)';

  overlay.classList.add('show');
  sfxCoinSpin();

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      inner.style.transition = 'transform 2s cubic-bezier(0.22, 1, 0.36, 1)';
      // X = front face (0deg), O = back face (180deg)
      var deg = mark === 'X' ? 1080 : 1260;
      inner.style.transform = 'rotateY(' + deg + 'deg)';
    });
  });

  setTimeout(function() {
    result.textContent = 'あなたは ' + mark + ' !';
    result.classList.add('visible');
  }, 2200);

  setTimeout(function() {
    overlay.classList.remove('show');
    callback();
  }, 3200);
}

// === Game ===
function startGame(m) {
  mode = m;
  scores = { X: 0, O: 0, draw: 0 };
  winStreak = 0;
  resetGame();
}

function getOpponentLabel() {
  return isBossRound ? '👹BOSS' : 'CPU';
}

function updateModeLabel() {
  var levelEl = document.getElementById('level-indicator');
  if (mode === 'cpu') {
    var label = 'vs ' + getOpponentLabel() + ' (あなた: ' + playerMark + ')';
    document.getElementById('mode-label').textContent = label;
    if (isBossRound) {
      levelEl.textContent = 'BOSS Lv.' + Math.min(getLevel() + 20, 100);
    } else {
      levelEl.textContent = 'Lv.' + getLevel();
    }
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
  if (mode === 'cpu' && current === cpuMark) return;
  makeMove(idx);
  if (mode === 'cpu' && !gameOver && current === cpuMark) {
    setTimeout(cpuMove, 500);
  }
}

function makeMove(idx) {
  board[idx] = current;
  var cells = document.querySelectorAll('.cell');
  cells[idx].textContent = current;
  cells[idx].classList.add('taken', current.toLowerCase());
  sfxPlace(current);
  haptic();

  var winLine = checkWin(current);
  if (winLine) {
    gameOver = true;
    stopTimer();
    stopBgm();
    lastElapsed = getElapsedSeconds();
    winLine.forEach(function(i) { cells[i].classList.add('win'); });
    scores[current]++;
    updateScores();
    if (mode === 'cpu') {
      lastIsBoss = isBossRound;
      if (current === playerMark) {
        winStreak++;
        lastBaseXp = getXpReward();
        if (isBossRound) lastBaseXp *= 2;
        var multiplier = getStreakMultiplier();
        lastStreakBonus = Math.floor(lastBaseXp * multiplier) - lastBaseXp;
        lastTimeBonus = getTimeBonus(lastBaseXp, lastElapsed);
        lastXpGain = lastBaseXp + lastStreakBonus + lastTimeBonus;
        stats.xp += lastXpGain;
        stats.cpuWins++;
        sfxWin();
        hapticStrong();
      } else {
        var penalty = Math.floor(getXpReward() * 0.3);
        lastBaseXp = -penalty;
        lastStreakBonus = 0;
        lastTimeBonus = 0;
        lastXpGain = -penalty;
        stats.xp = Math.max(0, stats.xp - penalty);
        winStreak = 0;
        stats.cpuLosses++;
        sfxLose();
        hapticHeavy();
      }
      saveStats();
    } else {
      sfxWin();
      hapticStrong();
    }
    if (mode === 'cpu') {
      var opp = getOpponentLabel();
      setStatus(current === playerMark ? 'あなた の勝ち!' : opp + ' の勝ち!');
    } else {
      setStatus(getMarkSpan(current) + ' の勝ち!');
    }
    if (mode === 'cpu' && current === cpuMark) {
      showDeathPenalty(function() { showResult(current); });
    } else {
      setTimeout(function() { showResult(current); }, 800);
    }
    return;
  }

  if (board.every(function(c) { return c; })) {
    gameOver = true;
    stopTimer();
    stopBgm();
    lastElapsed = getElapsedSeconds();
    scores.draw++;
    updateScores();
    if (mode === 'cpu') {
      lastIsBoss = isBossRound;
      var drawXp = Math.floor(getXpReward() * 0.2);
      lastBaseXp = drawXp;
      lastStreakBonus = 0;
      lastTimeBonus = 0;
      lastXpGain = drawXp;
      stats.xp += drawXp;
      winStreak = 0;
      stats.cpuDraws++;
      saveStats();
    }
    sfxDraw();
    hapticStrong();
    setStatus('引き分け!');
    setTimeout(function() { showResult(null); }, 800);
    return;
  }

  current = current === 'X' ? 'O' : 'X';
  if (mode === 'cpu') {
    var opp = getOpponentLabel();
    setStatus(current === playerMark ? 'あなたの番です' : opp + 'の番です');
  } else {
    setStatus(getMarkSpan(current) + ' の番です');
  }
}

function getMarkSpan(mark) {
  return '<span class="mark-' + mark.toLowerCase() + '">' + mark + '</span>';
}

function showResult(winner) {
  var icon = document.getElementById('result-icon');
  var text = document.getElementById('result-text');
  var timeEl = document.getElementById('result-time');

  timeEl.textContent = Math.floor(lastElapsed) + '秒';

  if (mode === 'cpu') {
    if (winner === playerMark) {
      icon.textContent = lastIsBoss ? '👹' : '🎉';
      text.textContent = lastIsBoss ? 'BOSS を倒した!' : 'あなた の勝ち!';
    } else if (winner === cpuMark) {
      icon.textContent = lastIsBoss ? '👹' : '😢';
      text.textContent = lastIsBoss ? 'BOSS に負けた...' : 'CPU の勝ち!';
    } else {
      icon.textContent = lastIsBoss ? '👹' : '🤝';
      text.textContent = lastIsBoss ? 'BOSS と引き分け!' : '引き分け!';
    }
  } else {
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
  }

  if (mode === 'cpu') {
    var oppLabel = lastIsBoss ? 'BOSS' : 'CPU';
    document.getElementById('rs-x-label').textContent = playerMark === 'X' ? 'あなた' : oppLabel;
    document.getElementById('rs-o-label').textContent = playerMark === 'O' ? 'あなた' : oppLabel;
  } else {
    document.getElementById('rs-x-label').textContent = 'X';
    document.getElementById('rs-o-label').textContent = 'O';
  }
  document.getElementById('rs-x').textContent = scores.X;
  document.getElementById('rs-o').textContent = scores.O;
  document.getElementById('rs-draw').textContent = scores.draw;

  var levelSection = document.getElementById('level-section');
  var xpEl = document.getElementById('result-xp');
  var bonusEl = document.getElementById('result-bonus');
  if (mode === 'cpu') {
    levelSection.classList.add('visible');
    if (lastXpGain > 0) {
      xpEl.textContent = '+' + lastXpGain + ' XP';
      xpEl.className = 'result-xp';
      xpEl.style.display = '';
    } else if (lastXpGain < 0) {
      xpEl.textContent = lastXpGain + ' XP';
      xpEl.className = 'result-xp penalty';
      xpEl.style.display = '';
    } else {
      xpEl.style.display = 'none';
      xpEl.className = 'result-xp';
    }
    if ((lastStreakBonus > 0 || lastTimeBonus > 0 || lastIsBoss) && lastXpGain > 0) {
      var parts = [];
      if (lastIsBoss) parts.push('BOSS x2');
      if (lastStreakBonus > 0) parts.push(winStreak + '連勝 +' + lastStreakBonus);
      if (lastTimeBonus > 0) parts.push('速攻 +' + lastTimeBonus);
      bonusEl.textContent = parts.join(' / ');
      bonusEl.style.display = '';
    } else {
      bonusEl.style.display = 'none';
    }
    var level = getLevel();
    var progress = getLevelProgress();
    document.getElementById('result-level').textContent = level;
    document.getElementById('result-bar').style.width = progress.percent + '%';
    if (progress.remaining > 0) {
      document.getElementById('result-info').textContent =
        '次のレベルまで あと' + progress.remaining + ' XP';
    } else {
      document.getElementById('result-info').textContent = 'MAX LEVEL!';
    }
    var total = stats.cpuWins + stats.cpuLosses + stats.cpuDraws;
    document.getElementById('result-record').textContent =
      '通算 ' + total + '戦 ' + stats.cpuWins + '勝 ' + stats.cpuLosses + '敗 ' + stats.cpuDraws + '分 (累計 ' + stats.xp + ' XP)';
  } else {
    levelSection.classList.remove('visible');
  }
  showScreen('screen-result');
}

function continueGame() {
  resetGame();
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
// Lv1: 1% minimax / 1% strategy / 98% random
// Lv50: 50% minimax / 50% strategy / 0% random
// Lv100: 100% minimax (perfect play)
// BOSS: level + 20 (capped at 100)
function cpuMove() {
  var level = getLevel();
  if (isBossRound) level = Math.min(level + 20, 100);
  var roll = Math.random() * 100;
  var move;
  if (roll < level) {
    move = cpuHard();
  } else if (roll < Math.min(level * 2, 100)) {
    move = cpuNormal();
  } else {
    move = cpuEasy();
  }
  makeMove(move);
}

function cpuEasy() {
  var empty = board.map(function(v,i) { return v ? -1 : i; }).filter(function(i) { return i >= 0; });
  return empty[Math.floor(Math.random() * empty.length)];
}

function cpuNormal() {
  var move = findWinningMove(cpuMark);
  if (move === -1) move = findWinningMove(playerMark);
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
    board[i] = cpuMark;
    var s = minimax(board, 0, false);
    board[i] = '';
    if (s > bestScore) { bestScore = s; bestMove = i; }
  }
  return bestMove;
}

function minimax(b, depth, isMax) {
  if (checkWin(cpuMark)) return 10 - depth;
  if (checkWin(playerMark)) return depth - 10;
  if (b.every(function(c) { return c; })) return 0;
  if (isMax) {
    var best = -Infinity;
    for (var i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = cpuMark;
      best = Math.max(best, minimax(b, depth + 1, false));
      b[i] = '';
    }
    return best;
  } else {
    var best = Infinity;
    for (var i = 0; i < 9; i++) {
      if (b[i]) continue;
      b[i] = playerMark;
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
  if (mode === 'cpu') {
    var oppLabel = isBossRound ? 'BOSS' : 'CPU';
    document.getElementById('score-x-label').textContent = playerMark === 'X' ? 'あなた' : oppLabel;
    document.getElementById('score-o-label').textContent = playerMark === 'O' ? 'あなた' : oppLabel;
  } else {
    document.getElementById('score-x-label').textContent = 'X';
    document.getElementById('score-o-label').textContent = 'O';
  }
  document.getElementById('score-x').textContent = scores.X;
  document.getElementById('score-o').textContent = scores.O;
  document.getElementById('score-draw').textContent = scores.draw;
}

function resetGame() {
  stopBgm();
  stopTimer();

  if (mode === 'cpu') {
    playerMark = Math.random() < 0.5 ? 'X' : 'O';
    cpuMark = playerMark === 'X' ? 'O' : 'X';
    showCoinToss(playerMark, function() {
      setupBoard();
    });
  } else {
    setupBoard();
  }
}

function setupBoard() {
  board = Array(9).fill('');
  current = 'X';
  gameOver = false;
  var lv = getLevel();
  isBossRound = mode === 'cpu' && lv > 0 && lv % 5 === 0 && lastBossLevel < lv;
  if (isBossRound) lastBossLevel = lv;
  initBoard();
  var bodyEl = document.querySelector('.game-body');
  if (bodyEl) {
    if (isBossRound) {
      bodyEl.classList.add('boss');
    } else {
      bodyEl.classList.remove('boss');
    }
  }
  updateScores();
  updateModeLabel();
  showScreen('screen-game');

  if (isBossRound) {
    setStatus('');
    showBossIntro(function() {
      startBossBgm();
      startTimer();
      var opp = getOpponentLabel();
      setStatus(current === playerMark ? 'あなたの番です' : opp + 'の番です');
      if (current === cpuMark) {
        setTimeout(cpuMove, 500);
      }
    });
  } else {
    startBgm();
    startTimer();
    if (mode === 'cpu') {
      var opp = getOpponentLabel();
      setStatus(current === playerMark ? 'あなたの番です' : opp + 'の番です');
      if (current === cpuMark) {
        setTimeout(cpuMove, 500);
      }
    } else {
      setStatus('<span class="mark-x">X</span> の番です');
    }
  }
}

initHaptic();
