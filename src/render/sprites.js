/* ============================================================
   스프라이트 애니메이션 엔진 + 캐릭터 컨트롤러
   - 애니메이션 정의(프레임 수/FPS/loop/anchor)는 에셋 JSON 매니페스트에서 가져온다.
     (loader.getSprite / getClipMeta) — 에셋이 없으면 아래 CLIPS 기본값으로 폴백.
   - 렌더는 strip 이미지를 anchor 기준으로 그린다. 이미지가 없으면
     pixelArt의 절차적 Lyra가 대신 그린다.
   ============================================================ */

import { getSprite, getClipMeta } from "../assets/loader.js";

// 에셋이 아직 없을 때 쓰는 기본 클립 설정 (에셋 팩과 동일한 이름/구성)
export const CLIPS = {
  idle:     { frames: 4, fps: 6, loop: true },
  walk:     { frames: 5, fps: 8, loop: true },
  observe:  { frames: 5, fps: 7, loop: false },
  absorb:   { frames: 4, fps: 8, loop: false },
  surprise: { frames: 4, fps: 7, loop: false },
  discover: { frames: 4, fps: 7, loop: false },
};

/** 현재 클립 설정: 로드된 스프라이트 → 매니페스트 → 기본값 순으로 조회 */
export function clipConfig(name) {
  return getSprite(name) || getClipMeta(name) || CLIPS[name] || CLIPS.idle;
}

/**
 * 스프라이트 스트립의 한 프레임을 anchor 기준으로 그린다.
 * @param sprite  {img, frames, frameW, frameH, anchorX, anchorY}
 * @param cx,groundY  앵커(보통 발끝)가 놓일 화면 위치
 * @param targetH     화면상 목표 높이(px)
 * @param flip        좌우 반전
 */
export function drawSpriteFrame(ctx, sprite, frameIndex, cx, groundY, targetH, flip) {
  const { img, frameW, frameH, anchorX = 0.5, anchorY = 0.8875 } = sprite;
  const sx = frameIndex * frameW;
  const scale = targetH / frameH;
  const dw = frameW * scale, dh = frameH * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(cx, groundY);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, sx, 0, frameW, frameH, -anchorX * dw, -anchorY * dh, dw, dh);
  ctx.restore();
}

/* ============================================================
   캐릭터 컨트롤러 — 배경에서 캐릭터가 스스로 거닐게 한다.
   idle ↔ walk 를 오가며 언덕을 다니고, 가끔 망원경 쪽에서 observe.
   play(name)으로 1회성 애니메이션(absorb/surprise/discover) 재생.
   ============================================================ */
export class CharacterController {
  constructor() {
    this.x = 0.34;
    this.facing = 1;
    this.clip = "idle";
    this.t = 0;
    this.target = 0.34;
    this.rest = 2;
    this.oneShot = null;
    this.pendingObserve = false;
    this.frozen = false;
    this.minX = 0.18; this.maxX = 0.6; this.telescopeX = 0.5;
  }

  play(name) {
    if (!clipConfig(name)) return;
    this.oneShot = name; this.clip = name; this.t = 0;
  }

  update(dt) {
    this.t += dt;

    if (this.frozen && !this.oneShot) {
      if (this.clip !== "idle") { this.clip = "idle"; this.t = 0; }
      this.facing = 1;
      return;
    }

    if (this.oneShot) {
      const c = clipConfig(this.oneShot);
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
    const c = clipConfig(this.clip);
    let f = Math.floor(this.t * c.fps);
    if (c.loop) f %= c.frames; else f = Math.min(f, c.frames - 1);
    return f;
  }

  sprite() { return getSprite(this.clip); }
}
