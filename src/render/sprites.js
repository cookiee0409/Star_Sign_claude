/* ============================================================
   스프라이트 애니메이션 엔진 + 캐릭터 컨트롤러
   - 각 애니메이션은 "가로 스트립"(프레임이 가로로 N등분된 PNG)으로 가정.
   - 에셋이 없으면 컨트롤러 상태만 갱신되고, 렌더는 절차적 폴백(pixelArt)이 처리.
   ============================================================ */

import { getSprite } from "../assets/loader.js";

// 첨부된 애니메이션 시트 기준 프레임 수 / 재생 속도
export const CLIPS = {
  idle:      { frames: 4, fps: 6,  loop: true },
  walk:      { frames: 5, fps: 10, loop: true },
  observe:   { frames: 5, fps: 7,  loop: false },
  absorb:    { frames: 4, fps: 8,  loop: false },
  surprise:  { frames: 4, fps: 7,  loop: false },
  discovery: { frames: 4, fps: 6,  loop: false },
};

/**
 * 스프라이트 스트립의 한 프레임을 그린다.
 * @param sprite {img, frames}
 * @param cx,groundY  발끝(아래 중앙) 기준
 * @param targetH     화면상 목표 높이(px)
 * @param flip        좌우 반전
 */
export function drawSpriteFrame(ctx, sprite, frameIndex, cx, groundY, targetH, flip) {
  const fw = sprite.img.naturalWidth / sprite.frames;
  const fh = sprite.img.naturalHeight;
  const scale = targetH / fh;
  const dw = fw * scale, dh = fh * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, groundY);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sprite.img, frameIndex * fw, 0, fw, fh, -dw / 2, -dh, dw, dh);
  ctx.restore();
}

/* ============================================================
   캐릭터 컨트롤러 — 배경에서 캐릭터가 스스로 돌아다니게 한다.
   - idle ↔ walk 를 오가며 언덕 위를 거닐고,
     가끔 망원경 쪽으로 가 observe(관찰)한다.
   - play(name)으로 한 번짜리 애니메이션(absorb/surprise/discovery)을 강제 재생.
   ============================================================ */
export class CharacterController {
  constructor() {
    this.x = 0.34;          // 화면 가로 비율(0~1)
    this.facing = 1;        // 1: 오른쪽, -1: 왼쪽
    this.clip = "idle";
    this.t = 0;
    this.target = 0.34;
    this.rest = 2;
    this.oneShot = null;
    this.pendingObserve = false;
    this.minX = 0.18; this.maxX = 0.6; this.telescopeX = 0.5;
  }

  play(name) {
    if (!CLIPS[name]) return;
    this.oneShot = name; this.clip = name; this.t = 0;
  }

  update(dt) {
    this.t += dt;

    // 대화 중에는 정지 + 정면 idle
    if (this.frozen && !this.oneShot) {
      if (this.clip !== "idle") { this.clip = "idle"; this.t = 0; }
      this.facing = 1;
      return;
    }

    if (this.oneShot) {
      const c = CLIPS[this.oneShot];
      if (this.t >= c.frames / c.fps) { this.oneShot = null; this.clip = "idle"; this.t = 0; }
      return;
    }

    if (this.clip === "walk") {
      const dir = Math.sign(this.target - this.x) || 1;
      this.facing = dir;
      this.x += dir * dt * 0.05;
      if (Math.abs(this.target - this.x) < 0.008) {
        this.x = this.target;
        this.clip = "idle"; this.t = 0;
        this.rest = 1.6 + Math.random() * 2.8;
        if (this.pendingObserve) { this.pendingObserve = false; this.facing = 1; this.play("observe"); }
      }
    } else { // idle
      this.rest -= dt;
      if (this.rest <= 0) {
        if (Math.random() < 0.28) { this.target = this.telescopeX; this.pendingObserve = true; }
        else this.target = this.minX + Math.random() * (this.maxX - this.minX);
        this.clip = "walk"; this.t = 0;
      }
    }
  }

  frameIndex() {
    const c = CLIPS[this.clip] || CLIPS.idle;
    let f = Math.floor(this.t * c.fps);
    if (c.loop) f %= c.frames; else f = Math.min(f, c.frames - 1);
    return f;
  }

  /** 현재 클립의 스프라이트(에셋)가 있으면 반환, 없으면 null */
  sprite() { return getSprite(this.clip); }
}
