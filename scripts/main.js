import {
  ANIMIST_PRACTICES,
  APPARITIONS_DB,
  WANDERING_FEATS_DB,
  getAnimistLimits,
  getApparitionBySlug
} from "./apparitions-db.js";
import { refreshAllTokenSpiritOrbs, registerCanvasSpiritHooks } from "./canvas-spirits.js";
import {
  MODULE_ID,
  applyDailySpiritPreset,
  applyStarterAttunement,
  castVesselSpell,
  dismissVesselSpell,
  disperseApparition,
  executeAnimistFeatAction,
  getActorSpiritState,
  registerChatCardListeners,
  registerLifecycleHooks,
  resolveAnimistActor,
  restoreDispersedApparition,
  rollApparitionLore,
  saveDailySpiritPreset,
  setupSocketListener,
  swapWanderingFeat,
  switchPrimaryApparition,
  syncActorSheetWithState,
  toggleAttunedApparition
} from "./spirit-engine.js";
import {
  closeSpiritDeck,
  registerUIHooks,
  renderSpiritDeck,
  renderSpiritLauncherPill,
  toggleSpiritDeck
} from "./ui-deck.js";

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing PF2e Animist Command Deck`);

  game.settings.register(MODULE_ID, "showVesselEmanationRings", {
    name: "Show Vessel Spell Emanation Rings on Canvas",
    hint: "Displays subtle 5-ft / 10-ft spirit emanation rings when sustaining aura Vessel Spells (native PF2e / Effects Halo handles token icons).",
    scope: "client",
    config: true,
    type: Boolean,
    default: true,
    onChange: () => refreshAllTokenSpiritOrbs()
  });

  game.settings.register(MODULE_ID, "signatureSpells", {
    name: "Mark Apparition Spells as Signature Spells",
    hint: "Per PF2e Animist rules, marks ranked spells in your Apparition Spellcasting repertoire as signature spells automatically.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "autoExpireUnsustained", {
    name: "Auto-Expire Unsustained Vessel Spells at End of Turn",
    hint: "Automatically ends combat Vessel Spells if they were not Sustained before the end of your turn.",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "allowAnyCharacter", {
    name: "Allow Spirit Deck for Any Character",
    hint: "If enabled, displays the Animist Spirit Command Deck launcher even for characters without the Animist class or archetype.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => renderSpiritLauncherPill()
  });

  registerUIHooks();
  registerChatCardListeners();
  registerCanvasSpiritHooks();
});

Hooks.once("ready", () => {
  setupSocketListener();
  registerLifecycleHooks();
  renderSpiritLauncherPill();
  refreshAllTokenSpiritOrbs();

  const api = {
    open: (opts) => toggleSpiritDeck(true, opts),
    close: () => closeSpiritDeck(),
    toggle: (force, opts) => toggleSpiritDeck(force, opts),
    render: () => renderSpiritDeck(),
    apparitions: APPARITIONS_DB,
    practices: ANIMIST_PRACTICES,
    wanderingFeats: WANDERING_FEATS_DB,
    getApparitionBySlug,
    getAnimistLimits,
    resolveAnimistActor,
    getActorSpiritState,
    syncActorSheetWithState,
    toggleAttunedApparition,
    applyStarterAttunement,
    switchPrimaryApparition,
    castVesselSpell,
    sustainVesselSpell: async (actor, vesselId, opts) => {
      const { sustainVesselSpell } = await import("./spirit-engine.js");
      return sustainVesselSpell(actor, vesselId, opts);
    },
    dismissVesselSpell,
    disperseApparition,
    restoreDispersedApparition,
    executeAnimistFeatAction,
    rollApparitionLore,
    swapWanderingFeat,
    saveDailySpiritPreset,
    applyDailySpiritPreset
  };

  globalThis.AnimistCommandDeck = api;
  const mod = game.modules.get(MODULE_ID);
  if (mod) mod.api = api;

  console.log(`${MODULE_ID} | Ready (${APPARITIONS_DB.length} Apparitions & Vessel Spells loaded).`);
});
