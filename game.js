(() => {
  'use strict';

  /* ============================================================
     Configuração
  ============================================================ */
  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30;
  const BOARD_W = COLS * BLOCK;
  const BOARD_H = ROWS * BLOCK;
  const NEXT_COUNT = 3;

  const LOCK_DELAY = 500;
  const MAX_LOCK_RESETS = 15;
  const DAS_DELAY = 150;
  const ARR = 45;
  const SOFT_DROP_INTERVAL = 28;
  const CLEAR_FLASH = 140;

  const NEXT_W = 132;
  const NEXT_H = 240;
  const HOLD_W = 132;
  const HOLD_H = 80;

  const SCORES_KEY = 'tetris.highscores.v1';
  const SOUND_KEY = 'tetris.muted.v1';

  const GRAVITY = [0, 800, 717, 633, 550, 467, 383, 300, 217, 150, 110, 90, 75, 62, 50, 42, 36, 30, 26, 22, 20];

  const COLORS = {
    I: { base: '#22d3ee', light: '#a5f3fc', dark: '#0e7490' },
    J: { base: '#3b82f6', light: '#bfdbfe', dark: '#1e40af' },
    L: { base: '#f97316', light: '#fed7aa', dark: '#9a3412' },
    O: { base: '#facc15', light: '#fef08a', dark: '#a16207' },
    S: { base: '#22c55e', light: '#bbf7d0', dark: '#15803d' },
    T: { base: '#a855f7', light: '#e9d5ff', dark: '#6b21a8' },
    Z: { base: '#ef4444', light: '#fecaca', dark: '#991b1b' },
  };

  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
  };

  // Tabelas de wall kick do SRS, já convertidas para coordenadas de tela (y para baixo)
  const KICKS = {
    normal: {
      '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
      '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
      '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
      '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
      '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
      '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
      '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    },
    I: {
      '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
      '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
      '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
      '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
      '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
      '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
      '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
      '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
    },
  };

  /* ============================================================
     DOM
  ============================================================ */
  const $ = (id) => document.getElementById(id);

  const scoreEl = $('score');
  const levelEl = $('level');
  const linesEl = $('lines');
  const bestEl = $('best');
  const soundBtn = $('sound-btn');
  const pauseBtn = $('pause-btn');
  const overlay = $('overlay');
  const overlayEyebrow = $('overlay-eyebrow');
  const overlayTitle = $('overlay-title');
  const overlayText = $('overlay-text');
  const overlayBtn = $('overlay-btn');
  const overlayHint = $('overlay-hint');
  const leaderboardEl = $('leaderboard');
  const leaderboardEmpty = $('leaderboard-empty');

  const ICONS = {
    soundOn:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    soundOff:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><line x1="16" y1="9" x2="22" y2="15"/><line x1="22" y1="9" x2="16" y2="15"/></svg>',
    pause:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
    play:
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.87l10-6.5a1 1 0 0 0 0-1.74l-10-6.5A1 1 0 0 0 8 5.5z"/></svg>',
  };

  function setupCanvas(canvas, width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  const boardCtx = setupCanvas($('board-canvas'), BOARD_W, BOARD_H);
  const nextCtx = setupCanvas($('next-canvas'), NEXT_W, NEXT_H);
  const holdCtx = setupCanvas($('hold-canvas'), HOLD_W, HOLD_H);

  /* ============================================================
     Estado
  ============================================================ */
  const state = {
    board: createBoard(),
    current: null,
    queue: [],
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    best: 0,
    combo: 0,
    status: 'start', // start | playing | paused | clearing | over
    prevStatus: 'playing',
    dropTimer: 0,
    lockTimer: 0,
    lockResets: 0,
    dasDir: 0,
    dasTimer: 0,
    clearTimer: 0,
    flashRows: [],
    particles: [],
    scores: [],
    bag: [],
  };

  const held = { left: false, right: false, down: false };

  /* ============================================================
     Utilitários
  ============================================================ */
  const numberFormat = new Intl.NumberFormat('pt-BR');
  const formatNumber = (n) => numberFormat.format(Math.round(n));

  function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function rotateMatrixCW(matrix) {
    const n = matrix.length;
    return matrix[0].map((_, c) => matrix.map((row) => row[c]).reverse());
  }

  function rotateMatrixCCW(matrix) {
    return rotateMatrixCW(rotateMatrixCW(rotateMatrixCW(matrix)));
  }

  function collides(matrix, x, y) {
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        const bx = x + c;
        const by = y + r;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && state.board[by][bx]) return true;
      }
    }
    return false;
  }

  function gravityForLevel(level) {
    return GRAVITY[Math.min(level, GRAVITY.length - 1)] || 800;
  }

  function hexToRgba(hex, alpha) {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function bump(el) {
    el.classList.remove('is-bump');
    void el.offsetWidth;
    el.classList.add('is-bump');
  }

  function safeGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      /* armazenamento indisponível — segue o jogo */
    }
  }

  /* ============================================================
     Recordes (localStorage)
  ============================================================ */
  function loadScores() {
    try {
      const parsed = JSON.parse(safeGet(SCORES_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry) => entry && Number.isFinite(Number(entry.score)) && Number(entry.score) >= 0)
        .map((entry) => ({
          score: Math.round(Number(entry.score)),
          lines: Math.max(0, Math.round(Number(entry.lines) || 0)),
          level: Math.max(1, Math.round(Number(entry.level) || 1)),
          date: Number(entry.date) || Date.now(),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (_) {
      return [];
    }
  }

  function saveScore(score, lines, level) {
    const scores = loadScores();
    scores.push({ score, lines, level, date: Date.now() });
    scores.sort((a, b) => b.score - a.score);
    const trimmed = scores.slice(0, 10);
    safeSet(SCORES_KEY, JSON.stringify(trimmed));
    state.scores = trimmed;
    state.best = Math.max(state.best, trimmed[0] ? trimmed[0].score : 0);
    return trimmed;
  }

  function renderLeaderboard() {
    leaderboardEl.innerHTML = '';

    if (!state.scores.length) {
      leaderboardEmpty.hidden = false;
      return;
    }

    leaderboardEmpty.hidden = true;

    state.scores.slice(0, 5).forEach((entry, index) => {
      const row = document.createElement('li');
      row.className = 'leaderboard__row' + (index === 0 ? ' leaderboard__row--top' : '');
      row.title = new Date(entry.date).toLocaleString('pt-BR');

      const rank = document.createElement('span');
      rank.className = 'leaderboard__rank';
      rank.textContent = String(index + 1);

      const score = document.createElement('span');
      score.className = 'leaderboard__score';
      score.textContent = formatNumber(entry.score);

      const meta = document.createElement('span');
      meta.className = 'leaderboard__meta';
      meta.textContent = 'Nv ' + entry.level;

      row.append(rank, score, meta);
      leaderboardEl.appendChild(row);
    });
  }

  /* ============================================================
     Áudio
  ============================================================ */
  let audioCtx = null;
  let muted = safeGet(SOUND_KEY) === 'off';

  function ensureAudio() {
    if (!audioCtx) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (AudioCtor) audioCtx = new AudioCtor();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function tone(freq, duration, options) {
    if (!audioCtx) return;
    const opts = options || {};
    const type = opts.type || 'square';
    const volume = opts.volume === undefined ? 0.03 : opts.volume;
    const delay = opts.delay || 0;

    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (opts.to) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), start + duration);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function playSound(name) {
    if (muted || !audioCtx) return;

    switch (name) {
      case 'move':
        tone(200, 0.035, { type: 'square', volume: 0.016 });
        break;
      case 'rotate':
        tone(340, 0.05, { type: 'triangle', volume: 0.028 });
        break;
      case 'lock':
        tone(120, 0.07, { type: 'sine', volume: 0.04, to: 80 });
        break;
      case 'drop':
        tone(240, 0.09, { type: 'sawtooth', volume: 0.024, to: 90 });
        break;
      case 'hold':
        tone(420, 0.06, { type: 'triangle', volume: 0.028 });
        break;
      case 'clear':
        tone(523, 0.09, { type: 'triangle', volume: 0.035 });
        tone(659, 0.09, { type: 'triangle', volume: 0.03, delay: 0.06 });
        break;
      case 'tetris':
        [523, 659, 784, 1047].forEach((freq, i) => {
          tone(freq, 0.12, { type: 'triangle', volume: 0.036, delay: i * 0.07 });
        });
        break;
      case 'levelup':
        [392, 523, 659, 784].forEach((freq, i) => {
          tone(freq, 0.1, { type: 'square', volume: 0.022, delay: i * 0.06 });
        });
        break;
      case 'gameover':
        [392, 330, 262, 196].forEach((freq, i) => {
          tone(freq, 0.22, { type: 'sawtooth', volume: 0.03, delay: i * 0.15, to: freq * 0.85 });
        });
        break;
      default:
        break;
    }
  }

  /* ============================================================
     Desenho
  ============================================================ */
  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawBlock(ctx, px, py, size, type, options) {
    const opts = options || {};
    const palette = COLORS[type];
    if (!palette) return;

    const pad = Math.max(1.5, size * 0.06);
    const x = px + pad;
    const y = py + pad;
    const s = size - pad * 2;
    const r = Math.max(2, size * 0.15);

    ctx.save();
    if (opts.glow) {
      ctx.shadowColor = hexToRgba(palette.base, 0.65);
      ctx.shadowBlur = size * 0.45;
    }

    roundRect(ctx, x, y, s, s, r);
    ctx.fillStyle = palette.base;
    ctx.fill();
    ctx.restore();

    // Brilho superior
    roundRect(ctx, x + s * 0.16, y + s * 0.12, s * 0.68, s * 0.2, s * 0.1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.fill();

    // Sombra inferior
    roundRect(ctx, x + s * 0.14, y + s * 0.7, s * 0.72, s * 0.18, s * 0.09);
    ctx.fillStyle = hexToRgba(palette.dark, 0.55);
    ctx.fill();

    // Contorno
    roundRect(ctx, x, y, s, s, r);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawGhostBlock(ctx, px, py, size, type) {
    const palette = COLORS[type];
    if (!palette) return;

    const pad = Math.max(2, size * 0.09);
    roundRect(ctx, px + pad, py + pad, size - pad * 2, size - pad * 2, size * 0.14);
    ctx.fillStyle = hexToRgba(palette.base, 0.1);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(palette.base, 0.55);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawPiecePreview(ctx, type, x, y, w, h, cell, alpha) {
    const matrix = SHAPES[type];
    if (!matrix) return;

    let minRow = 99;
    let maxRow = -1;
    let minCol = 99;
    let maxCol = -1;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (!matrix[r][c]) continue;
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }

    if (maxRow < 0) return;

    const pieceW = (maxCol - minCol + 1) * cell;
    const pieceH = (maxRow - minRow + 1) * cell;
    const originX = x + (w - pieceW) / 2;
    const originY = y + (h - pieceH) / 2;

    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (!matrix[r][c]) continue;
        drawBlock(
          ctx,
          originX + (c - minCol) * cell,
          originY + (r - minRow) * cell,
          cell,
          type,
          { glow: true }
        );
      }
    }

    ctx.restore();
  }

  function renderBoard() {
    const ctx = boardCtx;

    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    const background = ctx.createLinearGradient(0, 0, 0, BOARD_H);
    background.addColorStop(0, '#0b1222');
    background.addColorStop(0.5, '#080d19');
    background.addColorStop(1, '#050811');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 1; x < COLS; x++) {
      ctx.moveTo(x * BLOCK + 0.5, 0);
      ctx.lineTo(x * BLOCK + 0.5, BOARD_H);
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.moveTo(0, y * BLOCK + 0.5);
      ctx.lineTo(BOARD_W, y * BLOCK + 0.5);
    }
    ctx.stroke();

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const type = state.board[y][x];
        if (type) drawBlock(ctx, x * BLOCK, y * BLOCK, BLOCK, type);
      }
    }

    const piece = state.current;
    if (piece && state.status !== 'clearing' && state.status !== 'over') {
      let ghostY = piece.y;
      while (!collides(piece.matrix, piece.x, ghostY + 1)) ghostY++;

      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (!piece.matrix[r][c]) continue;
          const by = ghostY + r;
          if (by < 0) continue;
          drawGhostBlock(ctx, (piece.x + c) * BLOCK, by * BLOCK, BLOCK, piece.type);
        }
      }

      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (!piece.matrix[r][c]) continue;
          const by = piece.y + r;
          if (by < 0) continue;
          drawBlock(ctx, (piece.x + c) * BLOCK, by * BLOCK, BLOCK, piece.type, { glow: true });
        }
      }
    }

    if (state.flashRows.length) {
      const progress = 1 - Math.max(0, state.clearTimer) / CLEAR_FLASH;
      const alpha = 0.12 + 0.5 * Math.sin(progress * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha.toFixed(3) + ')';
      for (const row of state.flashRows) {
        ctx.fillRect(0, row * BLOCK, BOARD_W, BLOCK);
      }
    }

    for (const particle of state.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rot);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    }
  }

  function renderNext() {
    const ctx = nextCtx;
    ctx.clearRect(0, 0, NEXT_W, NEXT_H);

    const slotHeight = NEXT_H / NEXT_COUNT;

    state.queue.slice(0, NEXT_COUNT).forEach((type, index) => {
      drawPiecePreview(
        ctx,
        type,
        0,
        index * slotHeight,
        NEXT_W,
        slotHeight,
        index === 0 ? 22 : 18,
        index === 0 ? 1 : 0.6
      );
    });
  }

  function renderHold() {
    const ctx = holdCtx;
    ctx.clearRect(0, 0, HOLD_W, HOLD_H);

    if (state.hold) {
      drawPiecePreview(ctx, state.hold, 0, 0, HOLD_W, HOLD_H, 22, state.canHold ? 1 : 0.5);
    }
  }

  function spawnClearParticles(rows) {
    for (const row of rows) {
      for (let x = 0; x < COLS; x++) {
        const type = state.board[row][x];
        const color = type ? COLORS[type].base : '#ffffff';

        for (let i = 0; i < 2; i++) {
          const life = 500 + Math.random() * 350;
          state.particles.push({
            x: x * BLOCK + BLOCK / 2 + (Math.random() - 0.5) * BLOCK * 0.6,
            y: row * BLOCK + BLOCK / 2 + (Math.random() - 0.5) * BLOCK * 0.6,
            vx: (Math.random() - 0.5) * 240,
            vy: -Math.random() * 220 - 40,
            size: 4 + Math.random() * 5,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 10,
            life,
            maxLife: life,
            color,
          });
        }
      }
    }
  }

  function updateParticles(dt) {
    const seconds = dt / 1000;

    for (let i = state.particles.length - 1; i >= 0; i--) {
      const particle = state.particles[i];
      particle.vy += 900 * seconds;
      particle.x += particle.vx * seconds;
      particle.y += particle.vy * seconds;
      particle.rot += particle.vr * seconds;
      particle.life -= dt;

      if (particle.life <= 0) state.particles.splice(i, 1);
    }
  }

  /* ============================================================
     HUD e overlays
  ============================================================ */
  function updateHud() {
    scoreEl.textContent = formatNumber(state.score);
    levelEl.textContent = String(state.level);
    linesEl.textContent = String(state.lines);
    bestEl.textContent = formatNumber(Math.max(state.best, state.score));
  }

  function showOverlay(config) {
    overlayEyebrow.textContent = config.eyebrow || '';
    overlayTitle.textContent = config.title;
    overlayTitle.classList.remove('is-record');
    overlayText.textContent = config.text || '';
    overlayBtn.textContent = config.button;
    overlayHint.textContent = config.hint || '';
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
  }

  function hideOverlay() {
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    if (document.activeElement === overlayBtn) overlayBtn.blur();
  }

  function syncPauseBtn() {
    const paused = state.status === 'paused';
    pauseBtn.innerHTML = paused ? ICONS.play : ICONS.pause;
    pauseBtn.title = paused ? 'Continuar (P)' : 'Pausar (P)';
    pauseBtn.setAttribute('aria-label', paused ? 'Continuar jogo' : 'Pausar jogo');
    pauseBtn.disabled = state.status === 'start' || state.status === 'over';
  }

  function updateSoundButton() {
    soundBtn.innerHTML = muted ? ICONS.soundOff : ICONS.soundOn;
    soundBtn.title = muted ? 'Ativar som' : 'Desativar som';
    soundBtn.setAttribute('aria-pressed', String(!muted));
  }

  function showStartScreen() {
    state.status = 'start';
    showOverlay({
      eyebrow: 'Clássico • 7 peças • recordes locais',
      title: 'TETRIS',
      text: 'Empilhe os blocos e complete linhas para pontuar.\nQuanto mais linhas de uma vez, maior a recompensa.',
      button: 'Jogar',
      hint: 'Enter ou clique em Jogar',
    });
    syncPauseBtn();
  }

  /* ============================================================
     Peças e jogadas
  ============================================================ */
  function randomType() {
    if (!state.bag.length) {
      state.bag = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
      for (let i = state.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = state.bag[i];
        state.bag[i] = state.bag[j];
        state.bag[j] = tmp;
      }
    }
    return state.bag.pop();
  }

  function spawnPiece(type) {
    const nextType = type || state.queue.shift() || randomType();
    while (state.queue.length < NEXT_COUNT) state.queue.push(randomType());

    const matrix = SHAPES[nextType].map((row) => row.slice());
    const piece = {
      type: nextType,
      matrix,
      x: Math.floor((COLS - matrix[0].length) / 2),
      y: nextType === 'I' ? -1 : 0,
      rotation: 0,
    };

    if (collides(matrix, piece.x, piece.y)) {
      piece.y += 1;
      if (collides(matrix, piece.x, piece.y)) {
        state.current = piece;
        gameOver();
        return;
      }
    }

    state.current = piece;
    state.dropTimer = 0;
    state.lockTimer = 0;
    state.lockResets = 0;
    state.dasDir = 0;
    state.dasTimer = 0;

    renderNext();
    renderHold();
  }

  function resetLockTimer() {
    const piece = state.current;
    if (!piece || state.lockResets >= MAX_LOCK_RESETS) return;

    if (collides(piece.matrix, piece.x, piece.y + 1)) {
      state.lockTimer = 0;
      state.lockResets += 1;
    }
  }

  function move(direction, silent) {
    const piece = state.current;
    if (!piece || state.status !== 'playing') return false;
    if (collides(piece.matrix, piece.x + direction, piece.y)) return false;

    piece.x += direction;
    resetLockTimer();
    if (!silent) playSound('move');
    return true;
  }

  function rotate(direction) {
    const piece = state.current;
    if (!piece || state.status !== 'playing' || piece.type === 'O') return false;

    const from = piece.rotation;
    const to = (from + (direction > 0 ? 1 : 3)) % 4;
    const rotated =
      direction > 0 ? rotateMatrixCW(piece.matrix) : rotateMatrixCCW(piece.matrix);
    const table = piece.type === 'I' ? KICKS.I : KICKS.normal;
    const kicks = table[from + '>' + to] || [[0, 0]];

    for (const kick of kicks) {
      const dx = kick[0];
      const dy = kick[1];

      if (!collides(rotated, piece.x + dx, piece.y + dy)) {
        piece.matrix = rotated;
        piece.x += dx;
        piece.y += dy;
        piece.rotation = to;
        resetLockTimer();
        playSound('rotate');
        return true;
      }
    }

    return false;
  }

  function hardDrop() {
    const piece = state.current;
    if (!piece || state.status !== 'playing') return;

    let distance = 0;
    while (!collides(piece.matrix, piece.x, piece.y + 1)) {
      piece.y += 1;
      distance += 1;
    }

    if (distance > 0) {
      state.score += distance * 2;
      updateHud();
    }

    playSound('drop');
    lockPiece();
  }

  function holdPiece() {
    const piece = state.current;
    if (!piece || state.status !== 'playing' || !state.canHold) return;

    const currentType = piece.type;

    if (state.hold) {
      const swap = state.hold;
      state.hold = currentType;
      spawnPiece(swap);
    } else {
      state.hold = currentType;
      spawnPiece();
    }

    state.canHold = false;
    playSound('hold');
    renderHold();
  }

  function lockPiece() {
    const piece = state.current;
    if (!piece) return;

    let topOut = false;

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (!piece.matrix[r][c]) continue;

        const bx = piece.x + c;
        const by = piece.y + r;

        if (by < 0) {
          topOut = true;
          continue;
        }

        state.board[by][bx] = piece.type;
      }
    }

    const fullRows = [];
    for (let y = 0; y < ROWS; y++) {
      if (state.board[y].every(Boolean)) fullRows.push(y);
    }

    state.current = null;
    state.canHold = true;
    state.lockTimer = 0;
    state.lockResets = 0;
    state.dropTimer = 0;
    state.dasDir = 0;
    state.dasTimer = 0;

    if (topOut) {
      gameOver();
      return;
    }

    if (fullRows.length) {
      state.flashRows = fullRows;
      state.clearTimer = CLEAR_FLASH;
      state.status = 'clearing';
      spawnClearParticles(fullRows);
      playSound(fullRows.length === 4 ? 'tetris' : 'clear');
    } else {
      state.combo = 0;
      playSound('lock');
      spawnPiece();
      renderHold();
    }
  }

  function finishClear() {
    const clearedRows = state.flashRows;
    const rowSet = new Set(clearedRows);

    state.board = state.board.filter((_, y) => !rowSet.has(y));
    while (state.board.length < ROWS) {
      state.board.unshift(Array(COLS).fill(null));
    }

    const cleared = clearedRows.length;
    const previousLevel = state.level;

    state.lines += cleared;
    state.level = Math.min(20, Math.floor(state.lines / 10) + 1);
    state.combo += 1;

    const linePoints = [0, 100, 300, 500, 800][cleared] || 0;
    const comboBonus = state.combo > 1 ? 50 * (state.combo - 1) * state.level : 0;
    state.score += linePoints * state.level + comboBonus;

    state.flashRows = [];
    state.clearTimer = 0;
    state.status = 'playing';

    updateHud();
    bump(scoreEl);

    if (state.level > previousLevel) {
      bump(levelEl);
      playSound('levelup');
    }

    spawnPiece();
    renderHold();
  }

  /* ============================================================
     Fluxo do jogo
  ============================================================ */
  function startGame() {
    ensureAudio();

    state.board = createBoard();
    state.bag = [];
    state.queue = [];
    state.current = null;
    state.hold = null;
    state.canHold = true;
    state.score = 0;
    state.lines = 0;
    state.level = 1;
    state.combo = 0;
    state.particles = [];
    state.flashRows = [];
    state.clearTimer = 0;
    state.dropTimer = 0;
    state.lockTimer = 0;
    state.lockResets = 0;
    state.dasDir = 0;
    state.dasTimer = 0;

    held.left = false;
    held.right = false;
    held.down = false;

    for (let i = 0; i < NEXT_COUNT; i++) state.queue.push(randomType());

    state.status = 'playing';
    spawnPiece();
    updateHud();
    renderNext();
    renderHold();
    hideOverlay();
    syncPauseBtn();
  }

  function pauseGame() {
    if (state.status !== 'playing' && state.status !== 'clearing') return;

    state.prevStatus = state.status;
    state.status = 'paused';

    held.left = false;
    held.right = false;
    held.down = false;
    state.dasDir = 0;

    showOverlay({
      eyebrow: 'Jogo pausado',
      title: 'PAUSA',
      text: 'Pontuação: ' + formatNumber(state.score),
      button: 'Continuar',
      hint: 'P para continuar',
    });
    syncPauseBtn();
  }

  function resumeGame() {
    if (state.status !== 'paused') return;

    state.status = state.prevStatus || 'playing';
    hideOverlay();
    syncPauseBtn();
  }

  function gameOver() {
    if (state.status === 'over') return;

    state.status = 'over';
    state.current = null;
    state.canHold = true;
    held.left = false;
    held.right = false;
    held.down = false;
    state.dasDir = 0;

    const isRecord = state.score > state.best && state.score > 0;
    if (state.score > 0) {
      saveScore(state.score, state.lines, state.level);
    }

    updateHud();
    renderLeaderboard();
    playSound('gameover');

    showOverlay({
      eyebrow: isRecord ? 'Novo recorde!' : 'Fim de jogo',
      title: isRecord ? 'RECORDE!' : 'GAME OVER',
      text:
        'Pontuação: ' +
        formatNumber(state.score) +
        '\nLinhas: ' +
        state.lines +
        ' • Nível: ' +
        state.level,
      button: 'Jogar de novo',
      hint: 'Enter para reiniciar',
    });

    if (isRecord) overlayTitle.classList.add('is-record');
    syncPauseBtn();
  }

  /* ============================================================
     Loop principal
  ============================================================ */
  function handleHorizontalRepeat(dt) {
    const direction = held.left && !held.right ? -1 : held.right && !held.left ? 1 : 0;

    if (!direction) {
      state.dasDir = 0;
      return;
    }

    if (state.dasDir !== direction) {
      state.dasDir = direction;
      state.dasTimer = -DAS_DELAY;
      return;
    }

    state.dasTimer += dt;

    while (state.dasTimer >= 0) {
      state.dasTimer -= ARR;
      move(direction, true);
    }
  }

  function update(dt) {
    updateParticles(dt);

    if (state.status === 'clearing') {
      state.clearTimer -= dt;
      if (state.clearTimer <= 0) finishClear();
      return;
    }

    if (state.status !== 'playing' || !state.current) return;

    handleHorizontalRepeat(dt);

    const piece = state.current;
    const gravity = gravityForLevel(state.level);
    const interval = held.down ? Math.min(SOFT_DROP_INTERVAL, gravity) : gravity;

    state.dropTimer += dt;

    while (
      state.current === piece &&
      state.dropTimer >= interval &&
      !collides(piece.matrix, piece.x, piece.y + 1)
    ) {
      state.dropTimer -= interval;
      piece.y += 1;

      if (held.down) {
        state.score += 1;
        updateHud();
      }

      state.lockTimer = 0;
    }

    if (collides(piece.matrix, piece.x, piece.y + 1)) {
      state.dropTimer = 0;
      state.lockTimer += dt;

      if (state.lockTimer >= LOCK_DELAY) lockPiece();
    } else {
      state.lockTimer = 0;
    }
  }

  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;

    update(dt);
    renderBoard();
    renderNext();
    renderHold();

    requestAnimationFrame(loop);
  }

  /* ============================================================
     Entrada
  ============================================================ */
  function onKeyDown(event) {
    const key = event.key;

    if (key === ' ' || key.startsWith('Arrow')) event.preventDefault();
    if (event.repeat) return;

    if (key === 'Enter') {
      if (overlay.classList.contains('is-visible') && document.activeElement === overlayBtn) {
        return;
      }
      if (state.status === 'start' || state.status === 'over') {
        startGame();
      } else if (state.status === 'paused') {
        resumeGame();
      }
      return;
    }

    if (key === 'p' || key === 'P' || key === 'Escape') {
      if (state.status === 'playing' || state.status === 'clearing') {
        pauseGame();
      } else if (state.status === 'paused') {
        resumeGame();
      }
      return;
    }

    if (key === 'r' || key === 'R') {
      if (state.status !== 'start') startGame();
      return;
    }

    if (state.status !== 'playing') return;

    switch (key) {
      case 'ArrowLeft':
        held.left = true;
        move(-1);
        state.dasDir = -1;
        state.dasTimer = -DAS_DELAY;
        break;
      case 'ArrowRight':
        held.right = true;
        move(1);
        state.dasDir = 1;
        state.dasTimer = -DAS_DELAY;
        break;
      case 'ArrowDown':
        held.down = true;
        break;
      case 'ArrowUp':
      case 'x':
      case 'X':
        rotate(1);
        break;
      case 'z':
      case 'Z':
        rotate(-1);
        break;
      case ' ':
        hardDrop();
        break;
      case 'c':
      case 'C':
      case 'Shift':
        holdPiece();
        break;
      default:
        break;
    }
  }

  function onKeyUp(event) {
    const key = event.key;

    if (key === 'ArrowLeft') held.left = false;
    if (key === 'ArrowRight') held.right = false;
    if (key === 'ArrowDown') held.down = false;

    if (!held.left && !held.right) state.dasDir = 0;
  }

  /* ============================================================
     Controles de toque
  ============================================================ */
  function bindTouchControls() {
    const buttons = document.querySelectorAll('[data-action]');

    buttons.forEach((button) => {
      const action = button.dataset.action;

      const release = () => {
        if (action === 'left') held.left = false;
        if (action === 'right') held.right = false;
        if (action === 'down') held.down = false;
        if (!held.left && !held.right) state.dasDir = 0;
      };

      button.addEventListener('contextmenu', (event) => event.preventDefault());

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        ensureAudio();

        if (state.status === 'start' || state.status === 'over') {
          startGame();
          return;
        }

        if (state.status === 'paused') {
          resumeGame();
          return;
        }

        switch (action) {
          case 'left':
            held.left = true;
            move(-1);
            state.dasDir = -1;
            state.dasTimer = -DAS_DELAY;
            break;
          case 'right':
            held.right = true;
            move(1);
            state.dasDir = 1;
            state.dasTimer = -DAS_DELAY;
            break;
          case 'down':
            held.down = true;
            break;
          case 'rotate':
            rotate(1);
            break;
          case 'drop':
            hardDrop();
            break;
          case 'hold':
            holdPiece();
            break;
          default:
            break;
        }
      });

      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    });
  }

  /* ============================================================
     Inicialização
  ============================================================ */
  overlayBtn.addEventListener('click', () => {
    if (state.status === 'paused') {
      resumeGame();
    } else {
      startGame();
    }
  });

  soundBtn.addEventListener('click', () => {
    muted = !muted;
    safeSet(SOUND_KEY, muted ? 'off' : 'on');
    updateSoundButton();

    if (!muted) {
      ensureAudio();
      playSound('rotate');
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (state.status === 'paused') {
      resumeGame();
    } else if (state.status === 'playing' || state.status === 'clearing') {
      pauseGame();
    }
  });

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  window.addEventListener('blur', () => {
    held.left = false;
    held.right = false;
    held.down = false;
    state.dasDir = 0;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseGame();
  });

  function init() {
    state.scores = loadScores();
    state.best = state.scores[0] ? state.scores[0].score : 0;
    state.board = createBoard();

    updateHud();
    renderLeaderboard();
    updateSoundButton();
    showStartScreen();
    bindTouchControls();

    requestAnimationFrame(loop);
  }

  init();
})();
