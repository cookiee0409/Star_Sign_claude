/* ============================================================
   픽셀 어드벤처 화면 렌더링
   - 밀도 높은 도트 분위기: 그라데이션 밤하늘, 달, 패럴랙스 언덕,
     나무, 흔들리는 풀, 반딧불이, 흐르는 구름, 별빛 파티클,
     그리고 소녀 + 성장하는 망원경.
   - 모든 도형은 작은 사각형(픽셀 블록) 단위로 그려 도트 느낌을 살린다.
   ============================================================ */

// 픽셀 블록 하나
function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, Math.ceil(w), Math.ceil(h));
}

// 별 배경(어드벤처 하늘용) — 한 번 생성해 캐시
let skyStars = null;
function buildSkyStars(w, h) {
  const stars = [];
  const count = Math.floor((w * h) / 5000);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h * 0.62,
      r: Math.random() < 0.85 ? 1 : 2,
      base: 0.4 + Math.random() * 0.6,
      tw: Math.random() * Math.PI * 2,
      sp: 0.6 + Math.random() * 1.4,
    });
  }
  skyStars = { w, h, stars };
}

// 반딧불이 파티클
let fireflies = null;
function buildFireflies(w, h) {
  const arr = [];
  for (let i = 0; i < 22; i++) {
    arr.push({
      x: Math.random() * w,
      y: h * 0.5 + Math.random() * h * 0.45,
      ph: Math.random() * Math.PI * 2,
      sp: 0.3 + Math.random() * 0.5,
      drift: 0.2 + Math.random() * 0.5,
    });
  }
  fireflies = { w, h, arr };
}

// 풀 포기
let grass = null;
function buildGrass(w, h) {
  const arr = [];
  const groundY = h * 0.74;
  for (let i = 0; i < w / 9; i++) {
    arr.push({
      x: i * 9 + Math.random() * 6,
      y: groundY + Math.random() * (h * 0.26),
      hgt: 6 + Math.random() * 10,
      ph: Math.random() * Math.PI * 2,
      shade: Math.random(),
    });
  }
  grass = { w, h, arr };
}

// 구름
let clouds = null;
function buildClouds(w, h) {
  const arr = [];
  for (let i = 0; i < 5; i++) {
    arr.push({
      x: Math.random() * w,
      y: h * 0.1 + Math.random() * h * 0.3,
      s: 40 + Math.random() * 60,
      sp: 4 + Math.random() * 8,
    });
  }
  clouds = { w, h, arr };
}

export function initScene(w, h) {
  buildSkyStars(w, h);
  buildFireflies(w, h);
  buildGrass(w, h);
  buildClouds(w, h);
}

/* ---------- 하늘 / 배경 ---------- */
function drawSky(ctx, w, h, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#06061c");
  g.addColorStop(0.45, "#11103a");
  g.addColorStop(0.7, "#241a44");
  g.addColorStop(1, "#3a2752");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 별
  if (!skyStars || skyStars.w !== w || skyStars.h !== h) buildSkyStars(w, h);
  for (const s of skyStars.stars) {
    const a = s.base * (0.55 + 0.45 * Math.sin(t * s.sp + s.tw));
    px(ctx, s.x, s.y, s.r, s.r, `rgba(253,246,227,${a.toFixed(2)})`);
  }
}

function drawMoon(ctx, w, h) {
  const cx = w * 0.82, cy = h * 0.2, r = 34;
  // 글로우
  const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, r * 3);
  g.addColorStop(0, "rgba(255,247,214,0.5)");
  g.addColorStop(1, "rgba(255,247,214,0)");
  ctx.fillStyle = g;
  ctx.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
  // 달 본체 (픽셀 디스크)
  for (let y = -r; y <= r; y += 2) {
    for (let x = -r; x <= r; x += 2) {
      if (x * x + y * y <= r * r) {
        const shade = 230 + Math.floor((x + y) * 0.4);
        px(ctx, cx + x, cy + y, 2, 2, `rgb(${shade},${shade - 6},${shade - 28})`);
      }
    }
  }
  // 크레이터
  [[-8, -6, 5], [10, 8, 6], [4, -12, 3], [-12, 10, 4]].forEach(([dx, dy, cr]) => {
    px(ctx, cx + dx - cr / 2, cy + dy - cr / 2, cr, cr, "rgba(210,200,175,0.7)");
  });
}

