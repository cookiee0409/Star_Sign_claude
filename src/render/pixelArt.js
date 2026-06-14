/* ============================================================
   픽셀 어드벤처 화면 렌더링 — "Lyra: The Stardust Gatherer" 컨셉
   - 밤 언덕 위, 은하수와 별자리 무늬가 흐르는 하늘, 텐트·랜턴·돗자리.
     (레퍼런스의 아빠 캐릭터는 사용하지 않음)
   - 주인공 Lyra: 은빛 머리, 별 머리핀, 별자리 망토(후드), 작은 별가루 날개,
     마법 망원경, 갈색 부츠.
   - assets/ 에 그림(PNG)이 있으면 자동 교체(loader), 없으면 절차적 렌더링.
   ============================================================ */

import { getImage, drawCover, getSprite } from "../assets/loader.js";
import { CharacterController, drawSpriteFrame } from "./sprites.js";

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h));
}

/* 배경 속 캐릭터(Lyra) 컨트롤러 — 스스로 돌아다님 */
export const lyraCtl = new CharacterController();
let lyraLastT = 0;
export function triggerLyraAnim(name) { lyraCtl.play(name); }
export function setLyraFrozen(b) { lyraCtl.frozen = b; }
function moodForClip(clip) {
  if (clip === "observe") return "thinking";
  if (clip === "surprise") return "curious";
  return "smiling";
}

/* ---------- 캐시되는 배경 요소 ---------- */
let skyStars = null, fireflies = null, grass = null, nebula = null, sparkles = null;

function buildSkyStars(w, h) {
  const stars = [];
  const count = Math.floor((w * h) / 3600);
  for (let i = 0; i < count; i++) {
    const inBand = Math.random() < 0.5;
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h * 0.66,
      r: Math.random() < 0.82 ? 1 : 2,
      base: 0.35 + Math.random() * 0.65,
      tw: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.6,
      band: inBand,
    });
  }
  skyStars = { w, h, stars };
}

function buildFireflies(w, h) {
  const arr = [];
  for (let i = 0; i < 20; i++) {
    arr.push({
      x: Math.random() * w, y: h * 0.55 + Math.random() * h * 0.4,
      ph: Math.random() * Math.PI * 2, sp: 0.3 + Math.random() * 0.5,
      drift: 0.2 + Math.random() * 0.5,
    });
  }
  fireflies = { w, h, arr };
}

function buildGrass(w, h) {
  const arr = [];
  const gy = h * 0.76;
  for (let i = 0; i < w / 8; i++) {
    arr.push({
      x: i * 8 + Math.random() * 5,
      y: gy + Math.random() * (h * 0.24),
      hgt: 6 + Math.random() * 12, ph: Math.random() * Math.PI * 2,
      shade: Math.random(),
    });
  }
  grass = { w, h, arr };
}

// 화면에 흩어진 작은 별 스파클(✦)
function buildSparkles(w, h) {
  const arr = [];
  for (let i = 0; i < 10; i++) {
    arr.push({ x: Math.random() * w, y: Math.random() * h * 0.7, ph: Math.random() * Math.PI * 2, s: 4 + Math.random() * 5 });
  }
  sparkles = { w, h, arr };
}

export function initScene(w, h) {
  buildSkyStars(w, h); buildFireflies(w, h); buildGrass(w, h); buildSparkles(w, h);
  nebula = null;
}

