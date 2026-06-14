/* ============================================================
   캐릭터(Lyra) 뷰 — 정지 PNG + CSS/JS 모션
   제안서(Character Animation Implementation) 방식:
   - 프레임 애니메이션 없이 상태별 정지 PNG를 교체.
   - idle: CSS로 위아래 둥실 + 가슴 별 glow + 별가루 파티클.
   - observe: 망원경 렌즈 위치 pulse glow.
   - happy: happy PNG로 교체 + 별에너지 흡수 파티클(별도 레이어).
   - 좌우 반전은 CSS transform: scaleX(-1), 이동은 glide.
   PNG가 없으면 절차적 포즈(canvas)로 폴백.
   ============================================================ */

import { el } from "./dom.js";
import { getImage, getImageSrc } from "../assets/loader.js";
import { drawLyraPose } from "../render/pixelArt.js";

export class CharacterView {
  constructor() {
    this.layer = document.getElementById("char-layer");
    this.state = "idle";
    this.facing = 1;
    this.x = 0.36;
    this._dustTimer = null;

    this.shadow = el(".lyra-shadow");
    this.visual = el(".lyra-visual");
    this.chest = el(".lyra-chest-glow");
    this.lens = el(".lyra-lens-glow");
    this.el = el(".lyra-char", {}, [this.shadow, this.visual, this.chest, this.lens]);
    this.layer.appendChild(this.el);

    this._fallback = el("canvas.lyra-fallback");
    this._fallback.width = 220; this._fallback.height = 320;

    // 이펙트 PNG가 있으면 background로 사용(없으면 CSS 그라데이션)
    const chestBg = getImageSrc("fx.chestGlow");
    if (chestBg) this.chest.style.backgroundImage = `url(${chestBg})`;
    const lensBg = getImageSrc("fx.lensGlow");
    if (lensBg) this.lens.style.backgroundImage = `url(${lensBg})`;

    this.setX(this.x);
    this.setState("idle");
    this.hide();
  }

  setX(f) { this.x = f; this.el.style.left = (f * 100) + "%"; }
  setFacing(d) { this.facing = d; this.el.classList.toggle("flip", d < 0); }

  /** 천천히 미끄러지듯 이동(걷기 애니메이션 대신) */
  glideTo(f, ms = 2200, facing = null) {
    if (facing != null) this.setFacing(facing);
    else this.setFacing(f >= this.x ? 1 : -1);
    this.el.style.transition = `left ${ms}ms ease-in-out`;
    this.setX(f);
    clearTimeout(this._glideT);
    this._glideT = setTimeout(() => { this.el.style.transition = ""; }, ms + 50);
  }

  show() {
    this.el.style.display = "block";
    this._startDust();
  }
  hide() {
    this.el.style.display = "none";
    this._stopDust();
  }

  /** 상태 전환: idle | observe | happy | surprise */
  setState(state) {
    this.state = state;
    this.el.dataset.state = state;

    // 비주얼: 상태 PNG → idle PNG → 절차적 폴백
    const img = getImage("char." + state) || getImage("char.idle");
    this.visual.innerHTML = "";
    if (img) {
      const im = new Image();
      im.className = "lyra-img";
      im.src = img.src;
      this.visual.appendChild(im);
    } else {
      drawLyraPose(this._fallback.getContext("2d"), this._fallback.width, this._fallback.height, state);
      this.visual.appendChild(this._fallback);
    }

    // 렌즈 glow는 관측 상태에서만
    this.lens.style.display = state === "observe" ? "block" : "none";

    if (state === "happy") {
      this.el.classList.remove("pop"); void this.el.offsetWidth; this.el.classList.add("pop");
      this.burstEnergy();
    }
  }

  /* ---------- 별가루 파티클 ---------- */
  _startDust() {
    if (this._dustTimer) return;
    const dustBg = getImageSrc("fx.stardust");
    this._dustTimer = setInterval(() => {
      if (this.el.style.display === "none") return;
      const d = el(".lyra-dust");
      if (dustBg) { d.style.backgroundImage = `url(${dustBg})`; d.classList.add("img"); }
      const rect = this.el.getBoundingClientRect();
      const w = rect.width || 160, h = rect.height || 280;
      d.style.left = (w * (0.2 + Math.random() * 0.6)) + "px";
      d.style.top = (h * (0.55 + Math.random() * 0.4)) + "px";
      d.style.setProperty("--dx", (Math.random() * 24 - 12) + "px");
      d.style.animationDuration = (2.4 + Math.random() * 1.8) + "s";
      this.el.appendChild(d);
      d.addEventListener("animationend", () => d.remove());
    }, 420);
  }
  _stopDust() { clearInterval(this._dustTimer); this._dustTimer = null; }

  /* ---------- 별에너지 흡수 파티클(가슴으로) ---------- */
  burstEnergy(count = 16) {
    const rect = this.el.getBoundingClientRect();
    const cw = rect.width || 160, ch = rect.height || 280;
    const cx = cw * 0.5, cy = ch * 0.52; // 가슴 별 위치
    const orbBg = getImageSrc("fx.energyOrb");
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 90;
      const orb = el(".lyra-orb");
      if (orbBg) orb.style.backgroundImage = `url(${orbBg})`;
      orb.style.left = (cx + Math.cos(ang) * r) + "px";
      orb.style.top = (cy + Math.sin(ang) * r) + "px";
      this.el.appendChild(orb);
      setTimeout(() => {
        orb.style.left = cx + "px";
        orb.style.top = cy + "px";
        orb.style.opacity = "0";
        orb.style.transform = "scale(0.3)";
      }, 20 + Math.random() * 200);
      setTimeout(() => orb.remove(), 1500);
    }
    this.chest.classList.remove("flash"); void this.chest.offsetWidth; this.chest.classList.add("flash");
  }
}
