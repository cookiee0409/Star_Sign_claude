/* ============================================================
   이미지 에셋 로더 (정지 PNG 방식)
   - 캐릭터는 프레임 애니메이션 대신 "상태별 정지 PNG"를 사용한다.
     움직임/반짝임은 CSS/Canvas 모션으로 구현(=> ui/character.js).
   - 모든 이미지는 선택적. 없으면 절차적 렌더링으로 폴백한다.
   파일 규격은 assets/README.md 참고.
   ============================================================ */

const IMAGES = {
  // 배경(선택)
  bgHill: "assets/bg-hill.png",

  // 캐릭터 상태 PNG
  "char.idle":     "assets/characters/lyra/lyra_idle.png",
  "char.observe":  "assets/characters/lyra/lyra_observe.png",
  "char.happy":    "assets/characters/lyra/lyra_happy.png",
  "char.surprise": "assets/characters/lyra/lyra_surprise.png",

  // 이펙트(선택) — 없으면 CSS 그라데이션으로 폴백
  "fx.stardust":    "assets/effects/stardust_particle.png",
  "fx.chestGlow":   "assets/effects/chest_star_glow.png",
  "fx.lensGlow":    "assets/effects/telescope_lens_glow.png",
  "fx.energyOrb":   "assets/effects/energy_orb.png",
  "fx.energyTrail": "assets/effects/energy_trail.png",

  // 대화 초상화(선택)
  "portrait.smiling":   "assets/portraits/smiling.png",
  "portrait.normal":    "assets/portraits/normal.png",
  "portrait.serious":   "assets/portraits/serious.png",
  "portrait.frowning":  "assets/portraits/frowning.png",
  "portrait.sad":       "assets/portraits/sad.png",
  "portrait.surprised": "assets/portraits/surprised.png",
};

const images = {};

export function preloadAssets() {
  for (const [key, src] of Object.entries(IMAGES)) {
    const img = new Image();
    img.onload = () => { images[key] = img; };
    img.onerror = () => {};
    img.src = src;
  }
}

/** 로드된 이미지 (없으면 null) */
export function getImage(key) {
  const img = images[key];
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** 이미지가 있으면 src 문자열 반환(없으면 null) — CSS background 용 */
export function getImageSrc(key) {
  const img = getImage(key);
  return img ? img.src : null;
}

/** 캔버스에 'cover' 방식으로 가득 채워 그리기 */
export function drawCover(ctx, img, w, h) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw, dh;
  if (ir > cr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
