/* ============================================================
   에셋 로더 (데이터 주도 / manifest-driven)
   - Lyra 애니메이션은 에셋 팩의 JSON 메타데이터를 읽어
     애니메이션별 strip 이미지 + 프레임 수 + FPS + loop + anchor 를 불러온다.
       assets/lyra/lyra_basic_animations_160x160.json
   - 초상화/배경 등 단일 이미지는 선택적으로 교체 가능(없으면 절차적 폴백).
   파일 규격은 assets/README.md 참고.
   ============================================================ */

// 애니메이션 메타데이터(JSON) 위치 + strip 경로의 베이스
const LYRA_MANIFEST = "assets/lyra/lyra_basic_animations_160x160.json";
const LYRA_BASE = "assets/lyra/";

// 선택적 단일 이미지 (배경 · 대화 초상화). 없으면 절차적 렌더링.
const IMAGES = {
  bgHill: "assets/bg-hill.png",
  "portrait.smiling":   "assets/portraits/smiling.png",
  "portrait.normal":    "assets/portraits/normal.png",
  "portrait.serious":   "assets/portraits/serious.png",
  "portrait.frowning":  "assets/portraits/frowning.png",
  "portrait.sad":       "assets/portraits/sad.png",
  "portrait.surprised": "assets/portraits/surprised.png",
};

const images = {};
const sprites = {};       // animName -> { img, frames, fps, loop, frameW, frameH, anchorX, anchorY }
let manifest = null;
let manifestLoaded = false;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Lyra 애니메이션 매니페스트 + strip 이미지 로드 */
async function loadLyraSprites() {
  try {
    const res = await fetch(LYRA_MANIFEST, { cache: "no-cache" });
    if (!res.ok) return;
    manifest = await res.json();
    const anchor = (manifest.meta && manifest.meta.anchor) || { x: 0.5, y: 0.8875 };

    await Promise.all(Object.entries(manifest.animations).map(async ([anim, def]) => {
      const img = await loadImage(LYRA_BASE + def.strip);
      if (!img) return;
      const frames = def.frames.length;
      sprites[anim] = {
        img, frames,
        fps: def.fps,
        loop: !!def.loop,
        frameW: img.naturalWidth / frames,
        frameH: img.naturalHeight,
        anchorX: anchor.x,
        anchorY: anchor.y,
      };
    }));
    manifestLoaded = true;
  } catch (e) {
    console.warn("Lyra 스프라이트 로드 실패(절차적 폴백 사용):", e);
  }
}

export function preloadAssets() {
  // 선택적 단일 이미지
  for (const [key, src] of Object.entries(IMAGES)) {
    loadImage(src).then((img) => { if (img) images[key] = img; });
  }
  // Lyra 애니메이션(데이터 주도)
  loadLyraSprites();
}

/** 로드된 단일 이미지 (없으면 null) */
export function getImage(key) {
  const img = images[key];
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** 로드된 스프라이트 정의 (없으면 null) */
export function getSprite(name) {
  return sprites[name] || null;
}

/** 매니페스트에서 클립 설정(프레임/ FPS / loop) — 이미지 로드 전에도 조회용 */
export function getClipMeta(name) {
  if (manifest && manifest.animations[name]) {
    const d = manifest.animations[name];
    return { frames: d.frames.length, fps: d.fps, loop: !!d.loop };
  }
  return null;
}

export function spritesReady() { return manifestLoaded; }

/** 캔버스에 'cover' 방식으로 가득 채워 그리기 */
export function drawCover(ctx, img, w, h) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw, dh;
  if (ir > cr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