function drawClouds(ctx, w, h, dt) {
  if (!clouds || clouds.w !== w) buildClouds(w, h);
  for (const c of clouds.arr) {
    c.x += (c.sp * dt) / 1000;
    if (c.x - c.s > w) c.x = -c.s;
    ctx.fillStyle = "rgba(60,52,96,0.28)";
    // 뭉게뭉게 픽셀 구름
    const lumps = [[0, 0, 1], [0.5, -0.2, 0.7], [-0.5, -0.1, 0.6], [0.3, 0.2, 0.6]];
    for (const [ox, oy, sc] of lumps) {
      const r = c.s * 0.5 * sc;
      for (let y = -r; y <= r; y += 4)
        for (let x = -r * 1.4; x <= r * 1.4; x += 4)
          if ((x * x) / (r * 1.4 * r * 1.4) + (y * y) / (r * r) <= 1)
            px(ctx, c.x + ox * c.s + x, c.y + oy * c.s + y, 4, 4, "rgba(70,60,110,0.22)");
    }
  }
}

function drawHills(ctx, w, h, t) {
  // 먼 언덕 (패럴랙스 1)
  ctx.fillStyle = "#241a40";
  const baseY = h * 0.66;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) {
    const y = baseY + Math.sin(x * 0.004 + 1) * 26 + Math.sin(x * 0.013) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

  // 가까운 언덕 (패럴랙스 2)
  ctx.fillStyle = "#1a1330";
  const baseY2 = h * 0.74;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) {
    const y = baseY2 + Math.sin(x * 0.006 + 3) * 18 + Math.cos(x * 0.02) * 8;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h); ctx.closePath(); ctx.fill();

  // 실루엣 나무 몇 그루
  drawTree(ctx, w * 0.12, h * 0.72, 1.1);
  drawTree(ctx, w * 0.9, h * 0.7, 0.9);
  drawTree(ctx, w * 0.66, h * 0.73, 0.7);
}

function drawTree(ctx, x, baseY, sc) {
  const c = "#120d24";
  px(ctx, x - 3 * sc, baseY - 30 * sc, 6 * sc, 34 * sc, c); // 줄기
  // 잎 덩어리
  for (let i = 0; i < 5; i++) {
    const r = (18 - i * 2) * sc;
    px(ctx, x - r, baseY - 30 * sc - i * 10 * sc, r * 2, 12 * sc, c);
  }
}

function drawGround(ctx, w, h, t) {
  const gy = h * 0.74;
  const g = ctx.createLinearGradient(0, gy, 0, h);
  g.addColorStop(0, "#15241a");
  g.addColorStop(1, "#0c160f");
  ctx.fillStyle = g;
  ctx.fillRect(0, gy, w, h - gy);

  // 풀
  if (!grass || grass.w !== w) buildGrass(w, h);
  for (const bl of grass.arr) {
    const sway = Math.sin(t * 0.8 + bl.ph) * 2.2;
    const col = bl.shade > 0.5 ? "#26402a" : "#1c3322";
    for (let i = 0; i < bl.hgt; i += 2) {
      px(ctx, bl.x + (sway * i) / bl.hgt, bl.y - i, 2, 2, col);
    }
  }
}

function drawFireflies(ctx, w, h, t) {
  if (!fireflies || fireflies.w !== w) buildFireflies(w, h);
  for (const f of fireflies.arr) {
    f.x += Math.sin(t * f.sp + f.ph) * f.drift;
    f.y += Math.cos(t * f.sp * 0.7 + f.ph) * f.drift * 0.6;
    const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2 + f.ph));
    // 글로우
    ctx.fillStyle = `rgba(200,255,150,${(a * 0.25).toFixed(2)})`;
    ctx.fillRect(f.x - 3, f.y - 3, 7, 7);
    px(ctx, f.x, f.y, 2, 2, `rgba(220,255,170,${a.toFixed(2)})`);
  }
}

