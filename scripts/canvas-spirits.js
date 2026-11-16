import { getApparitionBySlug } from "./apparitions-db.js?v=1.1.1";
import { MODULE_ID, getActorSpiritState, isAnimistActor } from "./spirit-engine.js?v=1.1.1";

const CONTAINER_NAME = "acdSpiritAuraContainer";
let rangePreviewGraphics = null;

function hexToInt(hexStr) {
  const clean = String(hexStr || "#34d399").replace("#", "");
  const parsed = Number.parseInt(clean, 16);
  return Number.isFinite(parsed) ? parsed : 0x34d399;
}

/**
 * Render subtle sustained Vessel Spell emanation rings on the canvas (never custom two-letter circles;
 * native PF2e / pf2e-effects-halo handles token effect icons cleanly per BUG-261116-02).
 */
export function refreshAllTokenSpiritOrbs() {
  const cvs = globalThis.canvas;
  if (!cvs?.ready || !cvs.tokens?.placeables) return;
  const showAuras = game.settings?.get(MODULE_ID, "showVesselEmanationRings") !== false;
  const pxPerFt = (Number(cvs.grid?.size) || 100) / (Number(cvs.scene?.grid?.distance) || 5);

  for (const token of cvs.tokens.placeables) {
    const prev = token.children?.find((c) => c.name === CONTAINER_NAME);
    if (prev) {
      token.removeChild(prev);
      prev.destroy({ children: true });
    }
    if (!showAuras || !token.actor || !isAnimistActor(token.actor)) continue;

    const state = getActorSpiritState(token.actor);
    if (!state.activeVessels.length) continue;

    const container = new PIXI.Container();
    container.name = CONTAINER_NAME;
    container.eventMode = "none";

    const tokenW = Math.max(32, Number(token.w) || 50);
    const tokenH = Math.max(32, Number(token.h) || 50);

    let drawn = 0;
    for (const v of state.activeVessels) {
      const app = getApparitionBySlug(v.apparitionSlug);
      const emanationFt = Number(app?.vessel?.emanationFeet || 0);
      if (emanationFt > 0) {
        const aura = new PIXI.Graphics();
        const radiusPx = emanationFt * pxPerFt + Math.max(tokenW, tokenH) * 0.5;
        const colorInt = hexToInt(app.color);
        aura.lineStyle(1.8, colorInt, 0.55);
        aura.beginFill(colorInt, 0.06);
        aura.drawCircle(tokenW * 0.5, tokenH * 0.5, radiusPx);
        aura.endFill();
        container.addChild(aura);
        drawn += 1;
      }
    }

    if (drawn > 0) {
      token.addChild(container);
    } else {
      container.destroy({ children: true });
    }
  }
}

export function previewSpiritRangeOnCanvas(sourceToken, rangeFeet = 30, colorHex = "#34d399") {
  clearSpiritRangePreview();
  const cvs = globalThis.canvas;
  if (!cvs?.ready || !sourceToken || rangeFeet <= 0) return;
  try {
    const pxPerFt = (Number(cvs.grid?.size) || 100) / (Number(cvs.scene?.grid?.distance) || 5);
    const radiusPx = rangeFeet * pxPerFt + (sourceToken.w || 50) * 0.5;
    const g = new PIXI.Graphics();
    g.name = "acdRangePreview";
    g.eventMode = "none";
    g.lineStyle(1.8, hexToInt(colorHex), 0.65);
    g.beginFill(hexToInt(colorHex), 0.05);
    g.drawCircle(sourceToken.center.x, sourceToken.center.y, radiusPx);
    g.endFill();
    cvs.interface?.grid?.addChild(g);
    rangePreviewGraphics = g;
  } catch (_e) {
    // Ignore transient scene teardown errors
  }
}

export function clearSpiritRangePreview() {
  if (rangePreviewGraphics) {
    try {
      rangePreviewGraphics.parent?.removeChild(rangePreviewGraphics);
      rangePreviewGraphics.destroy();
    } catch (_e) {
      // Already cleaned up
    }
    rangePreviewGraphics = null;
  }
}

export function registerCanvasSpiritHooks() {
  Hooks.on("canvasReady", () => refreshAllTokenSpiritOrbs());
  Hooks.on("refreshToken", () => {
    if (registerCanvasSpiritHooks._timer) return;
    registerCanvasSpiritHooks._timer = setTimeout(() => {
      registerCanvasSpiritHooks._timer = null;
      refreshAllTokenSpiritOrbs();
    }, 120);
  });
  Hooks.on(`${MODULE_ID}.refreshSpirits`, () => refreshAllTokenSpiritOrbs());
}
