/* ============================================================
   Aladin Lite v3 래퍼
   - 실제 천문 survey(HiPS) 이미지를 #aladin-lite-div 에 렌더링한다.
   - 좌표 이동(gotoRaDec), FOV 설정, survey 전환, 월드→픽셀 변환,
     별자리 연결선/별 마커 오버레이를 관리한다.
   - 네트워크/CDS 서버가 필요하다.
   ============================================================ */

let aladin = null;
let ready = null;
let discoveredOverlay = null; // 발견한 별자리(밝게 상시 표시)
let hintOverlay = null;       // 현재 접근 중 별자리(희미한 힌트)
let hintCatalog = null;       // 현재 별자리의 별 마커

/** Aladin 초기화. 성공 시 인스턴스로 resolve. */
export function initAladin(target = { ra: 83.98, dec: -1.07 }, fov = 50) {
  if (ready) return ready;
  ready = new Promise((resolve, reject) => {
    if (!window.A) { reject(new Error("Aladin Lite 스크립트를 불러오지 못했습니다.")); return; }
    const boot = () => {
      try {
        aladin = A.aladin("#aladin-lite-div", {
          survey: "P/DSS2/color",
          fov, cooFrame: "ICRS", projection: "SIN",
          target: `${target.ra} ${target.dec}`,
          backgroundColor: "#05040f",
          showReticle: false, showZoomControl: false, showFullscreenControl: false,
          showLayersControl: false, showGotoControl: false, showShareControl: false,
          showSimbadPointerControl: false, showContextMenu: false,
          showCooGrid: false, showCooGridControl: false, showSettingsControl: false,
          showStatusBar: false, showFrame: false, showCooLocation: false,
          realFullscreen: false,
        });
        discoveredOverlay = A.graphicOverlay({ color: "#8fd3ff", lineWidth: 2.4, name: "discovered" });
        hintOverlay = A.graphicOverlay({ color: "rgba(143,211,255,0.45)", lineWidth: 1.6, name: "hint" });
        aladin.addOverlay(discoveredOverlay);
        aladin.addOverlay(hintOverlay);
        hintCatalog = A.catalog({ name: "hintStars", shape: "circle", sourceSize: 12, color: "#fff7e0" });
        aladin.addCatalog(hintCatalog);
        resolve(aladin);
      } catch (e) { reject(e); }
    };
    if (A.init && typeof A.init.then === "function") A.init.then(boot).catch(reject);
    else boot();
  });
  return ready;
}

export function getAladin() { return aladin; }
export function isReady() { return !!aladin; }

export function gotoRaDec(ra, dec) { if (aladin) aladin.gotoRaDec(ra, dec); }
export function setFoV(fov) { if (aladin) aladin.setFoV(fov); }
export function getRaDec() { return aladin ? aladin.getRaDec() : [0, 0]; }
export function getFov() { return aladin ? aladin.getFov()[0] : 60; }
export function setSurvey(id) { if (aladin) aladin.setImageSurvey(id); }

export function panBy(dx, dy) {
  if (!aladin) return;
  const [ra, dec] = getRaDec();
  const fov = getFov();
  const nextDec = Math.max(-89.9, Math.min(89.9, dec + dy * fov));
  const decScale = Math.max(0.18, Math.cos((nextDec * Math.PI) / 180));
  const nextRa = (ra + (dx * fov) / decScale + 360) % 360;
  gotoRaDec(nextRa, nextDec);
}

/** 월드(ra,dec) → 화면 픽셀 [x,y] (보이지 않으면 null) */
export function world2pix(ra, dec) {
  if (!aladin) return null;
  try { return aladin.world2pix(ra, dec); } catch (e) { return null; }
}

/* ---------- 오버레이 ---------- */
function polylinesFor(con, sources) {
  const lines = [];
  for (const [i, j] of con.lines) {
    const a = con.stars[i], b = con.stars[j];
    lines.push(A.polyline([[a.ra, a.dec], [b.ra, b.dec]]));
  }
  return lines;
}

/** 현재 접근 중 별자리의 힌트(별 마커 + 희미한 선)를 표시 */
export function showHint(con) {
  if (!aladin) return;
  hintOverlay.removeAll();
  hintCatalog.removeAll();
  for (const ln of polylinesFor(con)) hintOverlay.add(ln);
  hintCatalog.addSources(con.stars.map((s) => A.source(s.ra, s.dec, { name: s.name })));
}

export function clearHint() {
  if (!aladin) return;
  hintOverlay.removeAll();
  hintCatalog.removeAll();
}

/** 발견 확정 — 밝은 연결선을 상시 오버레이에 추가 */
export function addDiscovered(con) {
  if (!aladin) return;
  for (const ln of polylinesFor(con)) discoveredOverlay.add(ln);
}

/** 저장된 발견 목록을 한 번에 복원 */
export function restoreDiscovered(constellations, discoveredMap) {
  if (!aladin) return;
  discoveredOverlay.removeAll();
  for (const con of constellations) {
    if (discoveredMap[con.id]) for (const ln of polylinesFor(con)) discoveredOverlay.add(ln);
  }
}
