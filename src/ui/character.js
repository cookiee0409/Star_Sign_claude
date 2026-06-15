import { el } from "./dom.js";
import { getImage, getImageSrc } from "../assets/loader.js";
import { drawLyraPose } from "../render/pixelArt.js";

const LYRA_SPRITE_MANIFEST = "assets/sprites/lyra/manifest.json";

const STATE_ANIMATION = {
  idle: "idle",
  walk: "walk",
  observe: "telescope",
  telescope: "telescope",
  rest: "rest",
  happy: "idle",
  surprise: "idle",
};

export class CharacterView {
  constructor() {
    this.layer = document.getElementById("char-layer");
    this.state = "idle";
    this.facing = 1;
    this.x = 0.36;
    this._dustTimer = null;
    this.spriteManifest = null;
    this.currentAnimation = null;
    this.animationRaf = null;

    this.frameImage = new Image();
    this.frameImage.className = "lyra-img";
    this.frameImage.draggable = false;

    this.shadow = el(".lyra-shadow");
    this.visual = el(".lyra-visual");
    this.chest = el(".lyra-chest-glow");
    this.lens = el(".lyra-lens-glow");
    this.el = el(".lyra-char", {}, [this.shadow, this.visual, this.chest, this.lens]);
    this.layer.appendChild(this.el);

    this._fallback = el("canvas.lyra-fallback");
    this._fallback.width = 220;
    this._fallback.height = 320;

    const chestBg = getImageSrc("fx.chestGlow");
    if (chestBg) this.chest.style.backgroundImage = `url(${chestBg})`;
    const lensBg = getImageSrc("fx.lensGlow");
    if (lensBg) this.lens.style.backgroundImage = `url(${lensBg})`;

    this.setX(this.x);
    this.setState("idle");
    this._loadSpriteManifest();
    this.hide();
  }

  setX(f) {
    this.x = f;
    this.el.style.left = `${f * 100}%`;
  }

  setFacing(d) {
    this.facing = d;
    this.el.classList.toggle("flip", d < 0);
  }

  glideTo(f, ms = 2200, facing = null) {
    if (facing != null) this.setFacing(facing);
    else this.setFacing(f >= this.x ? 1 : -1);
    this.setState("walk");
    this.el.style.transition = `left ${ms}ms ease-in-out`;
    this.setX(f);
    clearTimeout(this._glideT);
    this._glideT = setTimeout(() => {
      this.el.style.transition = "";
      this.setState("idle");
    }, ms + 50);
  }

  show() {
    this.el.style.display = "block";
    this._startDust();
  }

  hide() {
    this.el.style.display = "none";
    this._stopDust();
  }

  setState(state) {
    this.state = state;
    this.el.dataset.state = state;
    const animationName = STATE_ANIMATION[state] || "idle";

    if (this.spriteManifest && this.spriteManifest.animations[animationName]) {
      this._playSpriteAnimation(animationName);
    } else {
      this._stopSpriteAnimation();
      this._showStaticState(state);
    }

    this.lens.style.display = animationName === "telescope" ? "block" : "none";

    if (state === "happy") {
      this.el.classList.remove("pop");
      void this.el.offsetWidth;
      this.el.classList.add("pop");
      this.burstEnergy();
    }
  }

  async _loadSpriteManifest() {
    try {
      const res = await fetch(LYRA_SPRITE_MANIFEST, { cache: "no-cache" });
      if (!res.ok) return;
      this.spriteManifest = await res.json();
      this._preloadSpriteFrames();
      this.setState(this.state || "idle");
    } catch (e) {
      console.warn("Lyra sprite manifest load failed; using static fallback.", e);
    }
  }

  _preloadSpriteFrames() {
    if (!this.spriteManifest) return;
    for (const [name, def] of Object.entries(this.spriteManifest.animations || {})) {
      for (let i = 0; i < def.frames; i++) {
        const img = new Image();
        img.src = this._frameSrc(name, i);
      }
    }
  }

