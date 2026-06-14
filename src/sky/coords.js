/* ============================================================
   천문 좌표 유틸리티
   - 내부적으로는 실제 적도좌표 RA(0~360°), Dec(-90~+90°), FOV(deg)를 사용.
   - 사용자에게는 "별빛 좌표"(0~1000 정수 그리드)로 환산해 보여준다.
       별빛 X  ↔  RA  :  RA = X/1000 * 360
       별빛 Y  ↔  Dec :  Dec = Y/1000 * 180 - 90
   - 구면 거리, IAU 별자리 영역(다각형) 내부 판정, 표시용 포맷터 제공.
   ============================================================ */

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* ---------- 별빛 좌표 ↔ RA/Dec ---------- */
export function starToRaDec(sx, sy) {
  return {
    ra: clamp((sx / 1000) * 360, 0, 359.9999),
    dec: clamp((sy / 1000) * 180 - 90, -89.9999, 89.9999),
  };
}
export function raDecToStar(ra, dec) {
  return {
    sx: Math.round(((ra % 360) / 360) * 1000),
    sy: Math.round(((dec + 90) / 180) * 1000),
  };
}

/* ---------- 구면 각거리(도) ---------- */
export function angularDistance(ra1, dec1, ra2, dec2) {
  const φ1 = dec1 * D2R, φ2 = dec2 * D2R;
  const dφ = (dec2 - dec1) * D2R;
  const dλ = (ra2 - ra1) * D2R;
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(a))) * R2D;
}

/* RA 차이를 [-180,180]로 정규화 (적경 0h 경계 처리) */
function deltaRA(a, b) {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}

/**
 * 점(ra,dec)이 별자리 경계 다각형 내부인지 판정.
 * 다각형 정점의 RA를 테스트 점 기준 상대값(deltaRA)으로 펼쳐 평면 ray-casting.
 * (적경 0h를 가로지르는 별자리도 안전하게 처리됨)
 */
export function pointInPolygon(ra, dec, poly) {
  const pts = poly.map(([pra, pdec]) => [deltaRA(pra, ra), pdec]);
  const x = 0, y = dec;
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    const hit = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (hit) inside = !inside;
  }
  return inside;
}

/* ---------- 표시용 포맷 ---------- */
export function formatRA(deg) {
  const h = deg / 15;
  const hh = Math.floor(h);
  const m = (h - hh) * 60;
  const mm = Math.floor(m);
  const ss = Math.round((m - mm) * 60);
  return `${pad(hh)}h ${pad(mm)}m ${pad(ss)}s`;
}
export function formatDec(deg) {
  const sign = deg < 0 ? "−" : "+";
  const a = Math.abs(deg);
  const dd = Math.floor(a);
  const m = (a - dd) * 60;
  const mm = Math.floor(m);
  return `${sign}${pad(dd)}° ${pad(mm)}′`;
}
function pad(n) { return String(n).padStart(2, "0"); }

/**
 * 별자리의 별들을 썸네일/오버레이용 2D 평면으로 투영.
 * 중심 기준 접평면 근사: x = ΔRA·cos(dec), y = -Dec (북쪽이 위)
 * 반환: 대략 [-50,50] 범위로 정규화된 점 배열
 */
export function projectStars(con) {
  const c = con.center;
  const raw = con.stars.map((s) => ({
    x: deltaRA(s.ra, c.ra) * Math.cos(c.dec * D2R),
    y: -(s.dec - c.dec),
    name: s.name,
  }));
  let max = 1;
  for (const p of raw) max = Math.max(max, Math.abs(p.x), Math.abs(p.y));
  const k = 48 / max;
  return raw.map((p) => ({ x: p.x * k, y: p.y * k, name: p.name }));
}