/* ---------- 하늘 + 은하수 ---------- */
function drawSky(ctx, w, h, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0a0e2e");
  g.addColorStop(0.4, "#1a1f4d");
  g.addColorStop(0.66, "#3a2f5e");
  g.addColorStop(0.85, "#7a5a78");
  g.addColorStop(1, "#c89bae");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 은하수 띠 — 좌하→우상 대각선의 다색 성운
  const blobs = [
    [0.08, 0.62, 0.42, "rgba(120,200,200,0.10)"],
    [0.24, 0.46, 0.46, "rgba(150,120,220,0.12)"],
    [0.42, 0.32, 0.5, "rgba(230,150,190,0.10)"],
    [0.6, 0.2, 0.46, "rgba(150,120,220,0.11)"],
    [0.78, 0.1, 0.42, "rgba(120,180,210,0.10)"],
  ];
  for (const [fx, fy, fr, col] of blobs) {
    const cx = fx * w, cy = fy * h, r = fr * h;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // 별
  if (!skyStars || skyStars.w !== w || skyStars.h !== h) buildSkyStars(w, h);
  for (const s of skyStars.stars) {
    const a = s.base * (0.5 + 0.5 * Math.sin(t * s.sp + s.tw));
    px(ctx, s.x, s.y, s.r, s.r, `rgba(253,250,240,${a.toFixed(2)})`);
    if (s.r === 2) px(ctx, s.x - 1, s.y - 1, 1, 1, `rgba(200,220,255,${(a * 0.5).toFixed(2)})`);
  }

  drawConstellationDecor(ctx, w, h, t);
}

// 하늘에 떠 있는 별자리 무늬(장식) — 희미한 흰 선 + 별점
const DECOR = [
  // 북두칠성 느낌
  { p: [[0.07, 0.18], [0.11, 0.16], [0.15, 0.2], [0.13, 0.26], [0.18, 0.29], [0.23, 0.27], [0.26, 0.31]], path: [0, 1, 2, 3, 0, 3, 4, 5, 6] },
  // 오리온 느낌(허리띠 + 사각)
  { p: [[0.84, 0.12], [0.8, 0.2], [0.88, 0.22], [0.82, 0.3], [0.83, 0.33], [0.84, 0.36], [0.86, 0.31]], path: [0, 1, 3, 4, 5, 6, 2, 0] },
  // W (카시오페이아)
  { p: [[0.55, 0.1], [0.59, 0.14], [0.63, 0.11], [0.67, 0.15], [0.71, 0.12]], path: [0, 1, 2, 3, 4] },
];
function drawConstellationDecor(ctx, w, h, t) {
  const tw = 0.5 + 0.5 * Math.sin(t * 0.8);
  for (const c of DECOR) {
    ctx.strokeStyle = `rgba(200,220,255,${(0.1 + tw * 0.07).toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    c.path.forEach((idx, i) => {
      const [fx, fy] = c.p[idx];
      const x = fx * w, y = fy * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    for (const [fx, fy] of c.p) {
      px(ctx, fx * w - 1, fy * h - 1, 2, 2, `rgba(255,250,235,${(0.5 + tw * 0.4).toFixed(2)})`);
    }
  }
}

function drawMoon(ctx, w, h) {
  const cx = w * 0.16, cy = h * 0.16, r = 26;
  const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, r * 3);
  g.addColorStop(0, "rgba(255,247,224,0.45)");
  g.addColorStop(1, "rgba(255,247,224,0)");
  ctx.fillStyle = g; ctx.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
  for (let y = -r; y <= r; y += 2)
    for (let x = -r; x <= r; x += 2)
      if (x * x + y * y <= r * r) {
        const sh = 235 + Math.floor((x + y) * 0.3);
        px(ctx, cx + x, cy + y, 2, 2, `rgb(${sh},${sh - 6},${sh - 26})`);
      }
}

function drawHills(ctx, w, h, t) {
  ctx.fillStyle = "#26343a";
  let baseY = h * 0.7;
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, baseY + Math.sin(x * 0.004 + 1) * 24 + Math.sin(x * 0.012) * 9);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

  // 가까운 언덕
  const gy = h * 0.78;
  const g = ctx.createLinearGradient(0, gy, 0, h);
  g.addColorStop(0, "#22392a"); g.addColorStop(1, "#142016");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) ctx.lineTo(x, gy + Math.sin(x * 0.006 + 3) * 16 + Math.cos(x * 0.02) * 7);
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
}

function drawGrass(ctx, w, h, t) {
  if (!grass || grass.w !== w) buildGrass(w, h);
  for (const bl of grass.arr) {
    const sway = Math.sin(t * 0.8 + bl.ph) * 2.2;
    const col = bl.shade > 0.5 ? "#2c4a30" : "#203826";
    for (let i = 0; i < bl.hgt; i += 2) px(ctx, bl.x + (sway * i) / bl.hgt, bl.y - i, 2, 2, col);
  }
}

function drawFireflies(ctx, w, h, t) {
  if (!fireflies || fireflies.w !== w) buildFireflies(w, h);
  for (const f of fireflies.arr) {
    f.x += Math.sin(t * f.sp + f.ph) * f.drift;
    f.y += Math.cos(t * f.sp * 0.7 + f.ph) * f.drift * 0.6;
    const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + f.ph));
    ctx.fillStyle = `rgba(210,255,170,${(a * 0.22).toFixed(2)})`;
    ctx.fillRect(f.x - 3, f.y - 3, 7, 7);
    px(ctx, f.x, f.y, 2, 2, `rgba(225,255,180,${a.toFixed(2)})`);
  }
}

function drawSparkles(ctx, w, h, t) {
  if (!sparkles || sparkles.w !== w) buildSparkles(w, h);
  for (const s of sparkles.arr) {
    const a = 0.3 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.5 + s.ph));
    star4(ctx, s.x, s.y, s.s, `rgba(255,228,150,${a.toFixed(2)})`);
  }
}

// 4각 반짝임
function star4(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.28, y - s * 0.28);
  ctx.lineTo(x + s, y); ctx.lineTo(x + s * 0.28, y + s * 0.28);
  ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.28, y + s * 0.28);
  ctx.lineTo(x - s, y); ctx.lineTo(x - s * 0.28, y - s * 0.28);
  ctx.closePath(); ctx.fill();
}

/* ---------- 캠프 소품: 텐트 · 랜턴 · 돗자리 ---------- */
function drawTent(ctx, x, y) {
  // 따뜻한 빛
  const g = ctx.createRadialGradient(x, y - 6, 4, x, y - 6, 60);
  g.addColorStop(0, "rgba(255,200,120,0.22)"); g.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = g; ctx.fillRect(x - 60, y - 66, 120, 120);
  // 본체(삼각)
  ctx.fillStyle = "#5b6b8c";
  ctx.beginPath(); ctx.moveTo(x, y - 44); ctx.lineTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#47557a";
  ctx.beginPath(); ctx.moveTo(x, y - 44); ctx.lineTo(x + 40, y); ctx.lineTo(x + 22, y); ctx.lineTo(x, y - 30); ctx.closePath(); ctx.fill();
  // 입구(따뜻한 안쪽)
  ctx.fillStyle = "#1a1226";
  ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "rgba(255,190,110,0.5)";
  ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.lineTo(x - 7, y); ctx.lineTo(x + 7, y); ctx.closePath(); ctx.fill();
  // 깃대 + 별
  px(ctx, x - 1, y - 54, 2, 12, "#6b4a2e");
  star4(ctx, x, y - 54, 4, "#ffd76a");
}

function drawLantern(ctx, x, y, t) {
  const flick = 0.8 + 0.2 * Math.sin(t * 6);
  const g = ctx.createRadialGradient(x, y, 2, x, y, 34);
  g.addColorStop(0, `rgba(255,196,110,${(0.4 * flick).toFixed(2)})`);
  g.addColorStop(1, "rgba(255,196,110,0)");
  ctx.fillStyle = g; ctx.fillRect(x - 34, y - 34, 68, 68);
  px(ctx, x - 5, y - 10, 10, 16, "#4a3a2a");   // 몸체
  px(ctx, x - 4, y - 8, 8, 12, `rgba(255,206,120,${flick.toFixed(2)})`);
  px(ctx, x - 1, y - 16, 2, 6, "#3a2c20");      // 손잡이
  px(ctx, x - 6, y + 6, 12, 2, "#3a2c20");      // 받침
}

function drawMat(ctx, x, y) {
  px(ctx, x - 70, y, 140, 12, "#3a4a6a");
  px(ctx, x - 70, y, 140, 3, "#54648a");
  // 별 무늬
  for (let i = 0; i < 6; i++) star4(ctx, x - 56 + i * 22, y + 6, 2.4, "rgba(255,230,160,0.7)");
}

/* ---------- 마법 망원경(삼각대, 외형 단계 0~5) ---------- */
function drawTelescope(ctx, x, y, t, stage) {
  px(ctx, x - 14, y, 4, 36, "#3a2c20");
  px(ctx, x + 10, y, 4, 36, "#3a2c20");
  px(ctx, x - 2, y + 4, 4, 32, "#54402e");
  px(ctx, x - 8, y - 6, 16, 8, "#2c2030");

  const tubeBase = ["#6b4a2e", "#8a8aa0", "#caa64e", "#3a4f8c", "#5a3f8c", "#2a2f6a"][stage];
  const tubeHi = ["#8a6440", "#c2c2d8", "#f0d27a", "#5e7fd0", "#8a6fd0", "#5a63b0"][stage];
  const len = 42 + stage * 3;
  const ang = -0.5;
  for (let i = 0; i < len; i += 3) {
    const tx = x - 6 + Math.cos(ang) * i, ty = y - 6 + Math.sin(ang) * i;
    const wT = 12 - (i / len) * 3;
    px(ctx, tx - wT / 2, ty - wT / 2, wT, wT, tubeBase);
    px(ctx, tx - wT / 2, ty - wT / 2, wT, 2, tubeHi);
  }
  const lx = x - 6 + Math.cos(ang) * len, ly = y - 6 + Math.sin(ang) * len;
  px(ctx, lx - 6, ly - 6, 11, 11, "#11131f");
  const shimmer = 0.5 + 0.5 * Math.sin(t * 2);
  // 렌즈 끝 별빛
  const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 14);
  g.addColorStop(0, `rgba(255,228,150,${(0.5 + shimmer * 0.4).toFixed(2)})`);
  g.addColorStop(1, "rgba(255,228,150,0)");
  ctx.fillStyle = g; ctx.fillRect(lx - 14, ly - 14, 28, 28);
  star4(ctx, lx, ly, 5, `rgba(255,236,170,${(0.7 + shimmer * 0.3).toFixed(2)})`);

  if (stage >= 2) px(ctx, x - 8, y - 8, 16, 3, "#f0d27a");
  if (stage >= 3) for (let i = 0; i < 6; i++) {
    const p = (t * 0.6 + i / 6) % 1;
    px(ctx, x - 6 + Math.cos(ang) * (len * p), y - 6 + Math.sin(ang) * (len * p) - 8, 2, 2, `rgba(143,211,255,${(1 - p).toFixed(2)})`);
  }
  if (stage >= 4) {
    ctx.save(); ctx.translate(x, y + 16); ctx.rotate(t * 0.5);
    ctx.strokeStyle = "rgba(185,156,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
    ctx.closePath(); ctx.stroke(); ctx.restore();
  }
  if (stage >= 5) for (let i = 0; i < 4; i++) {
    const a = t * 0.8 + (i / 4) * Math.PI * 2;
    px(ctx, lx + Math.cos(a) * 16, ly + Math.sin(a) * 12 - 4, 4, 4, "rgba(185,156,255,0.85)");
  }
}

/* ---------- 주인공 Lyra ---------- */
// (cx, fy) = 발끝(아래 중앙). mood: smiling|curious|thinking|sleeping
function drawLyra(ctx, cx, fy, t, mood = "smiling", facing = 1, walking = false) {
  const bob = walking ? Math.abs(Math.sin(t * 9)) * 2.2 : Math.sin(t * 1.6) * 1.4;
  fy += bob;
  ctx.save();
  if (facing < 0) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }

  const hair = "#cdd0ee", hairHi = "#e8e8fc", hairSh = "#a7a8d0";
  const skin = "#f3d2b8", skinSh = "#dcae93";
  const cloak = "#262d63", cloakDk = "#1a1f47", cloakStar = "#cdd6ff", gold = "#e8c887";
  const wing = "#cdd8ec", wingSh = "#aebcd6";
  const boot = "#6b4a2e", bootDk = "#3a2a20";
  const cream = "#efe6d2";

  const T = (x, y, w, h, c) => px(ctx, cx + x, fy - y, w, h, c); // y는 위로 +

  /* 날개 (뒤) */
  for (const dir of [-1, 1]) {
    const wx = dir * 18;
    for (let i = 0; i < 5; i++) {
      const fl = 9 - i;
      T(wx + dir * i * 3 - (dir < 0 ? fl : 0), 66 - i * 4, fl, 5, i % 2 ? wingSh : wing);
    }
  }

  /* 부츠 + 다리 */
  T(-9, 0, 8, 9, boot); T(1, 0, 8, 9, boot);
  T(-9, 0, 8, 2, bootDk); T(1, 0, 8, 2, bootDk);
  star4(ctx, cx - 5, fy - 5, 2.4, gold); star4(ctx, cx + 5, fy - 5, 2.4, gold);
  T(-7, 8, 5, 8, "#2a2740"); T(2, 8, 5, 8, "#2a2740"); // 레깅스

  /* 크림색 치마(앞자락) */
  T(-11, 8, 22, 10, cream);
  T(-11, 8, 22, 2, "#d8cdb4");

  /* 망토 본체 */
  // 아래로 넓게 퍼지는 사다리꼴
  ctx.fillStyle = cloak;
  ctx.beginPath();
  ctx.moveTo(cx - 13, fy - 52);
  ctx.lineTo(cx + 13, fy - 52);
  ctx.lineTo(cx + 22, fy - 2);
  ctx.lineTo(cx - 22, fy - 2);
  ctx.closePath(); ctx.fill();
  // 그림자/안감
  ctx.fillStyle = cloakDk;
  ctx.beginPath();
  ctx.moveTo(cx + 4, fy - 50); ctx.lineTo(cx + 13, fy - 52);
  ctx.lineTo(cx + 22, fy - 2); ctx.lineTo(cx + 8, fy - 2); ctx.closePath(); ctx.fill();
  // 금색 단
  ctx.strokeStyle = gold; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 22, fy - 3); ctx.lineTo(cx + 22, fy - 3); ctx.stroke();
  // 망토의 별 + 별자리 점
  const starsOnCloak = [[-14, 40], [-6, 30], [-16, 20], [-2, 14], [10, 36], [14, 22], [6, 26], [-10, 10], [12, 12]];
  for (const [sx, sy] of starsOnCloak) px(ctx, cx + sx, fy - sy, 1, 1, cloakStar);
  star4(ctx, cx - 6, fy - 34, 2.2, gold);
  star4(ctx, cx + 9, fy - 20, 1.8, cloakStar);

  /* 어깨 브로치 별 */
  star4(ctx, cx, fy - 52, 3, gold);

  /* 머리 */
  // 머리카락 뒤
  T(-11, 70, 22, 14, hair);
  T(-12, 58, 7, 16, hair); T(5, 58, 7, 16, hair);
  // 후드(망토) 테두리
  ctx.strokeStyle = cloakDk; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(cx, fy - 70, 15, Math.PI * 0.05, Math.PI * 0.95, false); ctx.stroke();
  ctx.fillStyle = cloak;
  ctx.beginPath(); ctx.arc(cx, fy - 72, 16, Math.PI, Math.PI * 2); ctx.fill();
  for (const [sx, sy] of [[-12, 78], [-6, 84], [4, 84], [11, 78], [0, 86]]) px(ctx, cx + sx, fy - sy, 1, 1, cloakStar);
  // 얼굴
  T(-8, 60, 16, 14, skin);
  T(-8, 60, 16, 3, skinSh);
  // 앞머리
  T(-9, 72, 18, 5, hair);
  T(-9, 70, 5, 4, hairHi);
  T(-9, 68, 18, 2, hairSh);
  // 별 머리핀(빛남)
  star4(ctx, cx - 7, fy - 73, 3.2, "#ffd76a");
  star4(ctx, cx + 6, fy - 72, 2.6, "#ffe9a0");
  // 눈/표정
  drawFace(ctx, cx, fy, mood, t);
  // 볼터치
  T(-7, 64, 2, 1, "rgba(230,140,150,0.6)");
  T(5, 64, 2, 1, "rgba(230,140,150,0.6)");

  /* 팔 + 손에 든 작은 망원경(위로) */
  if (mood !== "sleeping") {
    T(7, 44, 4, 4, skin);          // 어깨/팔
    T(10, 48, 4, 7, skin);         // 들어올린 팔
    // 손에 든 휴대용 망원경(별빛)
    const hx = cx + 14, hy = fy - 56;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.5);
    px(ctx, -2, -3, 12, 6, "#8a5a32"); px(ctx, -2, -3, 12, 2, "#b6803a");
    px(ctx, 9, -4, 4, 8, "#5a3a22");
    ctx.restore();
    const g = ctx.createRadialGradient(hx + 12, hy - 6, 0, hx + 12, hy - 6, 14);
    g.addColorStop(0, "rgba(255,228,150,0.8)"); g.addColorStop(1, "rgba(255,228,150,0)");
    ctx.fillStyle = g; ctx.fillRect(hx - 2, hy - 20, 28, 28);
    star4(ctx, hx + 12, hy - 6, 4.5, "rgba(255,240,180,0.95)");
  }
  ctx.restore();
}

function drawFace(ctx, cx, fy, mood, t) {
  const eye = "#3a6ea8", eyeHi = "#bfe4ff", ink = "#2a2436";
  const L = cx - 4, R = cx + 3, ey = fy - 64;
  if (mood === "sleeping") {
    px(ctx, L - 1, ey, 4, 1, ink); px(ctx, R - 1, ey, 4, 1, ink); // 감은 눈
    px(ctx, cx - 1, fy - 60, 3, 2, "rgba(230,140,150,0.7)");
  } else {
    // 눈 흰자/홍채/하이라이트
    for (const ex of [L, R]) {
      px(ctx, ex - 1, ey - 1, 4, 5, "#ffffff");
      px(ctx, ex, ey, 3, 4, eye);
      px(ctx, ex, ey + 1, 3, 1, eyeHi);
      px(ctx, ex, ey, 1, 1, "#0b1a2e");
    }
    if (mood === "curious") { px(ctx, cx - 1, fy - 60, 2, 2, ink); } // 작은 입(오)
    else if (mood === "thinking") { px(ctx, cx - 2, fy - 60, 4, 1, ink); } // 평평
    else { px(ctx, cx - 2, fy - 60, 4, 1, ink); px(ctx, cx - 1, fy - 59, 2, 1, ink); } // 미소
  }
}

/* ---------- 전경 ---------- */
function drawSceneProps(ctx, w, h, t, stage) {
  const baseY = h * 0.84;
  drawTent(ctx, w * 0.8, baseY - 6);
  drawMat(ctx, w * 0.4, baseY + 18);
  drawLantern(ctx, w * 0.6, baseY + 16, t);
  drawTelescope(ctx, w * 0.52, baseY - 2, t, stage);
}

// 배경 속 Lyra — 스프라이트 에셋이 있으면 애니메이션, 없으면 절차적
function drawLyraWorld(ctx, w, h, t, moodOverride) {
  const groundY = h * 0.84 + 24;
  const cx = lyraCtl.x * w;
  const targetH = h * 0.42;
  const sprite = lyraCtl.sprite();
  if (sprite) {
    drawSpriteFrame(ctx, sprite, lyraCtl.frameIndex(), cx, groundY, targetH, lyraCtl.facing < 0);
  } else {
    const mood = moodOverride || moodForClip(lyraCtl.clip);
    drawLyra(ctx, cx, groundY, t, mood, lyraCtl.facing, lyraCtl.clip === "walk");
  }
}

export function drawAdventure(ctx, w, h, time, stage, moodOverride = null) {
  const t = time / 1000;
  const dt = Math.min(0.05, (time - lyraLastT) / 1000);
  lyraLastT = time;
  lyraCtl.update(dt);

  const bg = getImage("bgHill");
  if (bg) {
    ctx.fillStyle = "#0a0e2e"; ctx.fillRect(0, 0, w, h);
    drawCover(ctx, bg, w, h);
    drawSparkles(ctx, w, h, t);
  } else {
    drawSky(ctx, w, h, t);
    drawMoon(ctx, w, h);
    drawHills(ctx, w, h, t);
    drawGrass(ctx, w, h, t);
    drawSparkles(ctx, w, h, t);
    drawSceneProps(ctx, w, h, t, stage);
  }

  drawLyraWorld(ctx, w, h, t, moodOverride);
  drawFireflies(ctx, w, h, t);

  // 비네트
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, h * 0.78);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
}

/* ---------- 대화창 초상화 (절차적 폴백) ---------- */
// expr: smiling | normal | serious | frowning | sad | surprised
export function drawLyraPortrait(ctx, w, h, expr = "smiling", time = 0) {
  const t = time / 1000;
  ctx.clearRect(0, 0, w, h);
  // 배경
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#2b2b56"); bg.addColorStop(1, "#16142e");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const sx = (i * 53) % w, sy = (i * 91) % (h * 0.7);
    const a = 0.3 + 0.4 * Math.sin(t * 1.5 + i);
    ctx.fillStyle = `rgba(220,225,255,${a.toFixed(2)})`;
    ctx.fillRect(sx, sy, 1, 1);
  }

  const cx = w * 0.5, cy = h * 0.58, R = Math.min(w, h) * 0.3;
  const hair = "#cdd0ee", hairSh = "#a7a8d0", skin = "#f3d2b8", skinSh = "#dcae93";
  const cloak = "#27306a", cloakDk = "#1a1f47", gold = "#e8c887", cloakStar = "#cdd6ff";

  // 어깨/망토
  ctx.fillStyle = cloak;
  ctx.beginPath(); ctx.ellipse(cx, h + R * 0.5, R * 1.7, R * 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = gold; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, h + R * 0.5, R * 1.45, R * 1.1, 0, Math.PI, Math.PI * 2); ctx.stroke();

  // 머리카락 뒤
  ctx.fillStyle = hairSh;
  ctx.beginPath(); ctx.arc(cx, cy, R * 1.18, Math.PI * 0.05, Math.PI * 0.95); ctx.fill();
  ctx.fillRect(cx - R * 1.15, cy, R * 0.34, R * 1.4);
  ctx.fillRect(cx + R * 0.81, cy, R * 0.34, R * 1.4);

  // 후드
  ctx.fillStyle = cloak;
  ctx.beginPath(); ctx.arc(cx, cy - R * 0.18, R * 1.3, Math.PI, Math.PI * 2); ctx.fill();
  ctx.lineWidth = R * 0.18; ctx.strokeStyle = cloakDk;
  ctx.beginPath(); ctx.arc(cx, cy - R * 0.05, R * 1.16, Math.PI * 1.02, Math.PI * 1.98); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * (1.1 + i * 0.12);
    ctx.fillStyle = cloakStar;
    ctx.fillRect(cx + Math.cos(a) * R * 1.22, cy - R * 0.05 + Math.sin(a) * R * 1.22, 2, 2);
  }

  // 얼굴
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.78, R * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = skinSh;
  ctx.beginPath(); ctx.ellipse(cx, cy + R * 0.5, R * 0.78, R * 0.4, 0, 0, Math.PI); ctx.fill();

  // 앞머리
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(cx, cy - R * 0.3, R * 0.82, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  ctx.fillRect(cx - R * 0.82, cy - R * 0.35, R * 0.3, R * 0.5);
  ctx.fillRect(cx + R * 0.52, cy - R * 0.35, R * 0.3, R * 0.5);
  // 별 머리핀
  star4(ctx, cx - R * 0.55, cy - R * 0.55, R * 0.12, "#ffd76a");

  // 표정
  drawPortraitFace(ctx, cx, cy, R, expr, t);
}

function drawPortraitFace(ctx, cx, cy, R, expr, t) {
  const ex = R * 0.34, ey = cy - R * 0.02, eo = R * 0.18;
  const ink = "#2a2436", eye = "#4a86c0", eyeHi = "#cdecff";
  const blink = (Math.sin(t * 0.7) > 0.96) ? 0.2 : 1; // 가끔 깜빡

  function drawEye(x, openY, wide) {
    const oh = R * (wide ? 0.3 : 0.22) * (expr === "sad" ? 0.85 : 1) * blink;
    const ow = R * (wide ? 0.2 : 0.17);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.ellipse(x, openY, ow, oh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = eye;
    ctx.beginPath(); ctx.ellipse(x, openY + oh * 0.1, ow * 0.7, oh * 0.78, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#16263a";
    ctx.beginPath(); ctx.ellipse(x, openY + oh * 0.15, ow * 0.32, oh * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = eyeHi;
    ctx.fillRect(x - ow * 0.3, openY - oh * 0.3, ow * 0.3, oh * 0.3);
  }

  if (expr === "sad") {
    // 처진 눈 + 눈물
    drawEye(cx - ex, ey + R * 0.04, false); drawEye(cx + ex, ey + R * 0.04, false);
    ctx.fillStyle = "rgba(150,210,255,0.8)";
    ctx.beginPath(); ctx.arc(cx - ex - R * 0.08, ey + R * 0.22, R * 0.06, 0, Math.PI * 2); ctx.fill();
  } else {
    drawEye(cx - ex, ey, expr === "surprised");
    drawEye(cx + ex, ey, expr === "surprised");
  }

  // 눈썹
  ctx.strokeStyle = "#9a9ad0"; ctx.lineWidth = R * 0.06; ctx.lineCap = "round";
  const by = ey - R * (expr === "surprised" ? 0.42 : 0.34);
  if (expr === "serious" || expr === "frowning") {
    ctx.beginPath();
    ctx.moveTo(cx - ex - eo, by - R * 0.04); ctx.lineTo(cx - ex + eo, by + R * 0.06);
    ctx.moveTo(cx + ex + eo, by - R * 0.04); ctx.lineTo(cx + ex - eo, by + R * 0.06);
    ctx.stroke();
  }

  // 볼터치
  if (expr === "smiling" || expr === "surprised") {
    ctx.fillStyle = "rgba(232,140,150,0.5)";
    ctx.beginPath(); ctx.ellipse(cx - ex - R * 0.05, ey + R * 0.34, R * 0.13, R * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + ex + R * 0.05, ey + R * 0.34, R * 0.13, R * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  }

  // 입
  ctx.strokeStyle = ink; ctx.lineWidth = R * 0.05; ctx.fillStyle = "#a85a5a";
  const my = cy + R * 0.5;
  ctx.beginPath();
  if (expr === "surprised") { ctx.ellipse(cx, my, R * 0.1, R * 0.13, 0, 0, Math.PI * 2); ctx.fill(); }
  else if (expr === "smiling") { ctx.arc(cx, my - R * 0.05, R * 0.18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else if (expr === "sad" || expr === "frowning") { ctx.arc(cx, my + R * 0.16, R * 0.16, 1.18 * Math.PI, 1.82 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - R * 0.1, my); ctx.lineTo(cx + R * 0.1, my); ctx.stroke(); } // normal/serious
}

/** 업그레이드 미리보기 — 망원경만 */
export function drawTelescopePreview(ctx, w, h, time, stage) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, h);
  g.addColorStop(0, "#1b1a3d"); g.addColorStop(1, "#07061a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  drawTelescope(ctx, w * 0.42, h * 0.5, time / 1000, stage);
}