  _frameSrc(animationName, frameIndex) {
    const def = this.spriteManifest.animations[animationName];
    const base = (this.spriteManifest.basePath || "").replace(/\/$/, "");
    const path = (def.path || "").replace(/^\//, "");
    return `${base}/${path}${String(frameIndex).padStart(2, "0")}.png`;
  }

  _playSpriteAnimation(animationName) {
    const def = this.spriteManifest.animations[animationName];
    if (this.currentAnimation && this.currentAnimation.name === animationName) return;

    this._stopSpriteAnimation();
    this.visual.innerHTML = "";
    this.visual.appendChild(this.frameImage);
    this.currentAnimation = {
      name: animationName,
      def,
      startedAt: performance.now(),
      frameIndex: -1,
    };

    const tick = (now) => {
      if (!this.currentAnimation || this.currentAnimation.name !== animationName) return;
      const anim = this.currentAnimation;
      const frameTime = Math.max(1, 1000 / anim.def.fps);
      const rawFrame = Math.floor((now - anim.startedAt) / frameTime);

      if (!anim.def.loop && rawFrame >= anim.def.frames) {
        this.currentAnimation = null;
        this.setState("idle");
        return;
      }

      const nextFrame = anim.def.loop ? rawFrame % anim.def.frames : Math.min(rawFrame, anim.def.frames - 1);
      if (nextFrame !== anim.frameIndex) {
        anim.frameIndex = nextFrame;
        this.frameImage.src = this._frameSrc(animationName, nextFrame);
      }
      this.animationRaf = requestAnimationFrame(tick);
    };

    tick(performance.now());
  }

  _stopSpriteAnimation() {
    if (this.animationRaf) cancelAnimationFrame(this.animationRaf);
    this.animationRaf = null;
    this.currentAnimation = null;
  }

  _showStaticState(state) {
    const img = getImage(`char.${state}`) || getImage("char.idle");
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
  }

  _startDust() {
    if (this._dustTimer) return;
    const dustBg = getImageSrc("fx.stardust");
    this._dustTimer = setInterval(() => {
      if (this.el.style.display === "none") return;
      const d = el(".lyra-dust");
      if (dustBg) {
        d.style.backgroundImage = `url(${dustBg})`;
        d.classList.add("img");
      }
      const rect = this.el.getBoundingClientRect();
      const w = rect.width || 160;
      const h = rect.height || 280;
      d.style.left = `${w * (0.2 + Math.random() * 0.6)}px`;
      d.style.top = `${h * (0.55 + Math.random() * 0.4)}px`;
      d.style.setProperty("--dx", `${Math.random() * 24 - 12}px`);
      d.style.animationDuration = `${2.4 + Math.random() * 1.8}s`;
      this.el.appendChild(d);
      d.addEventListener("animationend", () => d.remove());
    }, 420);
  }

  _stopDust() {
    clearInterval(this._dustTimer);
    this._dustTimer = null;
  }

  burstEnergy(count = 16) {
    const rect = this.el.getBoundingClientRect();
    const cw = rect.width || 160;
    const ch = rect.height || 280;
    const cx = cw * 0.5;
    const cy = ch * 0.52;
    const orbBg = getImageSrc("fx.energyOrb");
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 90;
      const orb = el(".lyra-orb");
      if (orbBg) orb.style.backgroundImage = `url(${orbBg})`;
      orb.style.left = `${cx + Math.cos(ang) * r}px`;
      orb.style.top = `${cy + Math.sin(ang) * r}px`;
      this.el.appendChild(orb);
      setTimeout(() => {
        orb.style.left = `${cx}px`;
        orb.style.top = `${cy}px`;
        orb.style.opacity = "0";
        orb.style.transform = "scale(0.3)";
      }, 20 + Math.random() * 200);
      setTimeout(() => orb.remove(), 1500);
    }
    this.chest.classList.remove("flash");
    void this.chest.offsetWidth;
    this.chest.classList.add("flash");
  }
}
