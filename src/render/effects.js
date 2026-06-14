/* ============================================================
   파티클 / 연출 효과
   - 별에너지 흡수: 별자리 위치에서 별빛 입자가 나선형으로 회전하며
     렌즈(화면 중심)로 빨려 들어가는 이펙트.
   - 발견 시 화면이 살짝 어두워지는 플래시/딤.
   ============================================================ */

export class EnergyAbsorb {
  constructor() { this.particles = []; this.active = false; this.done = true; }

  /** 시작점(별자리 화면좌표) → 목표(렌즈 중심) */
  start(sx, sy, cx, cy, count = 90) {
    this.particles = [];
    this.cx = cx; this.cy = cy;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = 4 + Math.random() * 40;
      this.particles.push({
        x: sx + Math.cos(ang) * rad,
        y: sy + Math.sin(ang) * rad,
        ang,
        rad,
        // 나선 회전 속도/수축 속도
        spin: 2 + Math.random() * 3,
        pull: 0.012 + Math.random() * 0.02,
        delay: Math.random() * 0.5,
        life: 0,
        size: 1 + Math.random() * 2,
        hue: Math.random() < 0.3 ? "#b99cff" : "#8fd3ff",
        prog: 0, // 시작점→중심 보간
        ox: sx + Math.cos(ang) * rad,
        oy: sy + Math.sin(ang) * rad,
      });
    }
    this.active = true;
    this.done = false;
  }

  /** dt(초) 진행. 모든 입자가 흡수되면 done=true */
  update(dt) {
    if (!this.active) return;
    let alive = 0;
    for (const p of this.particles) {
      if (p.delay > 0) { p.delay -= dt; alive++; continue; }
      p.life += dt;
      p.prog = Math.min(1, p.prog + p.pull * (1 + p.prog * 2.5));
      p.ang += p.spin * dt;
      const curRad = p.rad * (1 - p.prog);
      // 시작 위치도 점점 중심으로
      const baseX = p.ox + (this.cx - p.ox) * easeIn(p.prog);
      const baseY = p.oy + (this.cy - p.oy) * easeIn(p.prog);
      p.x = baseX + Math.cos(p.ang) * curRad;
      p.y = baseY + Math.sin(p.ang) * curRad;
      if (p.prog < 0.999) alive++;
    }
    if (alive === 0) { this.active = false; this.done = true; }
  }

  draw(ctx) {
    if (!this.particles.length) return;
    for (const p of this.particles) {
      if (p.delay > 0) continue;
      const a = 0.9 * (1 - p.prog * 0.4);
      ctx.fillStyle = hexA(p.hue, a * 0.3);
      ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2 + 1, p.size * 2 + 1);
      ctx.fillStyle = hexA(p.hue, a);
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    // 중심 빛 번짐
    const pull = this.particles.filter(p => p.prog > 0.6).length / this.particles.length;
    if (pull > 0) {
      const g = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, 60 * pull + 10);
      g.addColorStop(0, `rgba(143,211,255,${(0.5 * pull).toFixed(2)})`);
      g.addColorStop(1, "rgba(143,211,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(this.cx - 70, this.cy - 70, 140, 140);
    }
  }
}

/* ---------- 망원경 렌즈 테두리(접안부) — 실제 하늘 위에 덧그림 ---------- */
export function drawLensFrame(ctx, w, h, time) {
  const t = time / 1000;
  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.47;

  // 바깥 어둠 (원형 비네트)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.arc(cx, cy, R, 0, Math.PI * 2, true);
  ctx.fillStyle = "#04040d";
  ctx.fill("evenodd");
  ctx.restore();

  // 안쪽 가장자리 어둠
  const g = ctx.createRadialGradient(cx, cy, R * 0.74, cx, cy, R);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // 금속 링
  ctx.lineWidth = 7;
  ctx.strokeStyle = "rgba(120,110,150,0.55)";
  ctx.beginPath(); ctx.arc(cx, cy, R + 3, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(200,190,230,0.3)";
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

  // 미세 렌즈 반사
  ctx.strokeStyle = "rgba(143,211,255,0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, -0.9 + Math.sin(t * 0.3) * 0.1, -0.3); ctx.stroke();

  // 중심 십자선
  ctx.strokeStyle = "rgba(143,211,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
  ctx.stroke();
}

function easeIn(t) { return t * t; }
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(2)})`;
}

/* ---------- 신비 현상: 유성 ---------- */
export class Meteor {
  constructor(w, h) {
    this.x = Math.random() * w * 0.6;
    this.y = -20;
    this.vx = 3 + Math.random() * 3;
    this.vy = 4 + Math.random() * 3;
    this.life = 1;
    this.trail = [];
  }
  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 12) this.trail.shift();
    this.life -= dt * 0.4;
  }
  draw(ctx) {
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const a = (i / this.trail.length) * this.life;
      ctx.fillStyle = `rgba(200,230,255,${a.toFixed(2)})`;
      ctx.fillRect(p.x, p.y, 2, 2);
    }
    ctx.fillStyle = `rgba(255,255,255,${this.life.toFixed(2)})`;
    ctx.fillRect(this.x, this.y, 3, 3);
  }
  get dead() { return this.life <= 0; }
}
