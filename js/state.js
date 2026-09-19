'use strict';
/*
 * state.js — estado central do jogo (gameState) + persistência em localStorage.
 * Nenhum outro arquivo deve escrever em localStorage diretamente: tudo passa por aqui.
 */
window.App = window.App || {};

(function () {
  const STORAGE_KEY = 'op404_gameState_v1';
  const TOTAL_TIME = 30 * 60; // 30 minutos, em segundos
  const EXTRA_TIME = 15 * 60; // bônus de tempo extra, concedido uma única vez, sob ação do jogador
  const EXTRA_TIME_THRESHOLD = 5 * 60; // a partir de quantos segundos restantes o botão de tempo extra aparece

  // Ordem oficial das salas. "intro" e "victory"/"defeat" não contam como salas jogáveis.
  const ROOM_ORDER = ['css', 'html', 'js', 'db', 'crud', 'final'];

  function defaultState() {
    return {
      started: false,
      finished: false,
      victory: false,
      currentRoom: 'css',
      timeRemaining: TOTAL_TIME,
      lastSavedAt: Date.now(),
      inventory: [],           // { id, nome, icone, descricao }
      solvedPuzzles: [],       // subconjunto de ROOM_ORDER
      fragments: {},           // { html:'7', css:'3', ... } preenchido ao resolver cada sala
      hintsUsed: { html: 0, css: 0, js: 0, db: 0, crud: 0, final: 0 },
      mistakes: 0,
      mistakesByRoom: { html: 0, css: 0, js: 0, db: 0, crud: 0, final: 0 },
      soundOn: true,
      dbQueriesRun: [],        // histórico de consultas SQL bem-sucedidas (por nome de padrão)
      crudUsers: [
        { id: 1, nome: 'Ana Beatriz', login: 'ana', perfil: 'usuário' },
        { id: 2, nome: 'João Pedro', login: 'joao', perfil: 'usuário' }
      ],
      crudNextId: 3,
      finishTime: null, // segundos decorridos quando o jogo terminou
      extraTimeUsed: false,
      teamMembers: [] // nomes informados na tela inicial (1 a 5)
    };
  }

  let gameState = load() || defaultState();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // compensa o tempo que passou desde o último salvamento (aba fechada, recarregada, etc.)
      if (parsed.started && !parsed.finished && typeof parsed.lastSavedAt === 'number') {
        const elapsedSeconds = Math.floor((Date.now() - parsed.lastSavedAt) / 1000);
        if (elapsedSeconds > 0) {
          parsed.timeRemaining = Math.max(0, parsed.timeRemaining - elapsedSeconds);
        }
      }
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      console.warn('[Operação 404] Não foi possível carregar o progresso salvo:', e);
      return null;
    }
  }

  function save() {
    gameState.lastSavedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
      console.warn('[Operação 404] Não foi possível salvar o progresso:', e);
    }
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignora */ }
    gameState = defaultState();
    save();
  }

  function hasSavedProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed.started && !parsed.finished;
    } catch (e) {
      return false;
    }
  }

  function startGame() {
    gameState.started = true;
    save();
  }

  function tick() {
    if (gameState.timeRemaining > 0) {
      gameState.timeRemaining -= 1;
    }
    save();
    return gameState.timeRemaining;
  }

  function addInventoryItem(item) {
    if (gameState.inventory.some(function (i) { return i.id === item.id; })) return;
    gameState.inventory.push(item);
    save();
  }

  function hasItem(id) {
    return gameState.inventory.some(function (i) { return i.id === id; });
  }

  function markSolved(roomId, fragment) {
    if (!gameState.solvedPuzzles.includes(roomId)) {
      gameState.solvedPuzzles.push(roomId);
    }
    if (fragment !== undefined) {
      gameState.fragments[roomId] = fragment;
    }
    save();
  }

  function isSolved(roomId) {
    return gameState.solvedPuzzles.includes(roomId);
  }

  function useHint(roomId) {
    gameState.hintsUsed[roomId] = (gameState.hintsUsed[roomId] || 0) + 1;
    save();
    return gameState.hintsUsed[roomId];
  }

  function totalHintsUsed() {
    return Object.values(gameState.hintsUsed).reduce(function (a, b) { return a + b; }, 0);
  }

  function addMistake(roomId) {
    gameState.mistakes += 1;
    if (roomId) {
      gameState.mistakesByRoom[roomId] = (gameState.mistakesByRoom[roomId] || 0) + 1;
    }
    save();
  }

  function goToRoom(roomId) {
    gameState.currentRoom = roomId;
    save();
  }

  function nextRoomAfter(roomId) {
    const idx = ROOM_ORDER.indexOf(roomId);
    if (idx === -1 || idx === ROOM_ORDER.length - 1) return null;
    return ROOM_ORDER[idx + 1];
  }

  function finishGame(victory) {
    gameState.finished = true;
    gameState.victory = victory;
    gameState.finishTime = TOTAL_TIME - gameState.timeRemaining;
    save();
  }

  function toggleSound() {
    gameState.soundOn = !gameState.soundOn;
    save();
    return gameState.soundOn;
  }

  function setTeamMembers(names) {
    gameState.teamMembers = (names || []).map(function (n) { return String(n).trim(); }).filter(Boolean).slice(0, 5);
    save();
  }

  function canUseExtraTime() {
    return !gameState.extraTimeUsed && !gameState.finished && gameState.timeRemaining <= EXTRA_TIME_THRESHOLD;
  }

  function useExtraTime() {
    if (gameState.extraTimeUsed) return false;
    gameState.extraTimeUsed = true;
    gameState.timeRemaining += EXTRA_TIME;
    save();
    return true;
  }

  // --- CRUD (Sala 05) ---
  function crudCreate(user) {
    const record = {
      id: gameState.crudNextId++,
      nome: (user.nome || '').trim(),
      login: (user.login || '').trim(),
      perfil: user.perfil || 'usuário'
    };
    gameState.crudUsers.push(record);
    save();
    return record;
  }

  function crudUpdate(id, changes) {
    const user = gameState.crudUsers.find(function (u) { return u.id === id; });
    if (!user) return null;
    if (changes.nome !== undefined) user.nome = changes.nome.trim();
    if (changes.login !== undefined) user.login = changes.login.trim();
    if (changes.perfil !== undefined) user.perfil = changes.perfil;
    save();
    return user;
  }

  function crudDelete(id) {
    gameState.crudUsers = gameState.crudUsers.filter(function (u) { return u.id !== id; });
    save();
  }

  App.State = {
    TOTAL_TIME: TOTAL_TIME,
    EXTRA_TIME: EXTRA_TIME,
    EXTRA_TIME_THRESHOLD: EXTRA_TIME_THRESHOLD,
    ROOM_ORDER: ROOM_ORDER,
    get: function () { return gameState; },
    load: load,
    save: save,
    reset: reset,
    hasSavedProgress: hasSavedProgress,
    startGame: startGame,
    tick: tick,
    addInventoryItem: addInventoryItem,
    hasItem: hasItem,
    markSolved: markSolved,
    isSolved: isSolved,
    useHint: useHint,
    totalHintsUsed: totalHintsUsed,
    addMistake: addMistake,
    goToRoom: goToRoom,
    nextRoomAfter: nextRoomAfter,
    finishGame: finishGame,
    toggleSound: toggleSound,
    setTeamMembers: setTeamMembers,
    canUseExtraTime: canUseExtraTime,
    useExtraTime: useExtraTime,
    crudCreate: crudCreate,
    crudUpdate: crudUpdate,
    crudDelete: crudDelete
  };
})();