/* ---------- 소녀 ---------- */
// 작은 픽셀 소녀. lookUp이면 망원경을 올려다보는 자세.
function drawGirl(ctx, x, y, t, lookUp) {
  const s = 4; // 픽셀 스케일
  const bob = Math.sin(t * 1.6) * 1.5;
  y += bob;
  const skin = "#f3c9a0", skinSh = "#d9a87f";
  const hair = "#5b3a2e", hairHi = "#7a4f3c";
  const dress = "#6c7fd6", dressSh = "#4f5fb0";
  const shoe = "#3a2a44";

  // 다리/신발
  px(ctx, x - 5, y + 30, 4, 8, dressSh);
  px(ctx, x + 1, y + 30, 4, 8, dressSh);
  px(ctx, x - 6, y + 38, 5, 3, shoe);
  px(ctx, x + 1, y + 38, 5, 3, shoe);
  // 드레스(몸통)
  px(ctx, x - 7, y + 16, 14, 16, dress);
  px(ctx, x - 7, y + 28, 14, 4, dressSh);
  px(ctx, x - 8, y + 26, 16, 6, dress); // 치마 퍼짐
  // 팔 (망원경을 향해 들거나 옆에)
  if (lookUp) {
    px(ctx, x + 5, y + 14, 4, 4, skin);
    px(ctx, x + 8, y + 8, 4, 8, skin);   // 올린 팔
  } else {
    px(ctx, x - 9, y + 18, 3, 10, skin);
    px(ctx, x + 6, y + 18, 3, 10, skin);
  }
  // 머리
  px(ctx, x - 6, y + 2, 12, 12, skin);
  px(ctx, x - 6, y + 10, 12, 3, skinSh);
  // 머리카락
  px(ctx, x - 7, y - 1, 14, 6, hair);
  px(ctx, x - 7, y + 4, 3, 10, hair);
  px(ctx, x + 4, y + 4, 3, 12, hair);
  px(ctx, x - 6, y - 1, 12, 2, hairHi);
  // 눈
  if (lookUp) {
    px(ctx, x - 3, y + 5, 2, 2, "#2a1c2e");
    px(ctx, x + 2, y + 5, 2, 2, "#2a1c2e");
  } else {
    px(ctx, x - 3, y + 6, 2, 2, "#2a1c2e");
    px(ctx, x + 2, y + 6, 2, 2, "#2a1c2e");
  }
  // 볼터치
  px(ctx, x - 5, y + 8, 2, 1, "rgba(230,140,140,0.6)");
  px(ctx, x + 4, y + 8, 2, 1, "rgba(230,140,140,0.6)");
}

