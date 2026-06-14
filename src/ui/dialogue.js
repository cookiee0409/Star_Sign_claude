/* ============================================================
   대화창 — 초상화 + 타자기 효과
   - 라인마다 화자/표정/텍스트 표시. 표정은 첨부 초상화(assets/portraits/*)
     이미지가 있으면 그걸 쓰고, 없으면 절차적 초상화로 폴백.
   - 클릭/Enter/Space로 진행(타이핑 중이면 즉시 완성).
   ============================================================ */

import { el, mount } from "./dom.js";
import { getImage, drawCover } from "../assets/loader.js";
import { drawLyraPortrait } from "../render/pixelArt.js";
import { Sfx } from "../audio/sound.js";

export function runDialogue(lines, { onLine, onDone } = {}) {
  let i = 0, typing = false, typed = 0, full = "", typer = null, pRaf = null;

  const portrait = el("canvas.dlg-portrait");
  portrait.width = 220; portrait.height = 220;
  const portraitWrap = el(".dlg-portrait-wrap", {}, [portrait]);
  const speaker = el(".dlg-speaker");
  const textEl = el(".dlg-text");
  const hint = el(".dlg-hint", { text: "클릭 / Enter ▸" });
  const box = el(".dialogue2", {}, [
    portraitWrap,
    el(".dlg-body", {}, [speaker, textEl, hint]),
  ]);

  function drawPortraitLoop(expr) {
    cancelAnimationFrame(pRaf);
    const ctx = portrait.getContext("2d");
    const loop = (tt) => {
      if (!document.body.contains(portrait)) return;
      const img = getImage("portrait." + expr);
      if (img) { ctx.clearRect(0, 0, 220, 220); drawCover(ctx, img, 220, 220); }
      else drawLyraPortrait(ctx, 220, 220, expr, tt);
      pRaf = requestAnimationFrame(loop);
    };
    pRaf = requestAnimationFrame(loop);
  }

  function render() {
    const line = lines[i];
    speaker.textContent = line.who;
    full = line.text; typed = 0; typing = true; textEl.textContent = "";

    if (line.expr) { portraitWrap.style.display = "block"; box.classList.remove("no-portrait"); drawPortraitLoop(line.expr); }
    else { portraitWrap.style.display = "none"; box.classList.add("no-portrait"); cancelAnimationFrame(pRaf); }

    onLine && onLine(line);

    clearInterval(typer);
    typer = setInterval(() => {
      typed++;
      textEl.textContent = full.slice(0, typed);
      if (typed % 2 === 0) Sfx.coordType();
      if (typed >= full.length) { typing = false; clearInterval(typer); }
    }, 26);
  }

  function cleanup() {
    clearInterval(typer);
    cancelAnimationFrame(pRaf);
    window.removeEventListener("keydown", onKey);
    box.remove();
  }

  function advance() {
    if (typing) { typed = full.length; textEl.textContent = full; typing = false; clearInterval(typer); return; }
    Sfx.click();
    i++;
    if (i >= lines.length) { cleanup(); onDone && onDone(); }
    else render();
  }

  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); advance(); }
  }

  box.addEventListener("click", advance);
  window.addEventListener("keydown", onKey);
  mount(box);
  render();
  return box;
}
