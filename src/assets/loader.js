/* ============================================================
   이미지 에셋 로더 (선택)
   - assets/ 에 PNG를 넣으면 자동 적용, 없으면 절차적 렌더링으로 폴백.
   - 단일 이미지(getImage) + 가로 스트립 애니메이션(getSprite) 지원.
   파일 규격은 assets/README.md 참고.
   ============================================================ */

// 단일 이미지(배경 · 정지 포즈 · 대화 초상화)
const IMAGES = {
  bgHill: "assets/bg-hill.png",
  // 정지 포즈
  front: "assets/lyra/front.png",
  back: "assets/lyra/back.png",
  left: "assets/lyra/left.png",
  right: "assets/lyra/right.png",
  // 대화 초상화 (표정 6종)
  "portrait.smiling":   "assets/portraits/smiling.png",
  "portrait.normal":    "assets/portraits/normal.png",
  "portrait.serious":   "assets/portraits/serious.png",
  "portrait.frowning":  "assets/portraits/frowning.png",
  "portrait.sad":       "assets/portraits/sad.png",
  "portrait.surprised": "assets/portraits/surprised.png",
};

// 가로 스트립 애니메이션 (frames = 가로 프레임 수)
const SPRITES = {
  idle:      { src: "assets/lyra/idle.png",      frames: 4 },
  walk:      { src: "assets/lyra/walk.png",      frames: 5 },
  observe:   { src: "assets/lyra/observe.png",   frames: 5 },
  absorb:    { src: "assets/lyra/absorb.png",    frames: 4 },
  surprise:  { src: "assets/lyra/surprise.png",  frames: 4 },
  discovery: { src: "assets/lyra/discovery.png", frames: 4 },
};

const images = {};
const sprites = {};

function loadImage(src, onOk) {
  const img = new Image();
  img.onload = () => onOk(img);
  img.onerror = () => {};
  img.src = src;
}

export function preloadAssets() {
  for (const [key, src] of Object.entries(IMAGES)) {
    loadImage(src, (img) => { images[key] = img; });
  }
  for (const [key, def] of Object.entries(SPRITES)) {
    loadImage(def.src, (img) => { sprites[key] = { img, frames: def.frames }; });
  }
}

/** 로드된 단일 이미지 (없으면 null) */
export function getImage(key) {
  const img = images[key];
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** 로드된 스프라이트 {img, frames} (없으면 null) */
export function getSprite(key) {
  const s = sprites[key];
  return s && s.img.complete && s.img.naturalWidth > 0 ? s : null;
}

/** 캔버스에 'cover' 방식으로 가득 채워 그리기 */
export function drawCover(ctx, img, w, h) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw, dh;
  if (ir > cr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