/* ---------- 망원경 (외형 단계 0~5) ---------- */
function drawTelescope(ctx, x, y, t, stage) {
  // 삼각대
  const legCol = "#3a2c20", legHi = "#54402e";
  px(ctx, x - 14, y, 4, 34, legCol);
  px(ctx, x + 10, y, 4, 34, legCol);
  px(ctx, x - 2, y + 4, 4, 30, legHi);
  // 관 받침
  px(ctx, x - 8, y - 6, 16, 8, "#2c2030");

  // 관 색상 — 단계별
  const tubeBase = ["#6b4a2e", "#8a8aa0", "#caa64e", "#3a4f8c", "#5a3f8c", "#2a2f6a"][stage];
  const tubeHi   = ["#8a6440", "#c2c2d8", "#f0d27a", "#5e7fd0", "#8a6fd0", "#5a63b0"][stage];

  // 경통 (기울어진 원통을 픽셀로)
  const len = 40 + stage * 3;
  for (let i = 0; i < len; i += 3) {
    const ang = -0.5;
    const tx = x - 6 + Math.cos(ang) * i;
    const ty = y - 6 + Math.sin(ang) * i;
    const wTube = 12 - (i / len) * 3;
    px(ctx, tx - wTube / 2, ty - wTube / 2, wTube, wTube, tubeBase);
    px(ctx, tx - wTube / 2, ty - wTube / 2, wTube, 2, tubeHi);
  }
  // 렌즈 끝
  const lx = x - 6 + Math.cos(-0.5) * len;
  const ly = y - 6 + Math.sin(-0.5) * len;
  px(ctx, lx - 6, ly - 6, 11, 11, "#11131f");
  // 렌즈 반짝임
  const shimmer = 0.5 + 0.5 * Math.sin(t * 2);
  px(ctx, lx - 4, ly - 4, 5, 5, `rgba(143,211,255,${(0.5 + shimmer * 0.4).toFixed(2)})`);

  // 단계별 장식
  if (stage >= 2) { // 황금 링
    px(ctx, x - 8, y - 8, 16, 3, "#f0d27a");
  }
  if (stage >= 3) { // 별빛 입자 흐름
    for (let i = 0; i < 6; i++) {
      const p = (t * 0.6 + i / 6) % 1;
      const px2 = x - 6 + Math.cos(-0.5) * (len * p);
      const py2 = y - 6 + Math.sin(-0.5) * (len * p);
      px(ctx, px2, py2 - 8, 2, 2, `rgba(143,211,255,${(1 - p).toFixed(2)})`);
    }
  }
  if (stage >= 4) { // 마법 문양 (회전 글로우)
    ctx.save();
    ctx.translate(x, y + 16);
    ctx.rotate(t * 0.5);
    ctx.strokeStyle = "rgba(185,156,255,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
    }
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }
  if (stage >= 5) { // 떠다니는 렌즈 조각
    for (let i = 0; i < 4; i++) {
      const a = t * 0.8 + (i / 4) * Math.PI * 2;
      const fx = lx + Math.cos(a) * 16;
      const fy = ly + Math.sin(a) * 12 - 4;
      px(ctx, fx, fy, 4, 4, "rgba(185,156,255,0.85)");
    }
  }
}

/* ---------- 전경 소품 ---------- */
function drawProps(ctx, w, h, gx, gy) {
  // 돗자리
  px(ctx, gx - 70, gy + 44, 130, 10, "#7a4a4a");
  px(ctx, gx - 70, gy + 44, 130, 3, "#9a6a6a");
  // 책 더미
  px(ctx, gx - 64, gy + 34, 22, 6, "#c25b5b");
  px(ctx, gx - 62, gy + 28, 18, 6, "#5b8ac2");
  px(ctx, gx - 60, gy + 22, 14, 6, "#c2a85b");
  // 별지도(둥글게 만 종이)
  px(ctx, gx + 40, gy + 38, 26, 6, "#e8dcc0");
  px(ctx, gx + 40, gy + 38, 26, 2, "#fff4d8");
  // 작은 등불
  const lx = gx + 56, ly = gy + 18;
  ctx.fillStyle = "rgba(255,200,120,0.25)";
  ctx.beginPath(); ctx.arc(lx, ly, 16, 0, Math.PI * 2); ctx.fill();
  px(ctx, lx - 4, ly - 6, 8, 12, "#5a4632");
  px(ctx, lx - 3, ly - 4, 6, 8, "rgba(255,200,110,0.9)");
}

/* ---------- 통합 그리기 ---------- */
let lastT = 0;
export function drawAdventure(ctx, w, h, time, telescopeStage) {
  const t = time / 1000;
  const dt = Math.min(50, time - lastT);
  lastT = time;

  drawSky(ctx, w, h, t);
  drawMoon(ctx, w, h);
  drawClouds(ctx, w, h, dt);
  drawHills(ctx, w, h, t);
  drawGround(ctx, w, h, t);

  // 전경: 소녀 + 망원경
  const gx = w * 0.42;
  const gy = h * 0.62;
  drawProps(ctx, w, h, gx, gy);
  drawTelescope(ctx, gx + 70, gy - 4, t, telescopeStage);
  drawGirl(ctx, gx, gy, t, true);

  drawFireflies(ctx, w, h, t);

  // 비네트
  const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.75);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** 업그레이드 미리보기용 — 망원경만 그린다 */
export function drawTelescopePreview(ctx, w, h, time, stage) {
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w/2, h/2, 8, w/2, h/2, h);
  g.addColorStop(0, "#1b1a3d"); g.addColorStop(1, "#07061a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  drawTelescope(ctx, w * 0.42, h * 0.42, time / 1000, stage);
}
