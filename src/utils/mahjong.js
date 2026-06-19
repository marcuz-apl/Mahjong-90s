export const NUM_CH = ['壹', '貳', '叁', '肆', '伍', '陸', '柒', '捌', '玖'];
export const SUIT_CH = ['萬', '筒', '條'];
export const WIND_CH = ['東', '南', '西', '北'];
export const JIAN_CH = ['中', '發', '白'];

export function tSuit(t) {
  return t < 9 ? 0 : t < 18 ? 1 : t < 27 ? 2 : t < 31 ? 3 : 4;
}

export function tVal(t) {
  return t < 9 ? t + 1 : t < 18 ? t - 8 : t < 27 ? t - 17 : t < 31 ? t - 26 : t - 30;
}

export function tName(t) {
  const s = tSuit(t);
  const v = tVal(t);
  if (s < 3) return NUM_CH[v - 1] + SUIT_CH[s];
  if (s === 3) return WIND_CH[v - 1];
  return JIAN_CH[v - 1];
}

export function isNum(t) {
  return t < 27;
}

// Fixed index-to-file mapping for local SVG assets
// vectors/SVG contains 1m-9m, 1p-9p, 1s-9s, 1z-7z.
// East (27) -> 1z, South (28) -> 2z, West (29) -> 3z, North (30) -> 4z
// Red Dragon 中 (31) -> 7z, Green Dragon 發 (32) -> 6z, White Dragon 白 (33) -> 5z
export function tileToFileId(t) {
  const s = tSuit(t);
  const v = tVal(t);
  if (s === 0) return v + 'm';
  if (s === 1) return v + 'p';
  if (s === 2) return v + 's';
  
  if (t === 27) return '1z';
  if (t === 28) return '2z';
  if (t === 29) return '3z';
  if (t === 30) return '4z';
  if (t === 31) return '7z'; // 中
  if (t === 32) return '6z'; // 發
  if (t === 33) return '5z'; // 白
  return '';
}

export function canWinRaw(tiles) {
  if (tiles.length % 3 !== 2) return false;
  const c = new Array(34).fill(0);
  for (let i = 0; i < tiles.length; i++) c[tiles[i]]++;
  
  for (let t = 0; t < 34; t++) {
    if (c[t] >= 2) {
      c[t] -= 2;
      if (_ckM(c)) {
        c[t] += 2;
        return true;
      }
      c[t] += 2;
    }
  }
  
  // 七对子 check
  if (tiles.length === 14) {
    let ok = true;
    for (let t = 0; t < 34; t++) {
      if (c[t] !== 0 && c[t] !== 2 && c[t] !== 4) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  
  return false;
}

function _ckM(c) {
  for (let t = 0; t < 34; t++) {
    if (c[t] > 0) {
      // Try to construct a pong/meld of 3 identical tiles
      if (c[t] >= 3) {
        c[t] -= 3;
        if (_ckM(c)) {
          c[t] += 3;
          return true;
        }
        c[t] += 3;
      }
      // Try to construct a chow/run of 3 sequential numeric tiles
      if (isNum(t) && tVal(t) <= 7) {
        const s = tSuit(t);
        const t1 = t + 1;
        const t2 = t + 2;
        if (tSuit(t1) === s && tSuit(t2) === s && c[t1] > 0 && c[t2] > 0) {
          c[t]--;
          c[t1]--;
          c[t2]--;
          if (_ckM(c)) {
            c[t]++;
            c[t1]++;
            c[t2]++;
            return true;
          }
          c[t]++;
          c[t1]++;
          c[t2]++;
        }
      }
      return false;
    }
  }
  return true;
}

export function canWinWith(hand, extra) {
  const h = hand.slice();
  if (extra !== null && extra !== undefined) h.push(extra);
  return canWinRaw(h);
}

export function calcHan(hand, melds, isTsumo) {
  let han = 0;
  const yaku = [];
  const c = new Array(34).fill(0);
  for (let i = 0; i < hand.length; i++) c[hand[i]]++;
  
  // 断幺九 check
  let allMid = true;
  for (let t = 0; t < 34; t++) {
    if (c[t] > 0) {
      if (t >= 27 || tVal(t) === 1 || tVal(t) === 9) {
        allMid = false;
        break;
      }
    }
  }
  if (allMid) {
    for (let m = 0; m < melds.length; m++) {
      for (let j = 0; j < melds[m].tiles.length; j++) {
        const tt = melds[m].tiles[j];
        if (tt >= 27 || tVal(tt) === 1 || tVal(tt) === 9) {
          allMid = false;
          break;
        }
      }
      if (!allMid) break;
    }
  }
  if (allMid) {
    han += 1;
    yaku.push('斷幺九');
  }
  
  // 自摸 check
  if (isTsumo) {
    han += 1;
    yaku.push('自摸');
  }
  
  // 对对胡 check
  const allKok = melds.length > 0 && melds.every(m => m.type === 'pon' || m.type === 'kan' || m.type === 'ankan');
  if (allKok) {
    han += 2;
    yaku.push('對對胡');
  }
  
  // 混一色 / 清一色 check
  const suits = {};
  let hasH = false;
  for (let t = 0; t < 34; t++) {
    if (c[t] > 0) {
      if (t < 27) suits[tSuit(t)] = 1;
      else hasH = true;
    }
  }
  const sc2 = Object.keys(suits).length;
  if (sc2 === 1 && hasH) {
    han += 3;
    yaku.push('混一色');
  }
  if (sc2 === 1 && !hasH) {
    han += 6;
    yaku.push('清一色');
  }
  
  // 字一色 check
  let allH = true;
  for (let t = 0; t < 27; t++) {
    if (c[t] > 0) {
      allH = false;
      break;
    }
  }
  if (allH) {
    han += 13;
    yaku.push('字一色');
  }
  
  // 七对子 check
  if (hand.length === 14 && melds.length === 0) {
    let prs = 0;
    for (let t = 0; t < 34; t++) {
      if (c[t] === 2 || c[t] === 4) prs += c[t] / 2;
    }
    if (prs === 7) {
      han += 2;
      yaku.push('七對子');
    }
  }
  
  if (han === 0) {
    han = 1;
    yaku.push('平和');
  }
  
  return { han, yaku };
}

export function getChiOpts(hand, tile) {
  if (!isNum(tile)) return [];
  const s = tSuit(tile);
  const v = tVal(tile);
  const opts = [];
  
  if (v <= 7) {
    const a = tile + 1;
    const b = tile + 2;
    if (tSuit(a) === s && tSuit(b) === s && hand.indexOf(a) >= 0 && hand.indexOf(b) >= 0) {
      opts.push([tile, a, b]);
    }
  }
  if (v >= 2 && v <= 8) {
    const a = tile - 1;
    const b = tile + 1;
    if (tSuit(a) === s && tSuit(b) === s && hand.indexOf(a) >= 0 && hand.indexOf(b) >= 0) {
      opts.push([a, tile, b]);
    }
  }
  if (v >= 3) {
    const a = tile - 2;
    const b = tile - 1;
    if (tSuit(a) === s && tSuit(b) === s && hand.indexOf(a) >= 0 && hand.indexOf(b) >= 0) {
      opts.push([a, b, tile]);
    }
  }
  return opts;
}

// simple helper to mock latency
export function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
