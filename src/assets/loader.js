/* ============================================================
   선택적 이미지 에셋 로더
   - assets/ 폴더에 PNG를 넣으면 해당 그림으로 자동 교체된다.
   - 파일이 없으면 절차적(픽셀) 렌더링으로 그대로 진행 (graceful fallback).
   교체 가능 키:
     bgHill : 어드벤처/메뉴 배경 (언덕·은하수 장면, 아빠 없는 버전 권장)
     lyra   : 주인공 Lyra 스프라이트 (배경 투명 PNG, 발끝 기준 중앙 정렬)
   ============================================================ */

const MANIFEST = {
  bgHill: "assets/bg-hill.png",
  lyra: "assets/lyra.png",
};

const images = {};

export function preloadAssets() {
  for (const [key, src] of Object.entries(MANIFEST)) {
    const img = new Image();
    img.onload = () => { images[key] = img; };
    img.onerror = () => { /* 파일 없음 → 절차적 렌더링 사용 */ };
    img.src = src;
  }
}

/** 로드 완료된 이미지 반환. 없으면 null */
export function getImage(key) {
  const img = images[key];
  return img && img.complete && img.naturalWidth > 0 ? img : null;
}

/** 캔버스에 'cover' 방식으로 가득 채워 그리기 */
export function drawCover(ctx, img, w, h) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw, dh;
  if (ir > cr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
