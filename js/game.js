'use strict';
/*
 * game.js — controlador principal: telas, cronômetro, HUD, painéis, som,
 * modo professor e recapitulação final. Depende de App.State, App.DB e
 * App.Puzzles (carregados antes deste arquivo).
 */
window.App = window.App || {};

(function () {
  let timerInterval = null;
  let audioCtx = null;

  const el = {};

  function q(id) { return document.getElementById(id); }

  function cacheElements() {
    [
      'screen-intro', 'screen-game', 'screen-victory', 'screen-defeat',
      'btn-start', 'btn-continue',
      'room-label', 'timer', 'btn-inventory', 'inventory-count', 'btn-hint',
      'btn-sound', 'btn-restart', 'progress-map', 'room-content',
      'panel-inventory', 'inventory-list', 'panel-hint', 'hint-body',
      'teacher-modal', 'teacher-body', 'recap-modal', 'recap-body',
      'room-review-modal', 'room-review-body', 'room-review-title',
      'victory-rank', 'victory-stats', 'defeat-stats',
      'btn-replay', 'btn-recap', 'btn-retry', 'toast-region'
    ].forEach(function (id) { el[id.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] = q(id); });
  }

  // ---------------------------------------------------------------------
  // Telas
  // ---------------------------------------------------------------------
  function showScreen(id) {
    ['screen-intro', 'screen-game', 'screen-victory', 'screen-defeat'].forEach(function (s) {
      q(s).classList.toggle('hidden', s !== id);
    });
  }

  function fmtTime(totalSeconds) {
    const s = Math.max(0, totalSeconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  // ---------------------------------------------------------------------
  // Som (Web Audio API — sem arquivos externos)
  // ---------------------------------------------------------------------
  function getAudioCtx() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function tone(ctx, freq, start, duration, type, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0;
    osc.connect(g).connect(ctx.destination);
    const t0 = ctx.currentTime + start;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain || 0.08, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playSound(type) {
    if (!App.State.get().soundOn) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    switch (type) {
      case 'click': tone(ctx, 700, 0, 0.05, 'square', 0.04); break;
      case 'error': tone(ctx, 180, 0, 0.18, 'sawtooth', 0.07); tone(ctx, 140, 0.08, 0.16, 'sawtooth', 0.06); break;
      case 'success': tone(ctx, 520, 0, 0.1, 'sine', 0.07); tone(ctx, 780, 0.09, 0.16, 'sine', 0.07); break;
      case 'unlock': tone(ctx, 440, 0, 0.09, 'triangle', 0.07); tone(ctx, 660, 0.1, 0.09, 'triangle', 0.07); tone(ctx, 880, 0.2, 0.2, 'triangle', 0.08); break;
      case 'alert': tone(ctx, 300, 0, 0.12, 'square', 0.06); tone(ctx, 300, 0.18, 0.12, 'square', 0.06); break;
      case 'complete': tone(ctx, 523, 0, 0.12, 'sine', 0.08); tone(ctx, 659, 0.12, 0.12, 'sine', 0.08); tone(ctx, 784, 0.24, 0.12, 'sine', 0.08); tone(ctx, 1046, 0.36, 0.28, 'sine', 0.09); break;
    }
  }

  // ---------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------
  function toast(message, type) {
    const div = document.createElement('div');
    div.className = 'toast toast-' + (type || 'info');
    div.textContent = message;
    el.toastRegion.appendChild(div);
    requestAnimationFrame(function () { div.classList.add('toast-show'); });
    setTimeout(function () {
      div.classList.remove('toast-show');
      setTimeout(function () { div.remove(); }, 300);
    }, 3200);
  }

  // ---------------------------------------------------------------------
  // HUD / mapa de progresso
  // ---------------------------------------------------------------------
  function updateHUD() {
    const state = App.State.get();
    el.timer.textContent = fmtTime(state.timeRemaining);
    el.timer.classList.toggle('timer-urgent', state.timeRemaining <= 600 && state.timeRemaining > 180);
    el.timer.classList.toggle('timer-critical', state.timeRemaining <= 180);

    const count = state.inventory.length;
    el.inventoryCount.textContent = String(count);
    el.inventoryCount.classList.toggle('hidden', count === 0);

    el.btnSound.querySelector('.hud-btn-text').textContent = 'Som: ' + (state.soundOn ? 'ON' : 'OFF');
    el.btnSound.firstChild.textContent = state.soundOn ? '🔊 ' : '🔇 ';
    el.btnSound.setAttribute('aria-pressed', String(state.soundOn));

    const room = App.Puzzles.rooms[state.currentRoom];
    if (room) el.roomLabel.textContent = room.label;
  }

  function updateProgressMap() {
    const state = App.State.get();
    const order = App.State.ROOM_ORDER;
    const currentIdx = order.indexOf(state.currentRoom);
    el.progressMap.innerHTML = order.map(function (id, idx) {
      const meta = App.Puzzles.roomMeta[id];
      let status = 'locked';
      let mark = '🔒';
      if (state.solvedPuzzles.includes(id)) { status = 'done'; mark = '✓'; }
      else if (idx === currentIdx) { status = 'active'; mark = '▶'; }
      return '<span class="map-chip map-chip-' + status + '">' + meta.icon + ' ' + meta.name + ' <b>' + mark + '</b></span>';
    }).join('');
  }

  // ---------------------------------------------------------------------
  // Renderização de salas
  // ---------------------------------------------------------------------
  function renderRoom() {
    const state = App.State.get();
    const room = App.Puzzles.rooms[state.currentRoom];
    if (!room) return;
    el.roomContent.innerHTML = room.render(state);
    if (!App.State.isSolved(state.currentRoom)) {
      room.init(el.roomContent);
    }
    updateHUD();
    updateProgressMap();
  }

  function completeRoom(roomId) {
    const room = App.Puzzles.rooms[roomId];
    const wasNew = !App.State.isSolved(roomId);
    App.State.markSolved(roomId, room.fragment);
    if (room.item) App.State.addInventoryItem(room.item);
    if (wasNew) toast('Sala concluída: ' + room.label, 'success');
    renderRoom();
  }

  function grantItem(roomId, item) {
    const already = App.State.hasItem(item.id);
    App.State.addInventoryItem(item);
    if (!already) {
      toast('Item adicionado ao inventário: ' + item.nome, 'success');
      playSound('unlock');
    }
    updateHUD();
  }

  function registerMistake(roomId) {
    App.State.addMistake(roomId);
  }

  function rerenderRoom() { renderRoom(); }

  function goToNextRoom(fromRoomId) {
    const next = App.State.nextRoomAfter(fromRoomId);
    if (!next) return;
    playSound('unlock');
    App.State.goToRoom(next);
    renderRoom();
    el.roomContent.focus();
  }

  // ---------------------------------------------------------------------
  // Painéis (inventário / pistas)
  // ---------------------------------------------------------------------
  function openPanel(panel, triggerBtn) {
    panel.classList.remove('hidden');
    triggerBtn.setAttribute('aria-expanded', 'true');
  }
  function closePanel(panel) {
    panel.classList.add('hidden');
    document.querySelectorAll('[aria-controls="' + panel.id + '"]').forEach(function (b) {
      b.setAttribute('aria-expanded', 'false');
    });
  }
  function togglePanel(panel, triggerBtn) {
    if (panel.classList.contains('hidden')) openPanel(panel, triggerBtn);
    else closePanel(panel);
  }

  function renderInventory() {
    const state = App.State.get();
    if (!state.inventory.length) {
      el.inventoryList.innerHTML = '<p class="empty-msg">Nenhum item coletado ainda. Continue investigando.</p>';
      return;
    }
    el.inventoryList.innerHTML = state.inventory.map(function (item) {
      return '<div class="item-card"><span class="item-card-icon">' + item.icone + '</span><div><p class="item-card-name">' + item.nome + '</p><p class="item-card-desc">' + item.descricao + '</p></div></div>';
    }).join('');
  }

  function renderHintPanel() {
    const state = App.State.get();
    const room = App.Puzzles.rooms[state.currentRoom];
    const used = state.hintsUsed[state.currentRoom] || 0;
    const solved = App.State.isSolved(state.currentRoom);

    let html = '<p class="hint-room-name">' + room.label + '</p>';
    if (solved) {
      html += '<p class="empty-msg">Esta sala já foi concluída.</p>';
    } else {
      for (let i = 0; i < used; i++) {
        html += '<div class="hint-item"><p class="hint-item-title">💡 PISTA ' + (i + 1) + '</p><p>' + room.hints[i] + '</p></div>';
      }
      if (used < room.hints.length) {
        html += '<button type="button" id="hint-request-btn" class="btn btn-ghost">Pedir uma pista (' + used + '/' + room.hints.length + ' usadas)</button>';
      } else {
        html += '<p class="empty-msg">Você já viu todas as pistas desta sala.</p>';
      }
    }
    el.hintBody.innerHTML = html;

    const btn = q('hint-request-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        App.State.useHint(state.currentRoom);
        playSound('alert');
        renderHintPanel();
      });
    }
  }

  // ---------------------------------------------------------------------
  // Modo professor
  // ---------------------------------------------------------------------
  function formatAnswer(room) {
    if (room.id === 'crud') {
      return 'Nome: ADMIN · Login: master · Perfil: administrador';
    }
    if (room.id === 'final') {
      return 'Concatenação dos fragmentos revelados em cada sala, na ordem CSS → HTML → JS → SQL → CRUD (ex.: "37946"). É calculado dinamicamente a partir de App.State.ROOM_ORDER, não é fixo caso a ordem ou os fragmentos sejam alterados.';
    }
    return room.answer;
  }

  function buildInfoSections(includeAnswers) {
    return App.State.ROOM_ORDER.map(function (id) {
      const room = App.Puzzles.rooms[id];
      return '<section class="teacher-room">' +
        '<h3>' + room.title + ' <span class="teacher-time">(' + room.estimatedTime + ')</span></h3>' +
        (includeAnswers ? '<p><strong>Resposta:</strong> ' + formatAnswer(room) + '</p>' : '') +
        '<p><strong>Conceitos trabalhados:</strong> ' + room.concepts.join(', ') + '</p>' +
        (includeAnswers ? '<p><strong>Pistas:</strong></p><ol>' + room.hints.map(function (h) { return '<li>' + h + '</li>'; }).join('') + '</ol>' : '') +
        '</section>';
    }).join('');
  }

  function openTeacherModal() {
    el.teacherBody.innerHTML =
      '<p class="teacher-intro">Sequência esperada: CSS → HTML → JavaScript → Banco de Dados/SQL → CRUD → Sala de Controle. Duração estimada total: ~45 minutos.</p>' +
      buildInfoSections(true);
    el.teacherModal.classList.remove('hidden');
  }

  function openRecapModal() {
    const state = App.State.get();
    el.recapBody.innerHTML =
      '<p class="teacher-intro">Resumo do que foi necessário para escapar do laboratório:</p>' +
      App.State.ROOM_ORDER.map(function (id) {
        const room = App.Puzzles.rooms[id];
        const hints = state.hintsUsed[id] || 0;
        return '<section class="teacher-room">' +
          '<h3>' + room.title + '</h3>' +
          '<p>' + (room.solvedText || 'Você combinou os fragmentos descobertos em cada sala.') + '</p>' +
          '<p><strong>Conceitos:</strong> ' + room.concepts.join(', ') + '</p>' +
          '<p><strong>Pistas usadas nesta sala:</strong> ' + hints + '</p>' +
          '</section>';
      }).join('');
    el.recapModal.classList.remove('hidden');
  }

  function closeModal(modal) { modal.classList.add('hidden'); }

  function openRoomReview(roomId) {
    const room = App.Puzzles.rooms[roomId];
    if (!room || !room.reviewRender) return;
    el.roomReviewTitle.textContent = '🔎 Revisão — ' + room.label;
    el.roomReviewBody.innerHTML =
      '<p class="teacher-intro">Esta sala já foi concluída. Você pode consultar os dados de novo à vontade — nada aqui muda seu progresso.</p>' +
      room.reviewRender();
    if (room.reviewInit) room.reviewInit(el.roomReviewBody);
    el.roomReviewModal.classList.remove('hidden');
  }

  // ---------------------------------------------------------------------
  // Cronômetro
  // ---------------------------------------------------------------------
  function startTimer() {
    stopTimer();
    timerInterval = setInterval(function () {
      const remaining = App.State.tick();
      updateHUD();
      if (remaining <= 0) {
        stopTimer();
        finishGame(false);
      }
    }, 1000);
  }
  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  // ---------------------------------------------------------------------
  // Fim de jogo
  // ---------------------------------------------------------------------
  function computeRank(hints, mistakes) {
    if (hints <= 1 && mistakes <= 2) return 'Mestre do Sistema';
    if (hints <= 3 && mistakes <= 5) return 'Hacker';
    if (hints <= 6) return 'Analista';
    return 'Investigador';
  }

  function finishGame(victory) {
    stopTimer();
    App.State.finishGame(victory);
    playSound(victory ? 'complete' : 'error');
    showResultScreen(victory);
  }

  function showResultScreen(victory) {
    const state = App.State.get();
    const hints = App.State.totalHintsUsed();
    const solved = state.solvedPuzzles.filter(function (id) { return id !== 'final'; }).length +
      (state.solvedPuzzles.includes('final') ? 1 : 0);
    const total = App.State.ROOM_ORDER.length;
    const elapsed = state.finishTime !== null ? state.finishTime : (App.State.TOTAL_TIME - state.timeRemaining);

    if (victory) {
      el.victoryRank.textContent = computeRank(hints, state.mistakes);
      el.victoryStats.innerHTML =
        '<p>Tempo: <strong>' + fmtTime(elapsed) + '</strong></p>' +
        '<p>Desafios resolvidos: <strong>' + solved + '/' + total + '</strong></p>' +
        '<p>Pistas utilizadas: <strong>' + hints + '</strong></p>' +
        '<p>Tentativas incorretas: <strong>' + state.mistakes + '</strong></p>';
      showScreen('screen-victory');
    } else {
      el.defeatStats.innerHTML =
        '<p>Salas concluídas: <strong>' + solved + '/' + total + '</strong></p>' +
        '<p>Pistas utilizadas: <strong>' + hints + '</strong></p>' +
        '<p>Tentativas incorretas: <strong>' + state.mistakes + '</strong></p>';
      showScreen('screen-defeat');
    }
  }

  // ---------------------------------------------------------------------
  // Início / reinício
  // ---------------------------------------------------------------------
  function enterGame() {
    showScreen('screen-game');
    renderRoom();
    startTimer();
  }

  function restartToIntro() {
    stopTimer();
    App.State.reset();
    el.btnContinue.classList.add('hidden');
    showScreen('screen-intro');
  }

  function wireEvents() {
    el.btnStart.addEventListener('click', function () {
      const state = App.State.get();
      if (state.started && !state.finished) {
        if (!window.confirm('Isso vai apagar seu progresso atual e começar uma nova missão. Continuar?')) return;
        App.State.reset();
      }
      App.State.startGame();
      enterGame();
    });

    el.btnContinue.addEventListener('click', enterGame);

    el.btnInventory.addEventListener('click', function () {
      renderInventory();
      togglePanel(el.panelInventory, el.btnInventory);
    });
    el.btnHint.addEventListener('click', function () {
      renderHintPanel();
      togglePanel(el.panelHint, el.btnHint);
    });
    el.btnSound.addEventListener('click', function () {
      const on = App.State.toggleSound();
      updateHUD();
      if (on) playSound('click');
    });
    el.btnRestart.addEventListener('click', function () {
      if (window.confirm('Tem certeza que deseja reiniciar a missão? Todo o progresso será perdido.')) {
        restartToIntro();
      }
    });

    document.querySelectorAll('[data-close-panel]').forEach(function (btn) {
      btn.addEventListener('click', function () { closePanel(q(btn.dataset.closePanel)); });
    });
    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
      btn.addEventListener('click', function () { closeModal(q(btn.dataset.closeModal)); });
    });

    el.roomContent.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-action="continue-room"]');
      if (btn) goToNextRoom(btn.dataset.room);
    });

    el.btnReplay.addEventListener('click', restartToIntro);
    el.btnRetry.addEventListener('click', restartToIntro);
    el.btnRecap.addEventListener('click', openRecapModal);

    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        openTeacherModal();
        return;
      }
      if (e.key === 'Escape') {
        closePanel(el.panelInventory);
        closePanel(el.panelHint);
        closeModal(el.teacherModal);
        closeModal(el.recapModal);
        closeModal(el.roomReviewModal);
      }
    });
  }

  function init() {
    cacheElements();
    wireEvents();
    const state = App.State.get();
    if (state.finished) {
      showResultScreen(state.victory);
    } else {
      if (state.started) el.btnContinue.classList.remove('hidden');
      showScreen('screen-intro');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  App.Game = {
    playSound: playSound,
    completeRoom: completeRoom,
    grantItem: grantItem,
    registerMistake: registerMistake,
    rerenderRoom: rerenderRoom,
    finishGame: finishGame,
    toast: toast,
    openRoomReview: openRoomReview
  };
})();
