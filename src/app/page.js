'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  tSuit,
  tVal,
  tName,
  canWinRaw,
  canWinWith,
  calcHan,
  getChiOpts,
  tileToFileId,
  delay
} from '@/utils/mahjong';

export default function GamePage() {
  // --- React State for rendering ---
  const [score, setScore] = useState(10000);
  const [round, setRound] = useState(1);
  const [wallCount, setWallCount] = useState(0);
  const [hands, setHands] = useState([[], [], [], []]);
  const [discards, setDiscards] = useState([[], [], [], []]);
  const [melds, setMelds] = useState([[], [], [], []]);
  const [curPlayer, setCurPlayer] = useState(0);
  const [drawnTile, setDrawnTile] = useState(null);
  const [lastDisc, setLastDisc] = useState(null);
  const [lastDiscP, setLastDiscP] = useState(-1);
  const [newTileIdx, setNewTileIdx] = useState(-1);
  const [selIdx, setSelIdx] = useState(-1);
  const [waitDisc, setWaitDisc] = useState(false);

  // UI state
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [loadStatusText, setLoadStatusText] = useState('');
  const [loadStatusShow, setLoadStatusShow] = useState(false);
  const [coinBtnDisabled, setCoinBtnDisabled] = useState(false);

  const [actionPanelOptions, setActionPanelOptions] = useState([]);
  const [messageBoardText, setMessageBoardText] = useState('');
  const [messageBoardShow, setMessageBoardShow] = useState(false);

  const [resultScreenActive, setResultScreenActive] = useState(false);
  const [resultScreenData, setResultScreenData] = useState(null);

  // SVG Caching
  const [svgCache, setSvgCache] = useState({});
  const [svgLoadedCount, setSvgLoadedCount] = useState(0);

  // --- Refs to manage async game state (prevents stale closures) ---
  const gameRef = useRef({
    score: 10000,
    round: 1,
    dealer: 0,
    running: false,
    wall: [],
    hands: [[], [], [], []],
    discards: [[], [], [], []],
    melds: [[], [], [], []],
    curPlayer: 0,
    drawnTile: null,
    lastDisc: null,
    lastDiscP: -1,
    newTileIdx: -1,
    selIdx: -1,
    _waitDisc: false
  });

  const userIdRef = useRef('');
  const resolveDiscRef = useRef(null);
  const resolveActRef = useRef(null);

  // Keep references to functions in refs to avoid stale closure references
  const showActsRef = useRef(null);
  const endGameRef = useRef(null);
  const playerDiscardRef = useRef(null);
  const aiDiscardRef = useRef(null);
  const checkOthersRef = useRef(null);
  const gameLoopRef = useRef(null);

  // Synchronize async gameRef state to React states
  const syncState = () => {
    const g = gameRef.current;
    setScore(g.score);
    setRound(g.round);
    setWallCount(g.wall.length);
    setHands(g.hands.map(h => [...h]));
    setDiscards(g.discards.map(d => [...d]));
    setMelds(g.melds.map(m => [...m]));
    setCurPlayer(g.curPlayer);
    setDrawnTile(g.drawnTile);
    setLastDisc(g.lastDisc);
    setLastDiscP(g.lastDiscP);
    setNewTileIdx(g.newTileIdx);
    setSelIdx(g.selIdx);
    setWaitDisc(g._waitDisc);
  };

  // --- User Initialization (Anonymous Sync with SQLite - data/mahjong-90s.db) ---
  useEffect(() => {
    async function initUser() {
      let localId = localStorage.getItem('street_mahjong_user_id');
      if (!localId) {
        localId = typeof crypto.randomUUID === 'function' 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('street_mahjong_user_id', localId);
      }
      userIdRef.current = localId;

      try {
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: localId })
        });
        if (res.ok) {
          const data = await res.json();
          gameRef.current.score = data.user.chips;
          setScore(data.user.chips);
        }
      } catch (err) {
        console.error('Failed to sync user with database:', err);
      }
    }
    initUser();
  }, []);

  // --- Preload and Clean local SVGs ---
  const cleanSvg = (txt) => {
    // Remove XML declarations
    txt = txt.replace(/<\?xml[^?]*\?>/g, '');
    // Replace solid white backgrounds and flat borders with transparent styles
    txt = txt.replace(/#f5f6f7/gi, 'transparent');
    txt = txt.replace(/#93989c/gi, 'transparent');
    return txt;
  };

  const preloadAssets = async () => {
    setLoadStatusShow(true);
    setLoadStatusText('正在加載本地矢量圖資源...');
    const cache = {};
    let loaded = 0;

    for (let i = 0; i < 34; i++) {
      const fid = tileToFileId(i);
      try {
        const resp = await fetch(`/vectors/SVG/${fid}.svg`);
        if (resp.ok) {
          const txt = await resp.text();
          cache[i] = cleanSvg(txt);
          loaded++;
          setSvgLoadedCount(loaded);
          setLoadStatusText(`加載本地矢量圖 ${loaded}/34`);
        }
      } catch (e) {
        console.error(`Failed to load SVG for ${fid}:`, e);
      }
    }
    setSvgCache(cache);
    await delay(300);
    setLoadStatusShow(false);
    return loaded;
  };

  // --- Game Mechanics logic using async helper functions ---
  const initWall = () => {
    const wall = [];
    for (let t = 0; t < 34; t++) {
      for (let i = 0; i < 4; i++) {
        wall.push(t);
      }
    }
    // Shuffle
    for (let i = wall.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = wall[i];
      wall[i] = wall[j];
      wall[j] = tmp;
    }
    gameRef.current.wall = wall;
  };

  const deal = () => {
    const g = gameRef.current;
    g.hands = [[], [], [], []];
    g.discards = [[], [], [], []];
    g.melds = [[], [], [], []];
    g.drawnTile = null;
    g.lastDisc = null;
    g.lastDiscP = -1;
    g.newTileIdx = -1;
    g.selIdx = -1;

    for (let p = 0; p < 4; p++) {
      for (let i = 0; i < 13; i++) {
        g.hands[p].push(g.wall.pop());
      }
      sortH(p);
    }
  };

  const sortH = (p) => {
    gameRef.current.hands[p].sort((a, b) => a - b);
  };

  const draw = (p) => {
    const g = gameRef.current;
    if (g.wall.length === 0) return -1;
    const t = g.wall.pop();
    g.hands[p].push(t);
    sortH(p);
    let idx = -1;
    for (let i = g.hands[p].length - 1; i >= 0; i--) {
      if (g.hands[p][i] === t) {
        idx = i;
        break;
      }
    }
    g.newTileIdx = idx;
    g.drawnTile = t;
    return t;
  };

  const doDiscard = (p, idx) => {
    const g = gameRef.current;
    const t = g.hands[p].splice(idx, 1)[0];
    g.discards[p].push(t);
    g.lastDisc = t;
    g.lastDiscP = p;
    g.newTileIdx = -1;
    g.drawnTile = null;
    return t;
  };

  const doPon = (p, tile) => {
    const g = gameRef.current;
    g.discards[g.lastDiscP].pop();
    let rm = 0;
    g.hands[p] = g.hands[p].filter(t => {
      if (t === tile && rm < 2) {
        rm++;
        return false;
      }
      return true;
    });
    g.melds[p].push({ type: 'pon', tiles: [tile, tile, tile] });
    g.lastDisc = null;
    sortH(p);
  };

  const doMinkan = (p, tile) => {
    const g = gameRef.current;
    g.discards[g.lastDiscP].pop();
    let rm = 0;
    g.hands[p] = g.hands[p].filter(t => {
      if (t === tile && rm < 3) {
        rm++;
        return false;
      }
      return true;
    });
    g.melds[p].push({ type: 'kan', tiles: [tile, tile, tile, tile] });
    g.lastDisc = null;
    sortH(p);
  };

  const doAnkan = (p, tile) => {
    const g = gameRef.current;
    let rm = 0;
    g.hands[p] = g.hands[p].filter(t => {
      if (t === tile && rm < 4) {
        rm++;
        return false;
      }
      return true;
    });
    g.melds[p].push({ type: 'ankan', tiles: [tile, tile, tile, tile] });
    sortH(p);
  };

  const doChi = (p, tile, fromHand) => {
    const g = gameRef.current;
    g.discards[g.lastDiscP].pop();
    for (let i = 0; i < fromHand.length; i++) {
      const idx = g.hands[p].indexOf(fromHand[i]);
      if (idx >= 0) g.hands[p].splice(idx, 1);
    }
    const mt = fromHand.slice();
    mt.push(tile);
    mt.sort((a, b) => a - b);
    g.melds[p].push({ type: 'chi', tiles: mt });
    g.lastDisc = null;
    sortH(p);
  };

  const canPon = (p, tile) => {
    let c = 0;
    for (let i = 0; i < gameRef.current.hands[p].length; i++) {
      if (gameRef.current.hands[p][i] === tile) c++;
    }
    return c >= 2;
  };

  const canMinkan = (p, tile) => {
    let c = 0;
    for (let i = 0; i < gameRef.current.hands[p].length; i++) {
      if (gameRef.current.hands[p][i] === tile) c++;
    }
    return c >= 3;
  };

  const getAnkan = (p) => {
    const c = new Array(34).fill(0);
    for (let i = 0; i < gameRef.current.hands[p].length; i++) {
      c[gameRef.current.hands[p][i]]++;
    }
    const r = [];
    for (let t = 0; t < 34; t++) {
      if (c[t] === 4) r.push(t);
    }
    return r;
  };

  const aiPick = (p) => {
    const hand = gameRef.current.hands[p];
    if (hand.length === 0) return 0;
    const c = new Array(34).fill(0);
    for (let i = 0; i < hand.length; i++) c[hand[i]]++;
    let worst = 0;
    let ws = 9999;
    for (let i = 0; i < hand.length; i++) {
      const t = hand[i];
      let s = c[t] * 10;
      if (t < 27) {
        const v = tVal(t);
        if (v > 1 && c[t - 1] > 0) s += 6;
        if (v < 9 && c[t + 1] > 0) s += 6;
        if (v > 2 && c[t - 2] > 0) s += 3;
        if (v < 8 && c[t + 2] > 0) s += 3;
      }
      if (t >= 27 && c[t] === 1) s -= 5;
      if (s < ws) {
        ws = s;
        worst = i;
      }
    }
    return worst;
  };

  const aiWantPon = (p, tile) => {
    let c = 0;
    for (let i = 0; i < gameRef.current.hands[p].length; i++) {
      if (gameRef.current.hands[p][i] === tile) c++;
    }
    return c >= 3 ? true : Math.random() > 0.3;
  };

  // --- Assign Ref callbacks to handle async game loop flows ---
  showActsRef.current = (acts) => {
    return new Promise((resolve) => {
      setActionPanelOptions(acts);
      resolveActRef.current = resolve;
    });
  };

  endGameRef.current = async (winner, winTile, isTsumo) => {
    const g = gameRef.current;
    if (!g.running) return;
    g.running = false;
    g._waitDisc = false;
    syncState();

    if (winner === -1) {
      showMsg('流局');
      // Save draw round to database
      try {
        await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userIdRef.current,
            round: g.round,
            outcome: 'draw',
            scoreChange: 0,
            newChips: g.score
          })
        });
      } catch (e) {
        console.error('Failed to sync draw outcome:', e);
      }

      setTimeout(() => {
        hideMsg();
        showResult(-1, null, false, 0);
      }, 1400);
      return;
    }

    const hand = g.hands[winner];
    const melds = g.melds[winner];
    const res = calcHan(hand, melds, isTsumo);
    const base = Math.pow(2, res.han + 2) * 100;
    const pts = Math.min(base, 32000);

    let scoreChange = 0;
    let outcome = 'loss';
    if (winner === 0) {
      g.score += pts;
      scoreChange = pts;
      outcome = 'win';
      showMsg(res.han >= 6 ? '滿貫!' : '胡牌!');
      if (res.han >= 6) triggerFlashFx();
    } else {
      const loss = Math.min(pts, 2000);
      g.score = Math.max(0, g.score - loss);
      scoreChange = -loss;
      showMsg(tName(winTile) + ' 胡了');
    }
    syncState();

    // Sync score/outcome with SQLite
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userIdRef.current,
          round: g.round,
          outcome,
          scoreChange,
          newChips: g.score,
          yakuDetails: winner === 0 ? res : null
        })
      });
    } catch (e) {
      console.error('Failed to sync win/loss outcome:', e);
    }

    setTimeout(() => {
      hideMsg();
      setActionPanelOptions([]);
      showResult(winner, res, isTsumo, pts);
    }, 1500);
  };

  playerDiscardRef.current = async () => {
    const g = gameRef.current;
    const acts = [];
    if (canWinRaw(g.hands[0])) {
      acts.push({ type: 'win', label: '自模', cls: 'abW', key: 'H' });
    }
    const ankans = getAnkan(0);
    for (let i = 0; i < ankans.length; i++) {
      acts.push({
        type: 'ankan',
        tile: ankans[i],
        label: '暗槓 ' + tName(ankans[i]),
        cls: 'abK',
        key: 'K'
      });
    }

    if (acts.length > 0) {
      acts.push({ type: 'pass', label: '跳過', cls: 'abS', key: 'Space' });
      const ch = await showActsRef.current(acts);
      if (ch.type === 'win') {
        await endGameRef.current(0, g.drawnTile, true);
        return -1;
      }
      if (ch.type === 'ankan') {
        doAnkan(0, ch.tile);
        const d2 = draw(0);
        if (d2 < 0) {
          await endGameRef.current(-1, null, false);
          return -1;
        }
        syncState();
        return await playerDiscardRef.current();
      }
    }

    g._waitDisc = true;
    g.selIdx = Math.max(0, g.hands[0].length - 1);
    syncState();

    const idx = await new Promise((resolve) => {
      resolveDiscRef.current = resolve;
    });
    g._waitDisc = false;
    return idx;
  };

  aiDiscardRef.current = async (p) => {
    const g = gameRef.current;
    await delay(350);
    if (canWinRaw(g.hands[p])) {
      await endGameRef.current(p, g.drawnTile, true);
      return -1;
    }
    const ak = getAnkan(p);
    if (ak.length > 0 && Math.random() > 0.4) {
      doAnkan(p, ak[0]);
      const d2 = draw(p);
      if (d2 < 0) {
        await endGameRef.current(-1, null, false);
        return -1;
      }
      syncState();
      return await aiDiscardRef.current(p);
    }
    return aiPick(p);
  };

  checkOthersRef.current = async (discP) => {
    const g = gameRef.current;
    const tile = g.lastDisc;
    if (tile === null || tile === undefined) return 'none';

    // Verify if anyone can win on this discard
    for (let i = 1; i <= 3; i++) {
      const p = (discP + i) % 4;
      if (canWinWith(g.hands[p], tile)) {
        if (p === 0) {
          const ch = await showActsRef.current([
            { type: 'win', label: '胡牌', cls: 'abW', key: 'H' },
            { type: 'pass', label: '跳過', cls: 'abS', key: 'Space' }
          ]);
          if (ch.type === 'win') {
            doPon(0, tile);
            await endGameRef.current(0, tile, false);
            return 'win';
          }
        } else {
          doPon(p, tile);
          await endGameRef.current(p, tile, false);
          return 'win';
        }
      }
    }

    // Verify if anyone can Pon/Kan
    for (let i = 1; i <= 3; i++) {
      const p = (discP + i) % 4;
      const cP = canPon(p, tile);
      const cK = canMinkan(p, tile);
      if (!cP && !cK) continue;

      if (p === 0) {
        const acts = [];
        if (cK) acts.push({ type: 'kan', label: '槓', cls: 'abK', key: 'K' });
        if (cP) acts.push({ type: 'pon', label: '碰', cls: 'abP', key: 'P' });
        acts.push({ type: 'pass', label: '跳過', cls: 'abS', key: 'Space' });

        const ch = await showActsRef.current(acts);
        if (ch.type === 'kan') {
          doMinkan(0, tile);
          syncState();
          return { player: 0, skipDraw: false };
        }
        if (ch.type === 'pon') {
          doPon(0, tile);
          syncState();
          return { player: 0, skipDraw: true };
        }
      } else {
        if (cK && aiWantPon(p, tile)) {
          doMinkan(p, tile);
          syncState();
          return { player: p, skipDraw: false };
        }
        if (cP && aiWantPon(p, tile)) {
          doPon(p, tile);
          syncState();
          return { player: p, skipDraw: true };
        }
      }
    }

    // Verify if next player can Chow (Chi)
    const nextP = (discP + 1) % 4;
    const chiOpts = getChiOpts(g.hands[nextP], tile);
    if (chiOpts.length > 0) {
      if (nextP === 0) {
        const acts = [];
        for (let j = 0; j < chiOpts.length; j++) {
          const nm = chiOpts[j].map(t => tName(t)).join('');
          acts.push({ type: 'chi', chiIdx: j, label: '吃 ' + nm, cls: 'abC', key: 'C' });
        }
        acts.push({ type: 'pass', label: '跳過', cls: 'abS', key: 'Space' });

        const ch = await showActsRef.current(acts);
        if (ch.type === 'chi') {
          const opt = chiOpts[ch.chiIdx];
          const fromH = opt.filter(t => t !== tile);
          doChi(0, tile, fromH);
          syncState();
          return { player: 0, skipDraw: true };
        }
      } else {
        if (Math.random() > 0.5) {
          const fromH = chiOpts[0].filter(t => t !== tile);
          doChi(nextP, tile, fromH);
          syncState();
          return { player: nextP, skipDraw: true };
        }
      }
    }

    return 'none';
  };

  gameLoopRef.current = async (initP, initSkip) => {
    const g = gameRef.current;
    let p = initP;
    let skipDraw = initSkip;

    while (g.running) {
      if (g.wall.length === 0 && !skipDraw) {
        await endGameRef.current(-1, null, false);
        return;
      }

      g.curPlayer = p;
      if (!skipDraw) {
        const drawn = draw(p);
        if (drawn < 0) {
          await endGameRef.current(-1, null, false);
          return;
        }
      } else {
        g.drawnTile = null;
        g.newTileIdx = -1;
        skipDraw = false;
      }

      g.selIdx = Math.max(0, g.hands[p].length - 1);
      syncState();

      let discIdx;
      if (p === 0) {
        discIdx = await playerDiscardRef.current();
      } else {
        discIdx = await aiDiscardRef.current(p);
      }

      if (!g.running) return;
      if (discIdx < 0) return;

      doDiscard(p, discIdx);
      syncState();

      if (p !== 0) await delay(200);

      const result = await checkOthersRef.current(p);
      if (!g.running) return;
      if (result === 'win') return;

      if (result === 'none') {
        p = (p + 1) % 4;
        skipDraw = false;
      } else {
        p = result.player;
        skipDraw = result.skipDraw;
      }
    }
  };

  const startGame = async () => {
    const g = gameRef.current;
    g.running = true;
    initWall();
    deal();
    syncState();
    await gameLoopRef.current(g.dealer, false);
  };

  // --- Keyboard Bindings ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const g = gameRef.current;
      if (g._waitDisc && g.running) {
        const len = g.hands[0].length;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          g.selIdx = Math.max(0, g.selIdx - 1);
          syncState();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          g.selIdx = Math.min(len - 1, g.selIdx + 1);
          syncState();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (resolveDiscRef.current) {
            const resolve = resolveDiscRef.current;
            resolveDiscRef.current = null;
            resolve(g.selIdx);
          }
        }
      }

      const k = e.key.toUpperCase();
      if (k === 'H') triggerClickAB('abW');
      if (k === 'P') triggerClickAB('abP');
      if (k === 'K') triggerClickAB('abK');
      if (k === 'C') triggerClickAB('abC');
      if (e.key === ' ') {
        e.preventDefault();
        triggerClickAB('abS');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerClickAB = (cls) => {
    // Proactively resolve actionPanel options based on hotkey key matches
    const act = actionPanelOptions.find(o => {
      if (cls === 'abW' && o.key === 'H') return true;
      if (cls === 'abP' && o.key === 'P') return true;
      if (cls === 'abK' && o.key === 'K') return true;
      if (cls === 'abC' && o.key === 'C') return true;
      if (cls === 'abS' && o.key === 'Space') return true;
      return false;
    });

    if (act && resolveActRef.current) {
      setActionPanelOptions([]);
      const resolve = resolveActRef.current;
      resolveActRef.current = null;
      resolve(act);
    }
  };

  // --- UI Helpers ---
  const showMsg = (txt) => {
    setMessageBoardText(txt);
    setMessageBoardShow(true);
  };

  const hideMsg = () => {
    setMessageBoardShow(false);
  };

  const showResult = (winner, res, isTsumo, pts) => {
    setResultScreenData({ winner, res, isTsumo, pts });
    setResultScreenActive(true);
  };

  const triggerFlashFx = () => {
    const f = document.createElement('div');
    f.className = 'mF';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 750);
  };

  const handleCoinBtnClick = async () => {
    setCoinBtnDisabled(true);
    const loaded = await preloadAssets();
    setShowStartScreen(false);
    startGame();
  };

  const handleNextRoundClick = () => {
    setResultScreenActive(false);
    setActionPanelOptions([]);
    gameRef.current.round++;
    startGame();
  };

  const handleActionClick = (act) => {
    setActionPanelOptions([]);
    if (resolveActRef.current) {
      const resolve = resolveActRef.current;
      resolveActRef.current = null;
      resolve(act);
    }
  };

  const handleTileClick = (idx) => {
    const g = gameRef.current;
    if (!g._waitDisc || !g.running) return;
    g.selIdx = idx;
    syncState();
    if (resolveDiscRef.current) {
      const resolve = resolveDiscRef.current;
      resolveDiscRef.current = null;
      resolve(idx);
    }
  };

  return (
    <div id="app">
      {/* START SCREEN */}
      {showStartScreen && (
        <div id="startScreen">
          <div className="titleMain">大滿貫</div>
          <div className="titleSub">ARCADE MAHJONG</div>
          <div className="decoLine"></div>
          <button 
            className="coinBtn" 
            id="coinBtn" 
            onClick={handleCoinBtnClick}
            disabled={coinBtnDisabled}
          >
            投 幣 開 始
          </button>
          <div className="coinLabel">INSERT COIN TO START</div>
          <div id="loadStatus" className={loadStatusShow ? 'show' : ''}>
            {loadStatusText}
          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      <div id="gameScreen" className={!showStartScreen ? 'active' : ''}>
        <div id="topBar">
          <span className="bI">籌碼 <span className="bS" id="elS">{score}</span></span>
          <span className="bI bR" id="elR">第 {round} 局</span>
          <span className="bI" id="elRm">殘 {wallCount}</span>
        </div>
        
        <div id="gameMain">
          {/* Opponent (Top / 对家) */}
          <div id="aTop">
            <span className="pL">對家 <span>({hands[2]?.length || 0})</span></span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {hands[2]?.map((_, i) => (
                <div key={i} className="tile tB szV" />
              ))}
            </div>
          </div>

          <div id="aMid">
            {/* Left Player (左家) */}
            <div id="aLeft">
              <span className="pL">左家 <span>({hands[1]?.length || 0})</span></span>
              {hands[1]?.slice(0, 14).map((_, i) => (
                <div key={i} className="tile tB szV" />
              ))}
            </div>

            {/* Central Pool (牌河) */}
            <div id="aCenter">
              <div id="dPool">
                {discards.map((pDiscards, pIdx) => (
                  pDiscards.map((t, idx) => {
                    const isLast = pIdx === lastDiscP && idx === pDiscards.length - 1 && lastDisc !== null;
                    return (
                      <div 
                        key={`${pIdx}-${idx}`} 
                        className={`tile tF szM ${isLast ? 'ld' : ''}`}
                        dangerouslySetInnerHTML={{ __html: svgCache[t] || '' }}
                      />
                    );
                  })
                ))}
              </div>
            </div>

            {/* Right Player (右家) */}
            <div id="aRight">
              <span className="pL">右家 <span>({hands[3]?.length || 0})</span></span>
              {hands[3]?.slice(0, 14).map((_, i) => (
                <div key={i} className="tile tB szV" />
              ))}
            </div>
          </div>

          {/* Player (Bottom / 手牌) */}
          <div id="aBot">
            {/* Declared Melds / 副露 */}
            <div id="meldRow">
              {melds[0]?.map((meld, mIdx) => (
                <div key={mIdx} className="mg">
                  {meld.tiles.map((t, tIdx) => (
                    <div 
                      key={tIdx} 
                      className="tile tF szM"
                      dangerouslySetInnerHTML={{ __html: svgCache[t] || '' }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Hand Tiles */}
            <div id="handRow">
              {hands[0]?.map((t, i) => {
                let cls = 'ht';
                if (newTileIdx === i && waitDisc) cls += ' tNew';
                if (waitDisc && i === selIdx) cls += ' tSel';
                return (
                  <div 
                    key={i} 
                    className={`tile tF szN ${cls}`}
                    onClick={() => handleTileClick(i)}
                    dangerouslySetInnerHTML={{ __html: svgCache[t] || '' }}
                  />
                );
              })}
            </div>

            <div id="keyH">←→ 選牌 | Enter 出牌 | H 胡 | P 碰 | K 槓 | C 吃 | 空格 跳過</div>
          </div>
        </div>

        {/* Action Panel */}
        <div id="actP" className={actionPanelOptions.length > 0 ? 'show' : ''}>
          {actionPanelOptions.map((opt, i) => (
            <button 
              key={i} 
              className={`ab ${opt.cls}`} 
              onClick={() => handleActionClick(opt)}
            >
              {opt.label}
              <span className="kT">{opt.key}</span>
            </button>
          ))}
        </div>

        {/* Overlay Message Board */}
        <div id="msgB" className={messageBoardShow ? 'show' : ''}>
          {messageBoardText}
        </div>
      </div>

      {/* RESULT SCREEN */}
      {resultScreenActive && resultScreenData && (
        <div id="resS" className="active">
          <div className={`rT ${resultScreenData.winner === 0 ? 'rW' : 'rL'}`}>
            {resultScreenData.winner === -1 ? '流局' : resultScreenData.winner === 0 ? '恭喜胡牌' : '惜敗'}
          </div>
          <div className="rTi">
            {resultScreenData.winner === 0 && hands[0]?.map((t, i) => (
              <div 
                key={i} 
                className="tile tF szM"
                dangerouslySetInnerHTML={{ __html: svgCache[t] || '' }}
              />
            ))}
          </div>
          <div className="rI">
            {resultScreenData.winner === -1 
              ? '無人胡牌' 
              : resultScreenData.winner === 0 && resultScreenData.res
                ? `${resultScreenData.res.yaku.join(' · ')} (${resultScreenData.res.han}番)`
                : '對手胡牌'}
          </div>
          <div className={`rSc ${resultScreenData.winner === 0 ? 'rP' : 'rM'}`}>
            {resultScreenData.winner === -1 
              ? '' 
              : resultScreenData.winner === 0 
                ? `+${resultScreenData.pts}` 
                : `-${Math.min(resultScreenData.pts, 2000)}`}
          </div>
          <button className="nBtn" id="nBtn" onClick={handleNextRoundClick}>
            繼續對局
          </button>
        </div>
      )}
    </div>
  );
}
