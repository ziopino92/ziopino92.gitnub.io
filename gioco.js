(function () {
  'use strict';

  const COLS = 6;
  const ROWS = 5;
  const TOTAL_ZONES = COLS * ROWS;

  const FACTIONS = {
    putrealismo: { name: 'Resilienti Metallici', color: 'rgba(180,120,60,0.55)', icon: 'images/palazzo.png', conquestBonus: 1.05 },
    anteismo:     { name: 'Risonanti',             color: 'rgba(60,120,180,0.55)', icon: 'images/antenna.png', conquestBonus: 1.0  },
    talppetismo:  { name: 'Sottoiaristi',          color: 'rgba(70,180,100,0.55)', icon: 'images/grotta.png',  conquestBonus: 0.95 }
  };

  const END_MESSAGES = {
    putrealismo: { win: 'La Putrella trionfa!', lose: 'I Resilienti Metallici sono annientati.' },
    anteismo:     { win: 'I Risonanti trionfano!', lose: 'I Risonanti sono dissolti.' },
    talppetismo:  { win: 'I Sottoiaristi trionfano!', lose: 'I Sottoiaristi non esistono più.' }
  };

  const GLOBAL_EVENTS = {
    putrealismo: [
      { id: 'put1', descrizione: 'La Putrella Sacra è danneggiata. Ripararla?', tipo: 'risorsa', opzioni: [ { testo: 'Riparala con ferro', modifiche: { fede: +15, materiali: -10, fedeli: +5 } }, { testo: 'Ignora', modifiche: { fede: +5, fedeli: -5 } } ], immagine: 'images/eventi/putrella_dannegiata.png' },
      { id: 'put_fedeli', descrizione: 'Crostuisci un nuovo tempio?', tipo: 'fedeli', opzioni: [ { testo: 'Tutti devo poter ammirrare la santa Putrella!', modifiche: { fedeli: +12, materiali: -10 } }, { testo: 'Non ora', modifiche: { fede: -10 } } ], immagine: 'images/eventi/tempio.png' },
      { id: 'put_sposta', descrizione: 'Ridispiegamento: spostare difensori tra le tue zone?', tipo: 'sposta', opzioni: [], immagine: 'images/eventi/trasferimentoPutrelle.png' },
      { id: 'put_neg', descrizione: 'Un pallazzo è crollato.', tipo: 'negativo', opzioni: [ { testo: 'Ripara', modifiche: { materiali: -8, fedeli: -4, fede: 5 } }, { testo: 'Prendi i resti', modifiche: { fede: -10, materiali: +10, fedeli: -8 } } ], immagine: 'images/eventi/palazzo_crollato.jpg' }
    ],
    anteismo: [
      { id: 'ant1', descrizione: 'Costrusci delle nuove antenne?', tipo: 'risorsa', opzioni: [ { testo: 'Sempre e comunque.', modifiche: { fede: +20, materiali: -15, fedeli: -5 } }, { testo: 'Ho un po' di malditesta, forse è meglio di no', modifiche: { fede: -15} } ], immagine: 'images/eventi/antenna_yagi.png' },
      { id: 'ant_fedeli', descrizione: 'La potenza delle antenne è alta ma ci sono dei fedeli che stanno ascoltando l'ave parabola da lontano. Abassare la potenza?', tipo: 'fedeli', opzioni: [ { testo: 'Amplifica il segnale, ci devono sentire tutti!', modifiche: { fedeli: -5, materiali: -5, fede: +5 } }, { testo: 'Abbiamo già ucciso troppi fedeli questo mese, abbassa la potenza.', modifiche: { fede: -5, fedeli: +2 } } ], immagine: 'images/eventi/potenza_alta.jpg' },
      { id: 'ant_sposta', descrizione: 'Riorganizza le antenne: sposta guardie tra basi?', tipo: 'sposta', opzioni: [], immagine: 'images/eventi/trasferimentoAntenne.png' },
      { id: 'ant_neg', descrizione: 'C'è un blackout.', tipo: 'negativo', opzioni: [ { testo: 'Aggiusta i generatori.', modifiche: { materiali: -6 } }, { testo: 'Fai riavviare il quadro eletrico a qualcunaltro e prega.', modifiche: { fedeli: -6, fede: -10 } } ], immagine: 'images/eventi/blackout.png' }
    ],
    talppetismo: [
      { id: 'tal1', descrizione: 'Delle gallerie sono croolate.', tipo: 'negativo', opzioni: [ { testo: 'Riparala', modifiche: { materiali: -10, fede: +10 } }, { testo: "Abbiamo una nuova stanza!", modifiche: { fede: -5, fedeli: -2, materiali: +5 } } ], immagine: 'images/eventi/galleria_crollata.jpg' },
      { id: 'tal_fedeli', descrizione: "Un'assemblea porta nuovi adepti.", tipo: 'fedeli', opzioni: [ { testo: 'Accogli', modifiche: { fedeli: +14 } }, { testo: 'Ignora', modifiche: { materiali: +4, fede: +5 } } ], immagine: 'images/eventi/nuove_talpe.jpg' },
      { id: 'tal_sposta', descrizione: 'Ridistribuzione: sposta guardie tra cunicoli?', tipo: 'sposta', opzioni: [], immagine: 'images/eventi/trasferimentoTalpe.png' },
      { id: 'tal_neg', descrizione: 'Hai trovato un tempio sotteraneo, ma è esposto all'odiosa luce solare.', tipo: 'risorsa', opzioni: [ { testo: 'Espora', modifiche: { materiali: +30, fedeli: -2, fede: -5 } }, { testo: 'La luce del sole noooo!', modifiche: { fede: +15 } } ], immagine: 'images/eventi/tempio.png' }
    ]
  };

  const CONQUEST_EVENTS = [
    { id: 'conq_tribu', descrizione: "Occasione: tribù non conquistata vicina. Lancia un'incursione?", tipo: 'conquista_tribu', immagine: 'images/eventi/incursione.jpg' },
    { id: 'conq_fazione', descrizione: 'Debolezza nemica: possibilità di conquistare una zona avversaria vicina!', tipo: 'conquista_fazione', immagine: 'images/eventi/assalto.jpg' }
  ];

  let stats = { fede: 50, fedeli: 50, materiali: 50 };
  let selectedFaction = '';
  let behaviorMode = 'aggressione_fazioni';
  let turnNumber = 0;

  let zones = [];
  const factionState = {};
  Object.keys(FACTIONS).forEach(f => { factionState[f] = { zones: [], alive: true }; });

  let eventActive = false;
  let allowEvents = true;

  let canvas, ctx, mapImg, resizeCanvasFn = null;
  let effectsCanvas, effectsCtx = null;

  const popupEl = document.getElementById('zona-popup');
  const popupTitle = document.getElementById('zona-title');
  const popupOwner = document.getElementById('zona-owner');
  const popupDefenders = document.getElementById('zona-defenders');
  const popupBonuses = document.getElementById('zona-bonus');
  const fedeliPopup = document.getElementById('fedeli-popup');
  const invioFedeliInput = document.getElementById('invio-fedeli');
  let btnInviaFedeli = document.getElementById('btn-inviaFedeli');
  const resultConq = document.getElementById('risultato-conquista');

  const eventDescEl = document.getElementById('descrizioneEvento');
  const eventImgEl  = document.getElementById('immagineEvento');
  const eventChoices = document.getElementById('scelte');

  const endScreen = document.getElementById('end-screen');
  const endTitle = document.getElementById('end-title');
  const endMessage = document.getElementById('end-message');
  const endRetry = document.getElementById('end-retry');
  const endHome = document.getElementById('end-home');
  const confettiCanvas = document.getElementById('confetti-canvas');
  const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;

  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function logEvent(text) {
    const log = document.getElementById('eventLogList');
    if (!log) return;
    const el = document.createElement('div');
    el.textContent = `[T${turnNumber}] ${text}`;
    log.prepend(el);
  }

  function computeCasualtiesRandom(sent, defenders) {
    const baseProb = clamp(defenders / (defenders + sent + 0.0001), 0.05, 0.95);
    const variability = 0.85 + Math.random() * 0.3;
    const prob = clamp(baseProb * variability, 0.03, 0.97);
    let casualties = 0;
    for (let i = 0; i < sent; i++) if (Math.random() < prob) casualties++;
    return casualties;
  }

  function computeDefenderCasualties(sent, defenders) {
    const baseProb = clamp(sent / (defenders + sent + 0.0001), 0.02, 0.6);
    const variability = 0.8 + Math.random() * 0.3;
    const prob = clamp(baseProb * variability * 0.6, 0.01, 0.9);
    let casualties = 0;
    for (let i = 0; i < defenders; i++) if (Math.random() < prob) casualties++;
    return casualties;
  }

  function initZones() {
    zones = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = r * COLS + c;
        zones.push({ id, col: c, row: r, owner: null, defenders: randInt(5, 20), garrison: 0, bonuses: [] });
      }
    }
  }

  function shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  }

  function assignStartingZones() {
    const ids = Array.from({ length: TOTAL_ZONES }, (_, i) => i);
    shuffleArray(ids);
    const keys = Object.keys(FACTIONS);
    keys.forEach((f, idx) => {
      const zid = ids[idx];
      assignZoneToFaction(zid, f);
      logEvent(`${FACTIONS[f].name} parte con la zona #${zid}`);
    });
    updateFactionAliveStatus();
  }

  function updateFactionAliveStatus() {
    Object.keys(factionState).forEach(f => factionState[f].alive = (factionState[f].zones.length > 0));
  }

  function assignZoneToFaction(zoneId, faction) {
    const z = zones[zoneId];
    if (!z) return;

    if (z.owner) {
      const prev = factionState[z.owner].zones;
      const idx = prev.indexOf(zoneId);
      if (idx !== -1) prev.splice(idx, 1);
    }

    z.owner = faction;
    z.garrison = Math.max(3, z.garrison || z.defenders);
    z.defenders = Math.max(3, z.defenders);
    factionState[faction].zones.push(zoneId);
    updateFactionAliveStatus();
  }

  function getFactionFedeli(faction) {
    if (!faction || !factionState[faction]) return stats.fedeli;
    return (factionState[faction].zones || []).reduce((s, zid) => s + (zones[zid].garrison || 0), 0);
  }

  function withdrawFedeliFromAdjacent(faction, targetZoneId, amount) {
    const candidates = ownedZonesAdjacentToZone(faction, targetZoneId);
    candidates.sort((a, b) => (zones[b].garrison || 0) - (zones[a].garrison || 0));

    let toTake = amount;
    let taken = 0;
    for (const zid of candidates) {
      if (toTake <= 0) break;
      const available = zones[zid].garrison || 0;
      if (available <= 0) continue;
      const take = Math.min(available, toTake);
      zones[zid].garrison = Math.max(0, available - take);
      taken += take;
      toTake -= take;
    }
    return taken;
  }

  function addFedeliToFaction(faction, amount, preferZoneId = null) {
    const ids = factionState[faction].zones || [];
    if (ids.length === 0) {
      stats.fedeli = Math.min(999, stats.fedeli + amount);
      return;
    }

    if (preferZoneId !== null && ids.includes(preferZoneId)) {
      zones[preferZoneId].garrison = (zones[preferZoneId].garrison || 0) + amount;
      return;
    }

    const per = Math.floor(amount / ids.length);
    let rem = amount % ids.length;
    ids.forEach(zid => {
      zones[zid].garrison = (zones[zid].garrison || 0) + per + (rem > 0 ? 1 : 0);
      if (rem > 0) rem--;
    });
  }

  function neighborsOf(zoneId) {
    const z = zones[zoneId];
    const out = [];
    for (let r = -1; r <= 1; r++) {
      for (let c = -1; c <= 1; c++) {
        if (r === 0 && c === 0) continue;
        const nc = z.col + c, nr = z.row + r;
        if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) out.push(nr * COLS + nc);
      }
    }
    return out;
  }

  function zonesAdjacentToFaction(faction) {
    const owned = factionState[faction].zones || [];
    const adj = new Set();
    owned.forEach(zid => neighborsOf(zid).forEach(n => { if (zones[n].owner === null) adj.add(n); }));
    return Array.from(adj);
  }

  function adjacentEnemyZones(faction) {
    const owned = factionState[faction].zones || [];
    const adj = new Set();
    owned.forEach(zid => neighborsOf(zid).forEach(n => { if (zones[n].owner && zones[n].owner !== faction) adj.add(n); }));
    return Array.from(adj);
  }

  function ownedZonesAdjacentToZone(faction, zoneId) {
    const out = [];
    neighborsOf(zoneId).forEach(n => { if (zones[n].owner === faction) out.push(n); });
    return out;
  }

  function reconcileFedeliAndDefenders() {
    zones.forEach(z => {
      if (z.garrison == null) z.garrison = 0;
      if (z.defenders == null) z.defenders = 0;
      if (z.garrison > z.defenders) {
        z.defenders = z.garrison;
        logEvent(`Sincronizzo zona ${z.id}: difensori -> ${z.defenders}`);
      } else if (z.defenders > z.garrison) {
        const diff = z.defenders - z.garrison;
        const add = Math.floor(diff * 0.5);
        if (add > 0 && z.owner) {
          z.garrison += add;
          logEvent(`Sincronizzo zona ${z.id}: +${add} garrison`);
        }
      }
    });
  }

  function setupCanvas() {
    mapImg = document.getElementById('mappa-img');
    canvas = document.getElementById('mappa-canvas');
    effectsCanvas = document.getElementById('effects-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    if (effectsCanvas) effectsCtx = effectsCanvas.getContext('2d');

    function resize() {
      canvas.width = mapImg.clientWidth;
      canvas.height = mapImg.clientHeight;
      if (effectsCanvas) {
        effectsCanvas.width = canvas.width;
        effectsCanvas.height = canvas.height;
      }
      drawZonesOverlay();
      placeIcons();
    }

    resizeCanvasFn = resize;
    window.addEventListener('resize', resize);
    mapImg.addEventListener('load', resize);
    if (mapImg.complete) resize();

    canvas.addEventListener('click', ev => {
      const rect = canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const colWidth = canvas.width / COLS;
      const rowHeight = canvas.height / ROWS;
      const c = Math.floor(x / colWidth);
      const r = Math.floor(y / rowHeight);
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
        onZoneClick(r * COLS + c, ev.clientX, ev.clientY);
      }
    });
  }

  function drawZonesOverlay() {
    if (!ctx || !canvas) return;
    const w = canvas.width / COLS;
    const h = canvas.height / ROWS;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    zones.forEach(z => {
      const x = z.col * w, y = z.row * h;
      if (z.owner) {
        ctx.fillStyle = FACTIONS[z.owner].color;
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.0)';
        ctx.fillRect(x, y, w, h);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      const fontSize = Math.max(12, Math.floor(h / 6));
      ctx.font = `${fontSize}px Poppins, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(z.id), x + w / 2, y + h / 2);

      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `${Math.max(10, Math.floor(h / 10))}px Poppins, sans-serif`;
      if (z.garrison) ctx.fillText(`♥${z.garrison}`, x + w - 6, y + h - 6);
    });
  }

  function placeIcons() {
    document.querySelectorAll('.zone-icon').forEach(e => e.remove());
    const wrap = document.getElementById('mappa-container');
    if (!wrap || !canvas) return;
    const w = canvas.width / COLS;
    const h = canvas.height / ROWS;

    zones.forEach(z => {
      if (z.owner) {
        const img = document.createElement('img');
        img.src = FACTIONS[z.owner].icon;
        img.className = 'zone-icon';
        img.style.position = 'absolute';
        const size = Math.min(48, w * 0.4);
        img.style.left = `${(z.col + 0.5) * w - (size / 2)}px`;
        img.style.top  = `${(z.row + 0.5) * h - (size / 2)}px`;
        img.style.width = `${size}px`;
        img.style.transform = 'translate(-50%,-50%) scale(1)';
        img.addEventListener('load', () => {
          img.classList.add('icon-bounce');
          setTimeout(() => img.classList.remove('icon-bounce'), 800);
        });
        wrap.appendChild(img);
      }
    });
  }

  let currentPopupZone = null;

  function showPopup() {
    if (!popupEl) return;
    popupEl.style.display = 'block';
    popupEl.style.opacity = 0;
    setTimeout(() => popupEl.style.opacity = 1, 10);
  }

  function hidePopup() {
    if (!popupEl) return;
    popupEl.style.opacity = 0;
    setTimeout(() => popupEl.style.display = 'none', 180);
  }

  function showTempMessage(container, text, timeout = 1500) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    container.prepend(el);
    setTimeout(() => el.remove(), timeout);
  }

  function onZoneClick(zoneId) {
    currentPopupZone = zoneId;
    const z = zones[zoneId];
    if (!z) return;

    popupTitle.textContent = `Zona #${zoneId} (${z.col},${z.row})`;
    popupOwner.textContent = z.owner ? FACTIONS[z.owner].name : 'Nessuna (tribù)';
    popupDefenders.textContent = z.defenders;
    popupBonuses.textContent = z.bonuses.length ? z.bonuses.join(', ') : 'Nessuno';
    fedeliPopup.textContent = selectedFaction ? getFactionFedeli(selectedFaction) : stats.fedeli;

    const availableAdj = selectedFaction ? ownedZonesAdjacentToZone(selectedFaction, zoneId).reduce((s, id) => s + (zones[id].garrison || 0), 0) : stats.fedeli;
    invioFedeliInput.value = Math.min(10, Math.max(1, Math.floor(availableAdj / 10) || 1));
    invioFedeliInput.dataset.available = availableAdj;
    resultConq.textContent = '';

    showPopup();

    setInviaFedeliHandler(() => {
      const sent = Math.max(1, Math.floor(Number(invioFedeliInput.value) || 0));
      const available = Number(invioFedeliInput.dataset.available || 0);
      if (sent > available) { resultConq.textContent = 'Non hai così tanti fedeli adiacenti!'; return; }
      const actuallyWithdrawn = withdrawFedeliFromAdjacent(selectedFaction, zoneId, sent);
      if (actuallyWithdrawn <= 0) { resultConq.textContent = 'Nessun fedele disponibile adiacente.'; return; }
      attemptConquestWithFaithBonus(zoneId, actuallyWithdrawn);
    });
  }

  document.getElementById('close-popup').addEventListener('click', () => hidePopup());

  function setInviaFedeliHandler(handler) {
    const newBtn = btnInviaFedeli.cloneNode(true);
    btnInviaFedeli.replaceWith(newBtn);
    btnInviaFedeli = newBtn;
    btnInviaFedeli.addEventListener('click', handler);
  }

  function disableAllButtons(container) {
    Array.from(container.querySelectorAll('button')).forEach(b => b.disabled = true);
  }

  function pickRandomEventForFaction(faction) {
    if (!allowEvents) return null;

    const base = GLOBAL_EVENTS[faction] || [];
    const pool = [];

    base.forEach(e => pool.push({ event: e, weight: 25 }));

    const sposta = base.find(ev => ev.tipo === 'sposta');
    if (sposta) pool.push({ event: sposta, weight: 45 });

    const possibleTribu = zonesAdjacentToFaction(faction);
    if (possibleTribu.length > 0) pool.push({ event: CONQUEST_EVENTS.find(e => e.tipo === 'conquista_tribu'), weight: 35 });

    const possEnemy = adjacentEnemyZones(faction);
    if (possEnemy.length > 0) pool.push({ event: CONQUEST_EVENTS.find(e => e.tipo === 'conquista_fazione'), weight: 30 });

    pool.push({ event: { id: 'small_boost', descrizione: 'Rituali locali portano a piccoli cambi', tipo: 'risorsa', opzioni: [ { testo: 'Celebra', modifiche: { fede: +5 } }, { testo: 'Risorse', modifiche: { materiali: +5 } } ], immagine: 'images/eventi/rituale.jpg' }, weight: 12 });

    function behaviorWeight(p) {
      const tipo = p.event ? p.event.tipo : null;
      let w = p.weight || 10;
      if (behaviorMode === 'aggressione_fazioni' && tipo && tipo.includes('fazione')) w += 40;
      if (behaviorMode === 'aggressione_tribu' && tipo && tipo.includes('tribu')) w += 50;
      if (behaviorMode === 'isolamento') { if (tipo === 'fedeli') w += 60; if (tipo === 'risorsa') w += 10; }
      return w;
    }

    const weighted = [];
    pool.forEach(p => {
      if (!p.event) return;
      if (p.event.tipo === 'conquista_tribu' && possibleTribu.length === 0) return;
      if (p.event.tipo === 'conquista_fazione' && possEnemy.length === 0) return;
      weighted.push({ event: p.event, weight: behaviorWeight(p) });
    });

    const total = weighted.reduce((s, w) => s + w.weight, 0);
    if (total <= 0) return null;

    let r = Math.random() * total;
    for (let i = 0; i < weighted.length; i++) {
      r -= weighted[i].weight;
      if (r <= 0) return weighted[i].event;
    }
    return weighted[weighted.length - 1].event;
  }

  function presentEvent(eventObj, faction) {
    if (!eventObj) return;
    if (eventActive) return;
    eventActive = true;
    allowEvents = false;

    eventDescEl.textContent = eventObj.descrizione || 'Evento';
    eventImgEl.src = eventObj.immagine || 'images/logoPiccolo.png';
    eventChoices.innerHTML = '';

    if (eventObj.tipo === 'sposta') {
      const myZones = factionState[faction].zones || [];
      if (myZones.length < 2) {
        const btn = document.createElement('button');
        btn.textContent = 'Ok';
        btn.addEventListener('click', () => { eventActive = false; setTimeout(() => endTurn(), 120); });
        eventChoices.appendChild(btn);
        return;
      }

      const info = document.createElement('div');
      info.textContent = 'Scegli sorgente e destinazione e la quantità.';
      eventChoices.appendChild(info);

      const selectFrom = document.createElement('select');
      myZones.forEach(zid => {
        const opt = document.createElement('option');
        opt.value = zid; opt.textContent = `#${zid} (g:${zones[zid].garrison||0})`;
        selectFrom.appendChild(opt);
      });

      const selectTo = document.createElement('select');
      myZones.forEach(zid => {
        const opt = document.createElement('option');
        opt.value = zid; opt.textContent = `#${zid} (g:${zones[zid].garrison||0})`;
        selectTo.appendChild(opt);
      });

      eventChoices.appendChild(selectFrom);
      eventChoices.appendChild(selectTo);

      const amountIn = document.createElement('input');
      amountIn.type = 'number'; amountIn.min = 1; amountIn.value = 3; amountIn.style.marginLeft = '8px';
      eventChoices.appendChild(amountIn);

      const doBtn = document.createElement('button');
      doBtn.textContent = 'Esegui trasferimento';
      doBtn.addEventListener('click', () => {
        disableAllButtons(eventChoices);
        const from = Number(selectFrom.value);
        const to = Number(selectTo.value);
        const amt = Math.max(1, Math.floor(Number(amountIn.value) || 0));
        if (from === to) { showTempMessage(eventChoices, 'Scegli zone diverse'); eventActive = false; allowEvents = true; return; }
        const available = zones[from].garrison || 0;
        const move = Math.min(available, amt);
        if (move <= 0) { showTempMessage(eventChoices, 'Nessun fedele disponibile'); eventActive = false; allowEvents = true; return; }

        zones[from].garrison -= move;
        zones[to].garrison = (zones[to].garrison || 0) + move;
        logEvent(`${FACTIONS[faction].name}: spostati ${move} fedeli da ${from} a ${to}`);
        drawZonesOverlay();

        eventActive = false;
        setTimeout(() => endTurn(), 200);
      });

      eventChoices.appendChild(doBtn);
      return;
    }

    if (eventObj.tipo && eventObj.tipo.startsWith('conquista_tribu')) {
      const candidates = zonesAdjacentToFaction(faction);
      if (candidates.length === 0) {
        const btn = document.createElement('button');
        btn.textContent = 'Ok';
        btn.addEventListener('click', () => { eventActive = false; setTimeout(() => endTurn(), 120); });
        eventChoices.appendChild(btn);
        return;
      }

      const info = document.createElement('div');
      info.textContent = `Seleziona tribù: ${candidates.join(', ')}`;
      eventChoices.appendChild(info);

      candidates.forEach(zid => {
        const b = document.createElement('button');
        b.textContent = `Attacca tribù ${zid} (dif:${zones[zid].defenders})`;
        b.addEventListener('click', () => {
          disableAllButtons(eventChoices);
          currentPopupZone = zid;
          popupTitle.textContent = `Attacco tribù #${zid}`;
          popupOwner.textContent = 'Tribù';
          popupDefenders.textContent = zones[zid].defenders;
          popupBonuses.textContent = zones[zid].bonuses.length ? zones[zid].bonuses.join(', ') : 'Nessuno';
          fedeliPopup.textContent = getFactionFedeli(selectedFaction);
          const availableAdj = ownedZonesAdjacentToZone(selectedFaction, zid).reduce((s, id) => s + (zones[id].garrison || 0), 0);
          invioFedeliInput.value = Math.max(1, Math.floor(availableAdj * 0.25) || 1);
          invioFedeliInput.dataset.available = availableAdj;
          resultConq.textContent = '';
          showPopup();

          setInviaFedeliHandler(() => {
            const sent = Math.max(1, Math.floor(Number(invioFedeliInput.value) || 0));
            const available = Number(invioFedeliInput.dataset.available || 0);
            if (sent > available) { resultConq.textContent = 'Non hai così tanti fedeli adiacenti!'; return; }
            const actuallyWithdrawn = withdrawFedeliFromAdjacent(selectedFaction, zid, sent);
            if (actuallyWithdrawn <= 0) { resultConq.textContent = 'Nessun fedele disponibile adiacente.'; return; }
            attemptConquestWithFaithBonus(zid, actuallyWithdrawn);
          });
        });
        eventChoices.appendChild(b);
      });
      return;
    }

    if (eventObj.tipo && eventObj.tipo.startsWith('conquista_fazione')) {
      const candidates = adjacentEnemyZones(faction);
      if (candidates.length === 0) {
        const btn = document.createElement('button');
        btn.textContent = 'Ok';
        btn.addEventListener('click', () => { eventActive = false; setTimeout(() => endTurn(), 120); });
        eventChoices.appendChild(btn);
        return;
      }

      const info = document.createElement('div');
      info.textContent = `Seleziona bersaglio: ${candidates.join(', ')}`;
      eventChoices.appendChild(info);

      candidates.forEach(zid => {
        const b = document.createElement('button');
        const ownerName = zones[zid].owner ? FACTIONS[zones[zid].owner].name : 'Nessuno';
        b.textContent = `Attacca ${zid} (dif:${zones[zid].defenders}) - ${ownerName}`;
        b.addEventListener('click', () => {
          disableAllButtons(eventChoices);
          currentPopupZone = zid;
          popupTitle.textContent = `Attacco zona #${zid}`;
          popupOwner.textContent = zones[zid].owner ? FACTIONS[zones[zid].owner].name : 'Nessuna';
          popupDefenders.textContent = zones[zid].defenders;
          popupBonuses.textContent = zones[zid].bonuses.length ? zones[zid].bonuses.join(', ') : 'Nessuno';
          fedeliPopup.textContent = getFactionFedeli(selectedFaction);
          const availableAdj = ownedZonesAdjacentToZone(selectedFaction, zid).reduce((s, id) => s + (zones[id].garrison || 0), 0);
          invioFedeliInput.value = Math.max(1, Math.floor(availableAdj * 0.25) || 1);
          invioFedeliInput.dataset.available = availableAdj;
          resultConq.textContent = '';
          showPopup();

          setInviaFedeliHandler(() => {
            const sent = Math.max(1, Math.floor(Number(invioFedeliInput.value) || 0));
            const available = Number(invioFedeliInput.dataset.available || 0);
            if (sent > available) { resultConq.textContent = 'Non hai così tanti fedeli adiacenti!'; return; }
            const actuallyWithdrawn = withdrawFedeliFromAdjacent(selectedFaction, zid, sent);
            if (actuallyWithdrawn <= 0) { resultConq.textContent = 'Nessun fedele disponibile adiacente.'; return; }
            attemptConquestWithFaithBonus(zid, actuallyWithdrawn);
          });
        });
        eventChoices.appendChild(b);
      });
      return;
    }

    if (eventObj.opzioni && Array.isArray(eventObj.opzioni)) {
      eventObj.opzioni.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.testo;
        btn.addEventListener('click', () => {
          disableAllButtons(eventChoices);
          applyModifications(opt.modifiche);
          logEvent(`${FACTIONS[faction].name}: ${eventObj.descrizione} -> ${opt.testo}`);

          eventActive = false;
          setTimeout(() => endTurn(), 220);
        });
        eventChoices.appendChild(btn);
      });
      return;
    }

    const okBtn = document.createElement('button');
    okBtn.textContent = 'Ok';
    okBtn.addEventListener('click', () => { disableAllButtons(eventChoices); eventActive = false; setTimeout(() => endTurn(), 120); });
    eventChoices.appendChild(okBtn);
  }

  function applyModifications(mods) {
    if (!mods) return;
    Object.keys(mods).forEach(k => {
      if (k === 'fedeli') {
        if (selectedFaction) addFedeliToFaction(selectedFaction, mods[k]);
        else stats.fedeli = Math.max(0, stats.fedeli + mods[k]);
      } else if (typeof stats[k] === 'number') {
        stats[k] = Math.max(0, stats[k] + mods[k]);
      }
    });
    updateStatsUI();
  }

  function computeConquestProbability(sent, defenders, factionBonus = 1.0) {
    if (sent <= 0) return 0.0;
    const odds = sent / (defenders + sent + 0.0001);
    let prob = odds * 0.9 + 0.05;
    prob *= factionBonus;
    return clamp(prob, 0.03, 0.97);
  }

  function attemptConquestWithFaithBonus(zoneId, sent) {
    const zone = zones[zoneId];
    if (!zone) return;
    if (zone.owner === selectedFaction) { resultConq.textContent = 'Controlli già questa zona.'; return; }

    const defendersBefore = zone.defenders;
    const factionBonus = FACTIONS[selectedFaction].conquestBonus;
    const faithBonus = 1 + stats.fede / 500;
    const prob = computeConquestProbability(sent, defendersBefore, factionBonus * faithBonus);
    const roll = Math.random();
    const success = roll <= prob;

    const casualties = computeCasualtiesRandom(sent, defendersBefore);
    const survivors = Math.max(0, sent - casualties);
    const defenderCas = computeDefenderCasualties(sent, defendersBefore);
    zone.defenders = Math.max(0, zone.defenders - defenderCas);

    resultConq.textContent = success ? `Conquista riuscita! Prob: ${(prob*100).toFixed(1)}%` : `Fallito. Prob: ${(prob*100).toFixed(1)}%`;

    logEvent(`${FACTIONS[selectedFaction].name}: tentato ${zoneId}, inviati ${sent} (morti ${casualties}, rientrati ${survivors}), dif persi ${defenderCas} -> ${success ? 'Successo' : 'Fallito'}`);

    if (success) {
      const captureFraction = 0.10 + Math.random() * 0.4;
      const defendersRemaining = Math.max(0, defendersBefore - defenderCas);
      const captured = Math.floor(defendersRemaining * captureFraction);
      if (captured > 0) logEvent(`Convertiti ${captured} difensori della zona ${zoneId}`);

      assignZoneToFaction(zoneId, selectedFaction);
      const baseNewGarrison = Math.max(5, Math.floor(sent * 0.6) + randInt(-2, 4));
      zones[zoneId].garrison = baseNewGarrison + captured + survivors;
      zones[zoneId].defenders = Math.max(3, zones[zoneId].defenders);

      drawZonesOverlay();
      placeIcons();
      hidePopup();
      checkEndConditions();

      eventActive = false;
      triggerConquestParticles(zoneId, true);
      setTimeout(() => endTurn(), 300);
    } else {
      zone.defenders += randInt(0, 2);
      if (survivors > 0) addFedeliToFaction(selectedFaction, survivors);
      drawZonesOverlay();

      triggerConquestParticles(zoneId, false);
      setTimeout(() => { hidePopup(); eventActive = false; setTimeout(() => endTurn(), 420); }, 700);
    }

    updateStatsUI();
  }

  function triggerConquestParticles(zoneId, success) {
    if (!effectsCtx || !canvas) return;
    const w = canvas.width / COLS;
    const h = canvas.height / ROWS;
    const cx = (zones[zoneId].col + 0.5) * w;
    const cy = (zones[zoneId].row + 0.5) * h;
    const particles = [];
    const count = success ? 36 : 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 2 + 1) * (success ? 1.6 : 0.9);
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        size: 2 + Math.random() * 4,
        color: success ? 'rgba(255,200,80,0.95)' : 'rgba(180,80,80,0.9)'
      });
    }
    let t0 = performance.now();
    function frame(ts) {
      const dt = ts - t0; t0 = ts;
      effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life += dt;
        const a = Math.max(0, 1 - p.life / 600);
        effectsCtx.globalAlpha = a;
        effectsCtx.fillStyle = p.color;
        effectsCtx.beginPath();
        effectsCtx.arc(p.x, p.y, p.size * (0.6 + Math.random() * 0.6), 0, Math.PI * 2);
        effectsCtx.fill();
      });
      effectsCtx.globalAlpha = 1;
      if (particles.some(p => p.life < 700)) requestAnimationFrame(frame); else effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    }
    requestAnimationFrame(frame);
  }

  function aiTurnForFaction(faction) {
    if (!factionState[faction].alive) return;
    const totalFed = getFactionFedeli(faction);
    if (totalFed <= 0) return;

    const enemyAdj = adjacentEnemyZones(faction);
    const tribuAdj  = zonesAdjacentToFaction(faction);

    if (Math.random() > 0.6) return;

    if (enemyAdj.length > 0 && Math.random() < 0.6) {
      const target = enemyAdj.sort((a, b) => zones[a].defenders - zones[b].defenders)[0];
      const availAdj = ownedZonesAdjacentToZone(faction, target).reduce((s, id) => s + (zones[id].garrison || 0), 0);
      const send = Math.max(1, Math.floor(availAdj * (0.25 + Math.random() * 0.25)));
      if (availAdj > 0) aiAttemptConquest(faction, target, send);
    } else if (tribuAdj.length > 0 && Math.random() < 0.7) {
      const target = tribuAdj.sort((a, b) => zones[a].defenders - zones[b].defenders)[0];
      const availAdj = ownedZonesAdjacentToZone(faction, target).reduce((s, id) => s + (zones[id].garrison || 0), 0);
      const send = Math.max(1, Math.floor(availAdj * (0.2 + Math.random() * 0.2)));
      if (availAdj > 0) aiAttemptConquest(faction, target, send);
    } else {
      const add = Math.max(1, Math.floor(totalFed * 0.08));
      addFedeliToFaction(faction, add);
      logEvent(`${FACTIONS[faction].name} rinforza (+${add})`);
    }
  }

  function aiAttemptConquest(attackerFaction, zoneId, requestedSend) {
    const zone = zones[zoneId];
    if (!zone || zone.owner === attackerFaction) return;

    const availAdj = ownedZonesAdjacentToZone(attackerFaction, zoneId).reduce((s, id) => s + (zones[id].garrison || 0), 0);
    const send = Math.min(availAdj, requestedSend);
    if (send <= 0) return;

    const withdrawn = withdrawFedeliFromAdjacent(attackerFaction, zoneId, send);
    const defendersBefore = zone.defenders;
    const prob = computeConquestProbability(withdrawn, defendersBefore, FACTIONS[attackerFaction].conquestBonus);
    const success = Math.random() <= prob;

    const casualties = computeCasualtiesRandom(withdrawn, defendersBefore);
    const survivors = Math.max(0, withdrawn - casualties);
    const defenderCas = computeDefenderCasualties(withdrawn, defendersBefore);
    zone.defenders = Math.max(0, zone.defenders - defenderCas);

    logEvent(`${FACTIONS[attackerFaction].name}: IA tenta ${zoneId} inviati ${withdrawn} (morti ${casualties}, dif persi ${defenderCas}) -> ${success ? 'OK' : 'No'}`);

    if (success) {
      const captureFraction = 0.10 + Math.random() * 0.4;
      const defendersRemaining = Math.max(0, defendersBefore - defenderCas);
      const captured = Math.floor(defendersRemaining * captureFraction);
      assignZoneToFaction(zoneId, attackerFaction);
      zones[zoneId].garrison = Math.max(5, Math.floor(withdrawn * 0.6) + randInt(-2, 4)) + captured + survivors;
      zones[zoneId].defenders = Math.max(3, zones[zoneId].defenders);

      placeIcons();
      drawZonesOverlay();
      checkEndConditions();
      triggerConquestParticles(zoneId, true);
    } else {
      zone.defenders += randInt(0, 2);
      if (survivors > 0) addFedeliToFaction(attackerFaction, survivors);
      drawZonesOverlay();
      triggerConquestParticles(zoneId, false);
    }
  }

  function endTurn() {
    turnNumber++;
    allowEvents = false;

    if (behaviorMode === 'isolamento') {
      stats.materiali = Math.min(999, stats.materiali + 8);
      stats.fede     = Math.min(999, stats.fede + 6);
      if (selectedFaction) addFedeliToFaction(selectedFaction, 2);
    } else if (behaviorMode === 'aggressione_tribu') {
      stats.fedeli = Math.min(999, stats.fedeli + 6);
    } else {
      stats.fede     = Math.min(999, stats.fede + 3);
      stats.materiali = Math.min(999, stats.materiali + 3);
    }

    reconcileFedeliAndDefenders();
    updateStatsUI();

    zones.forEach(z => {
      if (z.owner === null) {
        if (Math.random() < 0.12) z.defenders += randInt(1, 3);
      }
      if (z.owner) {
        if (Math.random() < 0.08) {
          if (z.owner === selectedFaction) stats.materiali = Math.min(999, stats.materiali + 2);
        }
      }
    });

    Object.keys(FACTIONS).forEach(f => { if (f !== selectedFaction) aiTurnForFaction(f); });

    allowEvents = true;
    TriggerAutomaticEvent();

    drawZonesOverlay();
    placeIcons();
    updateFactionAliveStatus();
    checkEndConditions();
  }

  function TriggerAutomaticEvent() {
    const ev = pickRandomEventForFaction(selectedFaction);
    if (ev) presentEvent(ev, selectedFaction);
  }

  function checkEndConditions() {
    if (!selectedFaction) return;
    if (factionState[selectedFaction].zones.length === 0) {
      logEvent(`GAME OVER per ${FACTIONS[selectedFaction].name}`);
      showEndScreen('lose', END_MESSAGES[selectedFaction].lose);
      return;
    }

    const otherF = Object.keys(FACTIONS).filter(f => f !== selectedFaction);
    const allDestroyed = otherF.every(f => factionState[f].zones.length === 0);
    if (allDestroyed) {
      logEvent(`VITTORIA per ${FACTIONS[selectedFaction].name}`);
      showEndScreen('win', END_MESSAGES[selectedFaction].win);
    }
  }

  function updateStatsUI() {
    const fedeEl = document.getElementById('fede');
    const fedeliEl = document.getElementById('fedeli');
    const materialiEl = document.getElementById('materiali');
    if (fedeEl) animateNumber(fedeEl, stats.fede);
    if (fedeliEl) fedeliEl.textContent = selectedFaction ? getFactionFedeli(selectedFaction) : stats.fedeli;
    if (materialiEl) animateNumber(materialiEl, stats.materiali);
    checkResourcesAndMaybeLose();
  }

  function animateNumber(el, target) {
    const start = Number(el.textContent) || 0;
    const diff = target - start;
    const dur = 350;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + diff * ease);
      if (p < 1) requestAnimationFrame(step);
      else {
        el.classList.add('stat-pulse');
        setTimeout(() => el.classList.remove('stat-pulse'), 300);
      }
    }
    requestAnimationFrame(step);
  }

  function checkResourcesAndMaybeLose() {
    if (!selectedFaction) return;
    const playerFedeli = getFactionFedeli(selectedFaction);
    if (stats.fede <= 0 || playerFedeli <= 0 || stats.materiali <= 0) {
      logEvent(`La fazione ${FACTIONS[selectedFaction].name} è stata distrutta per risorse esaurite.`);
      handleFactionDestroyed(selectedFaction);
      checkEndConditions();
    }
  }

  function handleFactionDestroyed(faction) {
    if (!FACTIONS[faction]) return;
    logEvent(`${FACTIONS[faction].name} perde per mancanza di risorse.`);
    const owned = factionState[faction].zones.slice();
    owned.forEach(zid => {
      const z = zones[zid];
      if (!z) return;
      z.owner = null;
      z.defenders = Math.max(3, randInt(3, 12));
      z.garrison = 0;
    });
    factionState[faction].zones = [];
    updateFactionAliveStatus();
    drawZonesOverlay();
    placeIcons();
    showEndScreen('lose', END_MESSAGES[faction].lose);
  }

  function showEndScreen(type, message) {
    allowEvents = false;
    eventActive = true;
    if (endScreen) {
      endTitle.textContent = type === 'win' ? 'Vittoria!' : 'Sconfitta';
      endMessage.textContent = message || '';
      endScreen.classList.remove('hidden');
      if (type === 'win') startConfetti(1200);
      else startSmoke(1200);
    }
  }

  function hideEndScreen() {
    if (endScreen) {
      endScreen.classList.add('hidden');
      if (confettiCtx) confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    }
    allowEvents = true;
    eventActive = false;
  }

  endRetry && endRetry.addEventListener('click', () => { location.reload(); });
  endHome && endHome.addEventListener('click', () => {
    hideEndScreen();
    const selezioneEl = document.querySelector('.selezione-fazioni');
    if (selezioneEl) selezioneEl.style.display = 'flex';
    const giocoSez = document.getElementById('gioco-sezione');
    if (giocoSez) giocoSez.style.display = 'none';
    const home = document.getElementById('home');
    if (home) { home.style.display = 'block'; setTimeout(()=>home.classList.add('active'),20); }
  });

  function startConfetti(duration) {
    if (!confettiCtx || !confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const confetti = [];
    const colors = ['#ff6a2b','#ffd166','#4ecdc4','#ff2f2f','#ffd1f0'];
    for (let i = 0; i < 120; i++) {
      confetti.push({ x: Math.random()*confettiCanvas.width, y: Math.random()*-confettiCanvas.height*0.5, vy:2+Math.random()*5, vx:-2+Math.random()*4, size:6+Math.random()*8, angle:Math.random()*Math.PI*2, spin:-0.1+Math.random()*0.2, color:colors[Math.floor(Math.random()*colors.length)] });
    }
    const start = Date.now();
    function frame() {
      confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      confetti.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.angle += p.spin;
        confettiCtx.save();
        confettiCtx.translate(p.x,p.y);
        confettiCtx.rotate(p.angle);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
        confettiCtx.restore();
      });
      if (Date.now() - start < duration) requestAnimationFrame(frame); else confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    }
    frame();
  }

  function startSmoke(duration) {
    if (!confettiCtx || !confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    const particles = [];
    for (let i = 0; i < 80; i++) particles.push({ x: window.innerWidth*0.5 + Math.random()*400-200, y: window.innerHeight*0.5 + Math.random()*200-100, vy:-0.3-Math.random()*1.2, vx:-0.4+Math.random()*0.8, alpha:0.1+Math.random()*0.2, size:30+Math.random()*80 });
    const start = Date.now();
    function frame() {
      confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= 0.999;
        const g = confettiCtx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
        g.addColorStop(0,`rgba(60,60,60,${p.alpha*0.6})`);
        g.addColorStop(1,'rgba(20,20,20,0)');
        confettiCtx.fillStyle = g;
        confettiCtx.fillRect(p.x-p.size,p.y-p.size,p.size*2,p.size*2);
      });
      if (Date.now() - start < duration) requestAnimationFrame(frame); else confettiCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    }
    frame();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const img = document.getElementById('mappa-img');
    if (img && img.complete) setupCanvas(); else if (img) img.addEventListener('load', setupCanvas);

    document.querySelectorAll('.fazione-box').forEach(box => {
      box.addEventListener('click', () => {
        const choice = box.dataset.fazione;
        if (!choice) return;
        selectedFaction = choice;

        const selezioneEl = document.querySelector('.selezione-fazioni');
        if (selezioneEl) {
          selezioneEl.style.transition = 'opacity 0.6s';
          selezioneEl.style.opacity = '0';
        }

        initZones();
        assignStartingZones();
        updateStatsUI();

        setTimeout(() => {
          if (selezioneEl) selezioneEl.style.display = 'none';
          const giocoSez = document.getElementById('gioco-sezione');
          if (giocoSez) giocoSez.style.display = 'block';
          if (typeof resizeCanvasFn === 'function') resizeCanvasFn(); else window.dispatchEvent(new Event('resize'));
          drawZonesOverlay();
          placeIcons();

          const container = document.getElementById('mappa-container');
          if (container) {
            container.classList.add('map-intro');
            setTimeout(() => container.classList.remove('map-intro'), 900);
          }

          staggerIconBounce();

          const ev0 = pickRandomEventForFaction(selectedFaction);
          if (ev0) setTimeout(() => presentEvent(ev0, selectedFaction), 300);

        }, 600);
      });
    });

    const behaviorSelect = document.getElementById('comportamento');
    if (behaviorSelect) {
      behaviorSelect.addEventListener('change', e => { behaviorMode = e.target.value; logEvent(`Comportamento impostato su ${behaviorMode}`); });
    }

    logEvent('Gioco iniziato. Scegli una fazione per cominciare.');
  });

  function staggerIconBounce() {
    const icons = Array.from(document.querySelectorAll('.zone-icon'));
    icons.forEach((ic, i) => {
      setTimeout(() => { ic.classList.add('icon-bounce'); setTimeout(() => ic.classList.remove('icon-bounce'), 900); }, i * 60);
    });
  }

  window.__GAME = {
    attemptConquestWithFaithBonus,
    withdrawFedeliFromAdjacent,
    addFedeliToFaction,
    TriggerAutomaticEvent: function () { const ev = pickRandomEventForFaction(selectedFaction); presentEvent(ev, selectedFaction); },
    endTurn,
    getFactionFedeli
  };

})();


