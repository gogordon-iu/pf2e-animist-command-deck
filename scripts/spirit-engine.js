import {
  APPARITIONS_DB,
  BONUS_APPARITION_SPELLS,
  COMBAT_FEAT_ACTIONS,
  WANDERING_FEATS_DB,
  WISH_MARKET_BONUS_SKILLS,
  WISH_MARKET_PRICES,
  actorHasFeat,
  getAllApparitionLoreNames,
  getAllKnownApparitionSpellUuids,
  getAnimistLimits,
  getApparitionBySlug
} from "./apparitions-db.js?v=1.1.1";

export const MODULE_ID = "pf2e-animist-command-deck";
export const SOCKET_NAME = `module.${MODULE_ID}`;

let stateMutationQueue = Promise.resolve();

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isPrimaryGM() {
  if (!game.user?.isGM) return false;
  const activeGM = game.users?.activeGM;
  return !activeGM || activeGM.id === game.user.id;
}

export function isAnimistActor(actor) {
  if (!actor || actor.type !== "character") return false;
  if (actor.class?.slug === "animist") return true;
  const rollOpts = actor.rollOptions?.all ?? {};
  if (rollOpts["class:animist"] || rollOpts["feat:animist-dedication"]) return true;
  return Boolean(
    actor.items?.some((i) => {
      const slug = i.slug || i.system?.slug || "";
      return (
        slug === "animist" ||
        slug === "apparition-attunement" ||
        slug === "animist-dedication" ||
        slug === "animistic-practice"
      );
    })
  );
}

export function getCandidateAnimistActors() {
  const allChars = (game.actors?.contents ?? []).filter((a) => a.type === "character" && a.isOwner);
  const animists = allChars.filter(isAnimistActor);
  return animists.length > 0 ? animists : allChars;
}

export function resolveAnimistActor(preferredActorId = null) {
  if (preferredActorId) {
    const preferred = game.actors?.get(preferredActorId);
    if (preferred && preferred.isOwner) return preferred;
  }
  const controlled = globalThis.canvas?.tokens?.controlled?.[0]?.actor;
  if (controlled && controlled.isOwner && isAnimistActor(controlled)) return controlled;
  if (game.user?.character && isAnimistActor(game.user.character)) return game.user.character;
  const ownedAnimist = (game.actors?.contents ?? []).find((a) => a.isOwner && isAnimistActor(a));
  if (ownedAnimist) return ownedAnimist;
  if (controlled && controlled.isOwner && controlled.type === "character") return controlled;
  return game.user?.character ?? null;
}

export function getActorTokenOnCanvas(actor) {
  const cvs = globalThis.canvas;
  if (!actor || !cvs?.ready) return null;
  const controlledMatch = cvs.tokens?.controlled?.find((t) => t.actor?.id === actor.id);
  if (controlledMatch) return controlledMatch;
  const active = actor.getActiveTokens?.(true, false)?.[0];
  if (active) return active;
  return cvs.tokens?.placeables?.find((t) => t.actor?.id === actor.id) ?? null;
}

export function getAnimistSpellStats(actor) {
  const level = Math.max(1, Number(actor?.system?.details?.level?.value ?? actor?.level ?? 1));
  // Prefer highest divine spellcasting entry statistic if present
  const entries = actor?.itemTypes?.spellcastingEntry ?? [];
  const divineEntry =
    entries.find((e) => e.system?.tradition?.value === "divine" && e.statistic?.dc?.value) ??
    entries.find((e) => e.statistic?.dc?.value);

  if (divineEntry?.statistic) {
    return {
      dc: Number(divineEntry.statistic.dc?.value ?? 17),
      attackMod: Number(divineEntry.statistic.check?.mod ?? (divineEntry.statistic.dc?.value ?? 17) - 10),
      rank: Math.max(1, Math.min(10, Math.ceil(level / 2)))
    };
  }

  const classDC =
    actor?.system?.proficiencies?.classDCs?.animist?.dc?.value ??
    actor?.classDC?.dc?.value;
  if (Number.isFinite(Number(classDC)) && Number(classDC) > 0) {
    const dcNum = Number(classDC);
    return {
      dc: dcNum,
      attackMod: dcNum - 10,
      rank: Math.max(1, Math.min(10, Math.ceil(level / 2)))
    };
  }

  const wisMod = Number(actor?.system?.abilities?.wis?.mod ?? actor?.abilities?.wis?.mod ?? 4);
  const profBonus = level >= 19 ? 8 : level >= 15 ? 6 : level >= 7 ? 4 : 2;
  const fallbackMod = level + profBonus + wisMod;
  return {
    dc: 10 + fallbackMod,
    attackMod: fallbackMod,
    rank: Math.max(1, Math.min(10, Math.ceil(level / 2)))
  };
}

export function measureDistanceFeet(tokenA, tokenB) {
  if (!tokenA || !tokenB) return null;
  if (tokenA.id === tokenB.id) return 0;
  try {
    if (typeof tokenA.distanceTo === "function") {
      const d = Number(tokenA.distanceTo(tokenB));
      if (Number.isFinite(d)) return Math.max(0, Math.round(d));
    }
  } catch (_e) {
    // Fallback below
  }
  const gridSize = Number(globalThis.canvas?.grid?.size) || 100;
  const gridDist = Number(globalThis.canvas?.scene?.grid?.distance) || 5;
  const ax = tokenA.center?.x ?? tokenA.x ?? 0;
  const ay = tokenA.center?.y ?? tokenA.y ?? 0;
  const bx = tokenB.center?.x ?? tokenB.x ?? 0;
  const by = tokenB.center?.y ?? tokenB.y ?? 0;
  const pxDist = Math.hypot(ax - bx, ay - by);
  const rawFeet = (pxDist / gridSize) * gridDist;
  return Math.max(0, Math.round(rawFeet / 5) * 5);
}

/**
 * Infer initial attuned apparitions from existing Pathmuncher / PF2e sheet Lores & Spells.
 */
export function inferApparitionsFromActor(actor) {
  if (!actor?.items) return [];
  const limits = getAnimistLimits(actor);
  const spellSourceIds = new Set();
  const spellNames = new Set();
  const loreNames = new Set();

  for (const item of actor.items) {
    if (item.type === "spell") {
      const src = item.sourceId || item._stats?.compendiumSource || "";
      if (src) spellSourceIds.add(src);
      spellNames.add(String(item.name || "").toLowerCase());
    } else if (item.type === "lore") {
      const clean = String(item.name || "")
        .toLowerCase()
        .replace(/\s+lore$/i, "")
        .trim();
      if (clean) loreNames.add(clean);
    }
  }

  // Also check RollOptions if pf2e-animist or pf2e-dailies set any
  const rollOpts = Object.keys(actor.rollOptions?.all ?? {});
  const fromRollOpts = [];
  for (const prefix of ["primary-apparition:", "secondary-apparition:", "third-apparition:", "fourth-apparition:"]) {
    for (const opt of rollOpts) {
      if (opt.startsWith(prefix)) {
        const slug = opt.slice(prefix.length);
        if (getApparitionBySlug(slug) && !fromRollOpts.includes(slug)) {
          fromRollOpts.push(slug);
        }
      }
    }
  }
  if (fromRollOpts.length > 0) {
    return fromRollOpts.slice(0, limits.maxAttuned);
  }

  const scored = APPARITIONS_DB.map((app) => {
    let score = 0;
    for (const lore of app.lores) {
      if (loreNames.has(lore.toLowerCase())) score += 4;
    }
    for (const sp of app.spells) {
      if (sp.rank <= limits.maxRank) {
        if (spellSourceIds.has(sp.uuid)) score += 3;
        else if (spellNames.has(sp.name.toLowerCase())) score += 2;
      }
    }
    if (spellSourceIds.has(app.vessel.uuid) || spellNames.has(app.vessel.name.toLowerCase())) {
      score += 5;
    }
    return { slug: app.slug, score };
  })
    .filter((x) => x.score >= 4)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limits.maxAttuned).map((x) => x.slug);
}

/**
 * Check whether the actor's sheet is missing its Vessel Spells focus entry or needs synchronization.
 */
export function doesSheetNeedSync(actor, state) {
  if (!actor || !state?.attuned?.length) return false;
  const limits = getAnimistLimits(actor);
  if (!limits.isFullAnimist) return false;

  const entries = actor.itemTypes?.spellcastingEntry ?? [];
  const hasFocusVessel = entries.some(
    (e) =>
      e.system?.prepared?.value === "focus" &&
      (e.getFlag(MODULE_ID, "entryRole") === "vessel" ||
        /vessel/i.test(e.name || "") ||
        e.flags?.["pf2e-animist"]?.generated)
  );
  if (!hasFocusVessel) return true;

  const vesselEntry = findVesselSpellcastingEntry(actor);
  if (!vesselEntry) return true;

  const vesselSpells = (actor.itemTypes?.spell ?? []).filter(
    (s) => s.system?.location?.value === vesselEntry.id
  );
  if (vesselSpells.length === 0 && state.primary.length > 0) return true;

  return !state.syncedOnce;
}

export function getActorSpiritState(actor) {
  const limits = getAnimistLimits(actor);
  const raw = actor?.getFlag(MODULE_ID, "state");
  const state = raw && typeof raw === "object" ? foundry.utils.deepClone(raw) : {};

  let attuned = Array.isArray(state.attuned)
    ? state.attuned.filter((s, idx, arr) => Boolean(getApparitionBySlug(s)) && arr.indexOf(s) === idx)
    : [];

  if (attuned.length === 0 && actor && isAnimistActor(actor)) {
    attuned = inferApparitionsFromActor(actor);
  }
  attuned = attuned.slice(0, limits.maxAttuned);

  const dispersed = Array.isArray(state.dispersed)
    ? state.dispersed.filter((s) => attuned.includes(s))
    : [];

  const activeAttuned = attuned.filter((s) => !dispersed.includes(s));

  let primary = Array.isArray(state.primary)
    ? state.primary.filter((s) => activeAttuned.includes(s))
    : [];

  if (primary.length === 0 && activeAttuned.length > 0) {
    primary = activeAttuned.slice(0, limits.maxPrimary);
  } else if (primary.length > limits.maxPrimary) {
    primary = primary.slice(0, limits.maxPrimary);
  }
  if (limits.maxPrimary === 2 && primary.length === 1 && activeAttuned.length >= 2) {
    const second = activeAttuned.find((s) => !primary.includes(s));
    if (second) primary.push(second);
  }

  let familiarSpirit = state.familiarSpirit && activeAttuned.includes(state.familiarSpirit)
    ? state.familiarSpirit
    : null;
  if (!familiarSpirit && limits.hasSpiritFamiliar && activeAttuned.length > 0) {
    familiarSpirit = primary[0] ?? activeAttuned[0];
  }

  const activeVessels = Array.isArray(state.activeVessels)
    ? state.activeVessels.filter((v) => v && Boolean(getApparitionBySlug(v.apparitionSlug)))
    : [];

  return {
    attuned,
    primary,
    dispersed,
    familiarSpirit,
    familiarIncorporeal: Boolean(state.familiarIncorporeal),
    relinquishLockedSpirit: state.relinquishLockedSpirit && getApparitionBySlug(state.relinquishLockedSpirit)
      ? state.relinquishLockedSpirit
      : null,
    crafterVowLocked: Boolean(state.crafterVowLocked),
    activeVessels,
    circleUsedThisTurn: Boolean(state.circleUsedThisTurn),
    cooldowns10Min: state.cooldowns10Min && typeof state.cooldowns10Min === "object" ? state.cooldowns10Min : {},
    dailyPreset: state.dailyPreset && typeof state.dailyPreset === "object" ? state.dailyPreset : null,
    wishSkill: state.wishSkill || "religion",
    syncedOnce: Boolean(state.syncedOnce)
  };
}

export function clearObjectFlags(mapObj) {
  const out = {};
  if (mapObj && typeof mapObj === "object") {
    for (const k of Object.keys(mapObj)) {
      out[k] = false;
    }
  }
  return out;
}

export function mutateActorSpiritState(actor, mutatorFn) {
  if (!actor) return Promise.resolve(null);
  stateMutationQueue = stateMutationQueue
    .then(async () => {
      const current = getActorSpiritState(actor);
      const next = (await mutatorFn(current)) ?? current;
      if (typeof actor.update === "function" && actor.documentName === "Actor") {
        await actor.update({ [`flags.${MODULE_ID}.==state`]: next });
      } else {
        await actor.setFlag(MODULE_ID, "state", next);
      }
      Hooks.callAll(`${MODULE_ID}.stateChanged`, actor, next);
      broadcastCanvasRefresh();
      return next;
    })
    .catch((err) => {
      console.error(`${MODULE_ID} | Failed mutating spirit state:`, err);
      return null;
    });
  return stateMutationQueue;
}

export function broadcastCanvasRefresh() {
  Hooks.callAll(`${MODULE_ID}.refreshSpirits`);
  try {
    game.socket?.emit(SOCKET_NAME, { action: "refreshSpirits" });
  } catch (_e) {
    // Socket may not be ready during init
  }
}

export function findSpontaneousApparitionEntry(actor) {
  const entries = actor?.itemTypes?.spellcastingEntry ?? [];
  return (
    entries.find((e) => e.getFlag(MODULE_ID, "entryRole") === "apparition-spontaneous") ??
    entries.find((e) => e.flags?.["pf2e-animist"]?.generated && e.system?.prepared?.value === "spontaneous") ??
    entries.find(
      (e) =>
        e.system?.prepared?.value === "spontaneous" &&
        /apparition/i.test(e.name || "")
    ) ??
    null
  );
}

export function findVesselSpellcastingEntry(actor) {
  const entries = actor?.itemTypes?.spellcastingEntry ?? [];
  const dailiesName = game.i18n?.has?.("pf2e-dailies.animist.spellcasting.focus")
    ? game.i18n.localize("pf2e-dailies.animist.spellcasting.focus")
    : "Vessel Spells";
  return (
    entries.find((e) => e.getFlag(MODULE_ID, "entryRole") === "vessel") ??
    entries.find((e) => e.flags?.["pf2e-animist"]?.generated && e.system?.prepared?.value === "focus") ??
    entries.find(
      (e) =>
        e.system?.prepared?.value === "focus" &&
        (/vessel/i.test(e.name || "") || e.name === dailiesName)
    ) ??
    null
  );
}

/**
 * Synchronize Actor's Sheet (Apparition Spontaneous Spells, Vessel Focus Spells, Focus Pool, and Apparition Lores)
 * cleanly with Pathmuncher & manual PF2e character sheets.
 */
export async function syncActorSheetWithState(actor, options = {}) {
  if (!actor || !actor.isOwner) return null;
  const refreshSlots = Boolean(options.refreshSlots);
  const silent = Boolean(options.silent);
  const state = options.stateOverride ?? getActorSpiritState(actor);
  const limits = getAnimistLimits(actor);

  const activeSlugs = state.attuned.filter((s) => !state.dispersed.includes(s));
  const activeApps = activeSlugs.map((s) => getApparitionBySlug(s)).filter(Boolean);
  const primaryApps = state.primary
    .filter((s) => activeSlugs.includes(s))
    .map((s) => getApparitionBySlug(s))
    .filter(Boolean);

  // 1. Sync Apparition Lore Skills (clean up old generated or Pathmuncher apparition lores, preserve custom background lores)
  const knownApparitionLoreSet = getAllApparitionLoreNames();
  const desiredLores = [];
  const seenLoreLower = new Set();
  for (const app of activeApps) {
    for (const lore of app.lores) {
      const key = lore.toLowerCase();
      if (!seenLoreLower.has(key)) {
        seenLoreLower.add(key);
        desiredLores.push(lore);
      }
    }
  }

  const existingLores = actor.itemTypes?.lore ?? [];
  const loreIdsToDelete = [];
  for (const loreItem of existingLores) {
    const isFlagged =
      loreItem.getFlag(MODULE_ID, "generated") ||
      Boolean(loreItem.flags?.["pf2e-animist"]?.generated) ||
      Boolean(loreItem.flags?.["pf2e-dailies"]?.temporary);
    const cleanName = String(loreItem.name || "").toLowerCase().trim();
    const isPathmuncherApparitionLore =
      Boolean(loreItem.flags?.pathmuncher || actor.flags?.pathmuncher) &&
      knownApparitionLoreSet.has(cleanName);

    if (isFlagged || isPathmuncherApparitionLore) {
      loreIdsToDelete.push(loreItem.id);
    }
  }

  // 2. Ensure Spontaneous & Focus Spellcasting Entries (for full Animists)
  let spontEntry = findSpontaneousApparitionEntry(actor);
  let vesselEntry = findVesselSpellcastingEntry(actor);

  if (limits.isFullAnimist) {
    if (!spontEntry) {
      const slotsObj = {
        slot0: { prepared: [], value: 0, max: 0 }
      };
      for (let r = 1; r <= 10; r++) {
        const sCount = limits.spontaneousSlots[r - 1] ?? 0;
        slotsObj[`slot${r}`] = { prepared: [], value: sCount, max: sCount };
      }
      slotsObj.slot11 = { prepared: [], value: 0, max: 0 };

      const created = await actor.createEmbeddedDocuments("Item", [
        {
          name: "Apparition Spellcasting",
          type: "spellcastingEntry",
          img: "systems/pf2e/icons/default-icons/spellcastingEntry.svg",
          system: {
            ability: { value: "wis" },
            tradition: { value: "divine" },
            prepared: { value: "spontaneous", flexible: false },
            showSlotlessLevels: { value: false },
            proficiency: { value: 1, slug: "" },
            slots: slotsObj
          },
          flags: {
            [MODULE_ID]: { generated: true, entryRole: "apparition-spontaneous" }
          }
        }
      ]);
      spontEntry = created?.[0] ?? null;
    } else {
      // Update slot maximums while preserving spent slots unless refreshSlots=true, and clear Pathmuncher ghost prepared maps
      const slotUpdates = {
        [`flags.${MODULE_ID}.entryRole`]: "apparition-spontaneous",
        "system.slots.slot0.prepared": []
      };
      for (let r = 1; r <= 10; r++) {
        const sMax = r === 10 && !limits.hasSupremeIncarnation ? 0 : (limits.spontaneousSlots[r - 1] ?? 0);
        const curVal = Number(spontEntry.system?.slots?.[`slot${r}`]?.value ?? sMax);
        const nextVal = refreshSlots ? sMax : Math.min(sMax, Math.max(0, curVal));
        slotUpdates[`system.slots.slot${r}.max`] = sMax;
        slotUpdates[`system.slots.slot${r}.value`] = nextVal;
        slotUpdates[`system.slots.slot${r}.prepared`] = [];
      }
      await spontEntry.update(slotUpdates);
    }

    const focusPoolUpgrade = limits.hasCircleOfSpirits
      ? Math.min(3, Math.max(1, activeApps.length))
      : Math.min(3, Math.max(1, primaryApps.length));

    const focusRules = [
      {
        key: "ActiveEffectLike",
        mode: "upgrade",
        path: "system.resources.focus.max",
        priority: 20,
        value: focusPoolUpgrade
      }
    ];

    if (!vesselEntry) {
      const createdFocus = await actor.createEmbeddedDocuments("Item", [
        {
          name: "Vessel Spells",
          type: "spellcastingEntry",
          img: "systems/pf2e/icons/default-icons/spellcastingEntry.svg",
          system: {
            ability: { value: "wis" },
            tradition: { value: "divine" },
            prepared: { value: "focus" },
            showSlotlessLevels: { value: true },
            proficiency: { value: 1, slug: "" },
            rules: focusRules
          },
          flags: {
            [MODULE_ID]: { generated: true, entryRole: "vessel" }
          }
        }
      ]);
      vesselEntry = createdFocus?.[0] ?? null;
    } else {
      await vesselEntry.update({
        [`flags.${MODULE_ID}.entryRole`]: "vessel",
        "system.rules": focusRules
      });
    }
  }

  // 3. Collect old generated/apparition spells belonging to spontEntry & vesselEntry (preserving any unrelated manual spells)
  const knownSpellUuids = getAllKnownApparitionSpellUuids();
  const oldSpellIds = [];
  const preservedManualSpellUuids = new Set();
  for (const sp of actor.itemTypes?.spell ?? []) {
    const loc = sp.system?.location?.value;
    if ((spontEntry && loc === spontEntry.id) || (vesselEntry && loc === vesselEntry.id)) {
      const srcUuid = sp.sourceId || sp._stats?.compendiumSource || "";
      const isManagedSpell =
        Boolean(sp.getFlag(MODULE_ID, "generated")) ||
        Boolean(sp.flags?.["pf2e-animist"]) ||
        Boolean(sp.flags?.["pf2e-dailies"]) ||
        Boolean(sp.flags?.pathmuncher) ||
        knownSpellUuids.has(srcUuid);

      if (isManagedSpell) {
        oldSpellIds.push(sp.id);
      } else if (srcUuid && spontEntry && loc === spontEntry.id) {
        preservedManualSpellUuids.add(srcUuid);
      }
    }
  }

  const allDeleteIds = [...new Set([...loreIdsToDelete, ...oldSpellIds])].filter((id) => actor.items.has(id));
  if (allDeleteIds.length > 0) {
    await actor.deleteEmbeddedDocuments("Item", allDeleteIds);
  }

  // 4. Build new Lore items + Spontaneous Spell items + Primary Vessel Spell items
  const itemsToCreate = [];

  for (const lore of desiredLores) {
    const fullName = /lore$/i.test(lore) ? lore : `${lore} Lore`;
    const stillExists = (actor.itemTypes?.lore ?? []).some(
      (l) => String(l.name || "").toLowerCase() === fullName.toLowerCase()
    );
    if (!stillExists) {
      itemsToCreate.push({
        name: fullName,
        type: "lore",
        img: "systems/pf2e/icons/default-icons/lore.svg",
        system: { proficient: { value: limits.loreRank } },
        flags: { [MODULE_ID]: { generated: true } }
      });
    }
  }

  const allSignature = game.settings?.get(MODULE_ID, "signatureSpells") !== false;

  if (limits.isFullAnimist && spontEntry) {
    const desiredSpells = new Map();
    for (const app of activeApps) {
      for (const sp of app.spells) {
        if (sp.rank <= limits.maxRank && !desiredSpells.has(sp.uuid)) {
          desiredSpells.set(sp.uuid, {
            uuid: sp.uuid,
            signature: sp.rank > 0 && allSignature
          });
        }
      }
    }

    // Bonus spells from Animist class features & feats
    if (limits.hasSupremeIncarnation && limits.maxRank >= 10) {
      desiredSpells.set(BONUS_APPARITION_SPELLS.avatar.uuid, {
        uuid: BONUS_APPARITION_SPELLS.avatar.uuid,
        signature: false
      });
    }
    if (actorHasFeat(actor, "embodiment-of-the-balance")) {
      desiredSpells.set(BONUS_APPARITION_SPELLS.heal.uuid, { uuid: BONUS_APPARITION_SPELLS.heal.uuid, signature: allSignature });
      desiredSpells.set(BONUS_APPARITION_SPELLS.harm.uuid, { uuid: BONUS_APPARITION_SPELLS.harm.uuid, signature: allSignature });
    }
    if (actorHasFeat(actor, "walk-the-wilds") && limits.maxRank >= 2) {
      desiredSpells.set(BONUS_APPARITION_SPELLS.animalForm.uuid, { uuid: BONUS_APPARITION_SPELLS.animalForm.uuid, signature: allSignature });
    }
    if (actorHasFeat(actor, "wind-seeker") && limits.maxRank >= 4) {
      desiredSpells.set(BONUS_APPARITION_SPELLS.aerialForm.uuid, { uuid: BONUS_APPARITION_SPELLS.aerialForm.uuid, signature: allSignature });
    }
    if (
      actorHasFeat(actor, "monstrous-inclinations") &&
      limits.maxRank >= 8 &&
      (seenLoreLower.has("forest") || seenLoreLower.has("ocean"))
    ) {
      desiredSpells.set(BONUS_APPARITION_SPELLS.monstrosityForm.uuid, {
        uuid: BONUS_APPARITION_SPELLS.monstrosityForm.uuid,
        signature: allSignature
      });
    }

    let cantripCount = 0;
    for (const { uuid, signature } of desiredSpells.values()) {
      if (preservedManualSpellUuids.has(uuid)) continue;
      const doc = await fromUuid(uuid).catch(() => null);
      if (!doc) continue;
      const obj = doc.toObject();
      delete obj._id;
      obj.system = obj.system || {};
      obj.system.location = obj.system.location || {};
      obj.system.location.value = spontEntry.id;
      const isCantrip = (obj.system?.traits?.value ?? []).includes("cantrip");
      if (isCantrip) {
        cantripCount += 1;
      } else if (signature) {
        obj.system.location.signature = true;
      }
      obj.flags = foundry.utils.mergeObject(obj.flags || {}, {
        [MODULE_ID]: { generated: true }
      });
      itemsToCreate.push(obj);
    }

    await spontEntry.update({
      "system.slots.slot0.max": cantripCount,
      "system.slots.slot0.value": cantripCount
    });
  }

  if (limits.isFullAnimist && vesselEntry) {
    const addedVessels = new Set();
    for (const app of primaryApps) {
      if (!app.vessel?.uuid || addedVessels.has(app.vessel.uuid)) continue;
      addedVessels.add(app.vessel.uuid);
      const vDoc = await fromUuid(app.vessel.uuid).catch(() => null);
      if (!vDoc) continue;
      const vObj = vDoc.toObject();
      delete vObj._id;
      vObj.system = vObj.system || {};
      vObj.system.location = vObj.system.location || {};
      vObj.system.location.value = vesselEntry.id;
      vObj.flags = foundry.utils.mergeObject(vObj.flags || {}, {
        [MODULE_ID]: { generated: true, isPrimaryVessel: true, apparitionSlug: app.slug }
      });
      itemsToCreate.push(vObj);
    }
  }

  if (itemsToCreate.length > 0) {
    await actor.createEmbeddedDocuments("Item", itemsToCreate);
  }

  // Ensure Focus Points value is initialized / refreshed when resting or if 0 on brand-new import
  if (limits.isFullAnimist) {
    const desiredFocusMax = limits.hasCircleOfSpirits
      ? Math.min(3, Math.max(1, activeApps.length))
      : Math.min(3, Math.max(1, primaryApps.length));
    const curFocusVal = actor.system?.resources?.focus?.value;
    if (refreshSlots || (!state.syncedOnce && (!curFocusVal || curFocusVal < 1))) {
      await actor.update({
        "system.resources.focus.value": desiredFocusMax,
        "system.resources.focus.max": Math.max(Number(actor.system?.resources?.focus?.max || 0), desiredFocusMax)
      });
    }
  }

  await mutateActorSpiritState(actor, (s) => {
    s.syncedOnce = true;
    return s;
  });

  if (!silent) {
    ui.notifications?.info(
      `${actor.name}: Synchronized ${activeApps.length} Apparition(s), Lores, Spontaneous Repertoire, and Primary Vessel Spell(s).`
    );
  }
  return true;
}

/**
 * Toggle an apparition in/out of daily attunement slots.
 */
export async function toggleAttunedApparition(actor, slug) {
  if (!actor || !getApparitionBySlug(slug)) return null;
  const limits = getAnimistLimits(actor);

  let updated = null;
  await mutateActorSpiritState(actor, (state) => {
    const idx = state.attuned.indexOf(slug);
    if (idx >= 0) {
      if (state.crafterVowLocked && slug === "crafter-in-the-vault") {
        ui.notifications?.warn(
          "Crafter in the Vault's Vow is active (8h Traveling Workshop item unused): must keep Crafter attuned!"
        );
        return state;
      }
      if (state.relinquishLockedSpirit === slug) {
        ui.notifications?.warn(
          "Relinquish Control bond requires attuning to this bonded apparition every day (clear bond first if retraining)."
        );
        return state;
      }
      state.attuned.splice(idx, 1);
      state.primary = state.primary.filter((s) => s !== slug);
      state.dispersed = state.dispersed.filter((s) => s !== slug);
      if (state.familiarSpirit === slug) {
        state.familiarSpirit = state.attuned[0] ?? null;
      }
      if (state.primary.length === 0 && state.attuned.length > 0) {
        state.primary = [state.attuned[0]];
      }
    } else {
      if (state.attuned.length >= limits.maxAttuned) {
        ui.notifications?.warn(
          `${actor.name} can attune to at most ${limits.maxAttuned} apparition(s) at Level ${limits.level}. Unselect one first.`
        );
        return state;
      }
      state.attuned.push(slug);
      if (state.primary.length < limits.maxPrimary) {
        state.primary.push(slug);
      }
      if (!state.familiarSpirit && limits.hasSpiritFamiliar) {
        state.familiarSpirit = slug;
      }
    }
    updated = state;
    return state;
  });

  if (updated) {
    await syncActorSheetWithState(actor, { silent: true, stateOverride: updated });
  }
  return updated;
}

export async function applyStarterAttunement(actor) {
  if (!actor) return null;
  const limits = getAnimistLimits(actor);
  const defaults = [
    "steward-of-stone-and-fire",
    "custodian-of-groves-and-gardens",
    "witness-to-ancient-battles",
    "monarch-of-the-fey-courts"
  ].slice(0, limits.maxAttuned);

  const next = await mutateActorSpiritState(actor, (state) => {
    state.attuned = defaults;
    state.dispersed = [];
    state.primary = defaults.slice(0, limits.maxPrimary);
    if (limits.hasSpiritFamiliar) state.familiarSpirit = defaults[0];
    return state;
  });
  if (next) await syncActorSheetWithState(actor, { refreshSlots: true, stateOverride: next });
  return next;
}

/**
 * Switch Primary Apparition (via 1A Circle of Spirits, 10-min Refocus, or Instant Setup).
 */
export async function switchPrimaryApparition(actor, slug, mode = "circle") {
  if (!actor) return null;
  const app = getApparitionBySlug(slug);
  if (!app) return null;
  const limits = getAnimistLimits(actor);
  const current = getActorSpiritState(actor);

  if (!current.attuned.includes(slug)) {
    ui.notifications?.warn(`${app.name} is not among ${actor.name}'s attuned apparitions today.`);
    return null;
  }
  if (current.dispersed.includes(slug)) {
    ui.notifications?.warn(`${app.name} is currently dispersed until your next daily preparations.`);
    return null;
  }

  if (mode === "circle") {
    if (!limits.hasCircleOfSpirits) {
      ui.notifications?.warn(
        `${actor.name} does not have Circle of Spirits (use 10-Min Refocus & Re-Attune in exploration mode).`
      );
      return null;
    }
    if (game.combat?.started && current.circleUsedThisTurn) {
      ui.notifications?.warn("Circle of Spirits has Frequency: once per round.");
      return null;
    }
  }

  let oldPrimaries = [];
  const next = await mutateActorSpiritState(actor, (state) => {
    oldPrimaries = [...state.primary];
    if (limits.maxPrimary <= 1) {
      state.primary = [slug];
    } else if (!state.primary.includes(slug)) {
      state.primary = [slug, state.primary[0]].filter(Boolean).slice(0, 2);
    }

    if (mode === "circle" && game.combat?.started) {
      state.circleUsedThisTurn = true;
    }
    if (mode === "refocus") {
      state.cooldowns10Min = clearObjectFlags(state.cooldowns10Min);
      state.circleUsedThisTurn = false;
    }

    // End any sustained vessel spells belonging to apparitions no longer primary
    state.activeVessels = state.activeVessels.filter((v) => state.primary.includes(v.apparitionSlug));
    return state;
  });

  if (!next) return null;

  // Clean up expired non-primary vessel effects if needed
  for (const prevSlug of oldPrimaries) {
    if (!next.primary.includes(prevSlug)) {
      await removeVesselEffectsForSlug(actor, prevSlug);
    }
  }

  if (mode === "refocus") {
    const curFocus = Number(actor.system?.resources?.focus?.value ?? 0);
    const maxFocus = Math.max(1, Number(actor.system?.resources?.focus?.max ?? 1));
    if (curFocus < maxFocus) {
      await actor.update({ "system.resources.focus.value": Math.min(maxFocus, curFocus + 1) });
    }
  }

  await syncActorSheetWithState(actor, { silent: true, stateOverride: next });

  if (mode === "circle" || mode === "refocus") {
    const actionBadge =
      mode === "circle"
        ? limits.practice?.slug === "liturgist" && limits.level >= 17 && !game.combat?.started
          ? "Free (Invocation of Praise)"
          : "1 Action · Circle of Spirits"
        : "10 Min · Refocus & Re-Attune (+1 Focus)";

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="acd-chat-card" style="border-left-color:${escapeHtml(app.color)}">
          <div class="acd-chat-header">
            <strong><i class="${escapeHtml(app.icon)}"></i> ${escapeHtml(app.name)}</strong>
            <span class="acd-chat-tag">${escapeHtml(actionBadge)}</span>
          </div>
          <p class="acd-chat-desc">
            <strong>${escapeHtml(actor.name)}</strong> channels <strong>${escapeHtml(app.name)}</strong> as Primary Apparition!
            Active Vessel Spell: <strong>${escapeHtml(app.vessel.name)}</strong>.
          </p>
        </div>
      `
    });
  }

  return next;
}

/**
 * Disperse an attuned apparition (e.g., Apparition's Quickening, Fly on Shadowed Wings, Spirit's Sacrifice, or slain Spirit Familiar).
 */
export async function disperseApparition(actor, slug, reason = "Apparition Power") {
  if (!actor) return null;
  const app = getApparitionBySlug(slug);
  if (!app) return null;
  const current = getActorSpiritState(actor);
  const remaining = current.attuned.filter((s) => s !== slug && !current.dispersed.includes(s));

  if (reason === "Apparition's Quickening" && remaining.length === 0) {
    ui.notifications?.warn("Apparition's Quickening cannot disperse your last remaining attuned apparition!");
    return null;
  }

  const next = await mutateActorSpiritState(actor, (state) => {
    if (!state.dispersed.includes(slug)) state.dispersed.push(slug);
    state.primary = state.primary.filter((s) => s !== slug);
    const activeLeft = state.attuned.filter((s) => !state.dispersed.includes(s));
    const limits = getAnimistLimits(actor);
    while (state.primary.length < limits.maxPrimary && state.primary.length < activeLeft.length) {
      const replacement = activeLeft.find((s) => !state.primary.includes(s));
      if (!replacement) break;
      state.primary.push(replacement);
    }
    state.activeVessels = state.activeVessels.filter((v) => v.apparitionSlug !== slug);
    return state;
  });

  await removeVesselEffectsForSlug(actor, slug);
  await syncActorSheetWithState(actor, { silent: true, stateOverride: next });

  // Apply special boon for Spirit's Sacrifice or Fly on Shadowed Wings
  let extraNote = "";
  if (reason === "Spirit's Sacrifice") {
    const healAmt = Math.max(2, getAnimistLimits(actor).level * 2);
    await performTargetActorOp(actor, "applyHealing", { amount: healAmt });
    const wounded = actor.itemTypes?.condition?.find((c) => c.slug === "wounded");
    const wVal = Number(wounded?.value ?? wounded?.system?.value?.value ?? 0);
    if (wounded && wVal > 1 && typeof actor.decreaseCondition === "function") {
      for (let i = wVal; i > 1; i--) await actor.decreaseCondition("wounded");
    }
    extraNote = `<p class="acd-chat-note"><strong>Spirit's Sacrifice:</strong> Prevented death, healed <strong>${healAmt} HP</strong>, and reduced Wounded to 1!</p>`;
  } else if (reason === "Fly on Shadowed Wings") {
    const level = getAnimistLimits(actor).level;
    const wingsEff = buildCustomEffectData({
      name: "Fly on Shadowed Wings (10 min)",
      icon: "icons/creatures/birds/corvid-flying-wings-purple.webp",
      description: `<p>Granted by dispersing <strong>${escapeHtml(app.name)}</strong>: gain a fly Speed equal to your land Speed and resistance ${level} to precision damage for 10 minutes.</p>`,
      level,
      durationRounds: 100,
      rules: [
        { key: "BaseSpeed", selector: "fly", value: "@actor.attributes.speed.total" },
        { key: "Resistance", type: "precision", value: level }
      ],
      flags: { [MODULE_ID]: { shadowedWingsSlug: slug } }
    });
    await actor.createEmbeddedDocuments("Item", [wingsEff]);
    extraNote = `<p class="acd-chat-note"><strong>Shadowed Wings:</strong> Gained Fly Speed & Precision Resistance ${level} for 10 minutes!</p>`;
  } else if (reason === "Apparition's Quickening") {
    extraNote = `<p class="acd-chat-note"><strong>Apparition's Quickening:</strong> Next cantrip or spell (>=2 ranks below max) costs 1 fewer action (min 1A)!</p>`;
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="acd-chat-card" style="border-left-color:#64748b">
        <div class="acd-chat-header">
          <strong><i class="fa-solid fa-wind"></i> Apparition Dispersed: ${escapeHtml(app.name)}</strong>
          <span class="acd-chat-tag">${escapeHtml(reason)}</span>
        </div>
        <p class="acd-chat-desc">
          <strong>${escapeHtml(app.name)}</strong> disperses into spirit mist.
          ${next?.primary?.[0] ? `New Primary Apparition: <strong>${escapeHtml(getApparitionBySlug(next.primary[0])?.name || "")}</strong>.` : "No attuned apparitions remain active."}
        </p>
        ${extraNote}
      </div>
    `
  });

  return next;
}

export async function restoreDispersedApparition(actor, slug) {
  if (!actor) return null;
  const next = await mutateActorSpiritState(actor, (state) => {
    state.dispersed = state.dispersed.filter((s) => s !== slug);
    if (state.primary.length === 0 && state.attuned.includes(slug)) {
      state.primary = [slug];
    }
    return state;
  });
  await syncActorSheetWithState(actor, { silent: true, stateOverride: next });
  return next;
}

/**
 * Swap a Wandering Feat on the character sheet during Daily Preparations.
 */
export async function swapWanderingFeat(actor, oldFeatItemId, newWanderingSlug) {
  if (!actor || !actor.isOwner) return false;
  const targetMeta = WANDERING_FEATS_DB.find((f) => f.slug === newWanderingSlug);
  if (!targetMeta) return false;

  const limits = getAnimistLimits(actor);
  if (limits.level < targetMeta.level) {
    ui.notifications?.warn(`${targetMeta.name} requires Animist Level ${targetMeta.level}.`);
    return false;
  }
  if (targetMeta.requiresFamiliar && !limits.hasSpiritFamiliar) {
    ui.notifications?.warn(`${targetMeta.name} requires a Spirit Familiar.`);
    return false;
  }
  if (targetMeta.loresRequired.length > 0) {
    const state = getActorSpiritState(actor);
    const activeLoreLower = new Set();
    for (const s of state.attuned) {
      if (state.dispersed.includes(s)) continue;
      for (const l of getApparitionBySlug(s)?.lores ?? []) activeLoreLower.add(l.toLowerCase());
    }
    if (!targetMeta.loresRequired.some((l) => activeLoreLower.has(l.toLowerCase()))) {
      ui.notifications?.warn(`${targetMeta.name} requires an attuned apparition granting ${targetMeta.loresRequired.join(" or ")} Lore.`);
      return false;
    }
  }

  const newDoc = await fromUuid(targetMeta.uuid).catch(() => null);
  if (!newDoc) {
    ui.notifications?.error(`Could not load ${targetMeta.name} from PF2e feats compendium.`);
    return false;
  }

  const newObj = newDoc.toObject();
  delete newObj._id;

  if (oldFeatItemId && actor.items.has(oldFeatItemId)) {
    const oldItem = actor.items.get(oldFeatItemId);
    if (oldItem?.system?.location) {
      newObj.system.location = oldItem.system.location;
    }
    await actor.deleteEmbeddedDocuments("Item", [oldFeatItemId]);
  }

  await actor.createEmbeddedDocuments("Item", [newObj]);
  await syncActorSheetWithState(actor, { silent: true });
  ui.notifications?.info(`${actor.name}: Attuned Wandering Feat -> ${targetMeta.name}`);
  return true;
}

function buildCustomEffectData({ name, icon, description, level = 1, durationRounds = 10, expiry = "turn-end", rules = [], flags = {} }) {
  return {
    name,
    type: "effect",
    img: icon || "icons/magic/spirit/ankh-gold-blue.webp",
    system: {
      description: { value: description || "" },
      level: { value: level },
      duration: {
        value: durationRounds,
        unit: "rounds",
        sustained: durationRounds >= 10,
        expiry
      },
      tokenIcon: { show: true },
      rules
    },
    flags: foundry.utils.mergeObject({ [MODULE_ID]: { generatedEffect: true } }, flags)
  };
}

async function removeVesselEffectsForSlug(actor, apparitionSlug) {
  if (!actor?.items) return;
  const app = getApparitionBySlug(apparitionSlug);
  const toDelete = [];
  for (const item of actor.items) {
    if (item.type !== "effect") continue;
    if (item.getFlag(MODULE_ID, "vesselApparitionSlug") === apparitionSlug) {
      toDelete.push(item.id);
    } else if (app?.vessel?.effectUuid && (item.sourceId === app.vessel.effectUuid || item._stats?.compendiumSource === app.vessel.effectUuid)) {
      toDelete.push(item.id);
    }
  }
  if (toDelete.length > 0) {
    await actor.deleteEmbeddedDocuments("Item", toDelete);
  }
}

function hasChannelersStanceActive(actor) {
  if (!actor?.items) return false;
  return actor.items.some(
    (i) =>
      i.type === "effect" &&
      (i.slug === "effect-channelers-stance" ||
        i.sourceId === "Compendium.pf2e.feat-effects.Item.BZPPcHtYugsNKz4Z" ||
        i.getFlag(MODULE_ID, "featActionSlug") === "channelers-stance")
  );
}

function collectCanvasTargetTokens(actor, rangeFeet = 30, alliesOnly = false) {
  const cvs = globalThis.canvas;
  const sourceTok = cvs?.ready ? getActorTokenOnCanvas(actor) : null;
  const filterToken = (tok) => {
    if (!tok?.actor) return false;
    if (sourceTok && rangeFeet > 0) {
      const dist = measureDistanceFeet(sourceTok, tok);
      if (dist !== null && dist > rangeFeet) return false;
    }
    const isFriendly = tok.document?.disposition === CONST.TOKEN_DISPOSITIONS?.FRIENDLY || tok.actor?.hasPlayerOwner;
    if (alliesOnly) return Boolean(isFriendly);
    return !isFriendly && (!sourceTok || tok.id !== sourceTok.id);
  };

  const explicitTargets = Array.from(game.user?.targets ?? []).filter(filterToken);
  if (explicitTargets.length > 0) {
    return explicitTargets;
  }
  if (!cvs?.ready || !sourceTok) return [];
  return (cvs.tokens?.placeables ?? []).filter(filterToken);
}

/**
 * Cast a Primary Apparition's Vessel Focus Spell (spends 1 Focus Point, applies Vessel Effect, triggers Cast Pulse).
 */
export async function castVesselSpell(actor, apparitionSlug, options = {}) {
  if (!actor) return null;
  const app = getApparitionBySlug(apparitionSlug);
  if (!app) return null;

  const state = getActorSpiritState(actor);
  if (!state.primary.includes(apparitionSlug)) {
    ui.notifications?.warn(`${app.vessel.name} requires ${app.name} to be your Primary Apparition!`);
    return null;
  }

  const curFocus = Number(actor.system?.resources?.focus?.value ?? 0);
  if (!options.freeFocus && curFocus < 1) {
    ui.notifications?.warn(`${actor.name} has 0 Focus Points remaining! Use 10-Min Refocus first.`);
    return null;
  }

  if (!options.freeFocus) {
    await actor.update({ "system.resources.focus.value": Math.max(0, curFocus - 1) });
  }

  // Remove any prior instance of the same vessel spell
  await removeVesselEffectsForSlug(actor, apparitionSlug);

  const stats = getAnimistSpellStats(actor);
  const rank = stats.rank;
  const activeId = foundry.utils.randomID();
  const isExplorationWorkshop = apparitionSlug === "crafter-in-the-vault" && Boolean(options.exploration8h);

  // Build / Apply Vessel Effect item on the Animist
  let effectItemData = null;
  if (app.vessel.effectUuid) {
    const effDoc = await fromUuid(app.vessel.effectUuid).catch(() => null);
    if (effDoc) {
      effectItemData = effDoc.toObject();
      delete effectItemData._id;
      effectItemData.system = effectItemData.system || {};
      effectItemData.system.level = { value: rank * 2 - 1 };
      effectItemData.flags = foundry.utils.mergeObject(effectItemData.flags || {}, {
        [MODULE_ID]: { vesselApparitionSlug: apparitionSlug, activeVesselId: activeId }
      });
    }
  }

  // Custom self-contained Rule Elements for Wish Market (or fallback if effectUuid is absent)
  let wishPrice = null;
  const wishBonusSkill = options.wishSkill || state.wishSkill || "religion";
  if (apparitionSlug === "lamentation-of-sinister-deals") {
    const roll1d4 = await new Roll("1d4").evaluate();
    const idx = Math.max(1, Math.min(4, Number(roll1d4.total) || 1));
    wishPrice = WISH_MARKET_PRICES[idx - 1];
    const bonusVal = rank >= 7 ? 3 : rank >= 4 ? 2 : 1;
    effectItemData = buildCustomEffectData({
      name: `Vessel: Wish Market (+${bonusVal} / ${wishPrice.name})`,
      icon: app.vessel.img || "icons/sundries/documents/document-sealed-red-tan.webp",
      description: `<p><strong>Wish Market:</strong> +${bonusVal} status bonus to Perception & ${escapeHtml(wishBonusSkill)}; Merchant Price (<strong>${escapeHtml(wishPrice.name)}</strong>): -2 status penalty to ${wishPrice.skills.join(" & ")}.</p>`,
      level: rank * 2 - 1,
      durationRounds: 10,
      rules: [
        { key: "FlatModifier", selector: ["perception", wishBonusSkill], value: bonusVal, type: "status", label: "Wish Market Boon" },
        {
          key: "FlatModifier",
          selector: wishPrice.skills,
          value: -2,
          type: "status",
          label: `Wish Market Price (${wishPrice.name})`,
          predicate: [{ not: "wish-market:penalty-suppressed" }]
        }
      ],
      flags: { [MODULE_ID]: { vesselApparitionSlug: apparitionSlug, activeVesselId: activeId } }
    });
  } else if (!effectItemData && apparitionSlug === "witness-to-ancient-battles") {
    const atkBonus = rank >= 7 ? 3 : rank >= 4 ? 2 : 1;
    effectItemData = buildCustomEffectData({
      name: `Vessel: Embodiment of Battle (+${atkBonus})`,
      icon: "icons/skills/melee/weapons-crossed-swords-yellow.webp",
      description: `<p>+${atkBonus} status to weapon/unarmed attack & damage; -2 status to spell attack & DC; Reactive Strike.</p>`,
      level: rank * 2 - 1,
      durationRounds: 10,
      rules: [
        { key: "FlatModifier", selector: ["attack-roll"], value: atkBonus, type: "status", predicate: ["item:type:weapon"], label: "Embodiment of Battle" },
        { key: "FlatModifier", selector: ["damage"], value: atkBonus, type: "status", label: "Embodiment of Battle" },
        { key: "FlatModifier", selector: ["spell-attack", "spell-dc"], value: -2, type: "status", label: "Embodiment of Battle" }
      ],
      flags: { [MODULE_ID]: { vesselApparitionSlug: apparitionSlug, activeVesselId: activeId } }
    });
  } else if (!effectItemData && apparitionSlug === "vanguard-of-roaring-waters") {
    effectItemData = buildCustomEffectData({
      name: "Vessel: River Carving Mountains (+10 ft Speed)",
      icon: "icons/magic/water/wave-water-blue.webp",
      description: "<p>+10-foot status bonus to all Speeds and lesser cover against ranged attacks.</p>",
      level: rank * 2 - 1,
      durationRounds: 10,
      rules: [{ key: "FlatModifier", selector: "all-speeds", value: 10, type: "status", label: "River Carving Mountains" }],
      flags: { [MODULE_ID]: { vesselApparitionSlug: apparitionSlug, activeVesselId: activeId } }
    });
  } else if (!effectItemData) {
    const vesselSpellDoc = await fromUuid(app.vessel.uuid).catch(() => null);
    effectItemData = buildCustomEffectData({
      name: `Vessel: ${app.vessel.name}`,
      icon: vesselSpellDoc?.img || "icons/magic/spirit/ankh-gold-blue.webp",
      description: `<p>${escapeHtml(app.vessel.summary)}</p>`,
      level: rank * 2 - 1,
      durationRounds: isExplorationWorkshop ? 4800 : 10,
      rules: [],
      flags: { [MODULE_ID]: { vesselApparitionSlug: apparitionSlug, activeVesselId: activeId } }
    });
  }

  let createdEffectId = null;
  if (effectItemData) {
    const created = await actor.createEmbeddedDocuments("Item", [effectItemData]);
    createdEffectId = created?.[0]?.id ?? null;
  }

  const entryRecord = {
    id: activeId,
    apparitionSlug,
    vesselName: app.vessel.name,
    rank,
    roundsSustained: 1,
    sustainedThisTurn: true,
    mirrors: apparitionSlug === "reveler-in-lost-glee" ? 1 : 0,
    bonusReactionReady: apparitionSlug === "echo-of-lost-moments",
    wishPriceRoll: wishPrice?.roll ?? null,
    wishBonusSkill,
    wishPenaltySuppressed: false,
    exploration8h: isExplorationWorkshop,
    effectId: createdEffectId
  };

  await mutateActorSpiritState(actor, (s) => {
    s.activeVessels = s.activeVessels.filter((v) => v.apparitionSlug !== apparitionSlug);
    s.activeVessels.push(entryRecord);
    if (isExplorationWorkshop) s.crafterVowLocked = true;
    return s;
  });

  await postVesselPulseChatCard(actor, app, entryRecord, "Cast", options);
  return entryRecord;
}

/**
 * Sustain an active Vessel Spell (`1A` Standard Sustain, or `Free` Dancing Invocation for Lv 9+ Liturgist).
 */
export async function sustainVesselSpell(actor, activeVesselId, options = {}) {
  if (!actor) return null;
  const state = getActorSpiritState(actor);
  const target = state.activeVessels.find((v) => v.id === activeVesselId) ?? state.activeVessels[0];
  if (!target) {
    ui.notifications?.warn("No active Vessel Spell to Sustain.");
    return null;
  }

  const app = getApparitionBySlug(target.apparitionSlug);
  if (!app) return null;

  if (!target.exploration8h && target.roundsSustained >= 10 && !(target.apparitionSlug === "stalker-in-darkened-boughs" && actorHasFeat(actor, "walk-the-wilds"))) {
    await dismissVesselSpell(actor, target.id);
    ui.notifications?.info(`${target.vesselName} reached its maximum 1-minute (10-round) sustained duration.`);
    return null;
  }

  let updatedEntry = null;
  await mutateActorSpiritState(actor, (s) => {
    const v = s.activeVessels.find((x) => x.id === target.id);
    if (!v) return s;
    v.roundsSustained = Number(v.roundsSustained || 1) + 1;
    v.sustainedThisTurn = true;
    if (v.apparitionSlug === "reveler-in-lost-glee") {
      v.mirrors = Math.min(3, Number(v.mirrors || 0) + 1);
    }
    if (v.apparitionSlug === "echo-of-lost-moments") {
      v.bonusReactionReady = true;
    }
    if (v.apparitionSlug === "lamentation-of-sinister-deals") {
      v.wishPenaltySuppressed = options.wishChoice === "haggle";
    }
    updatedEntry = { ...v };
    return s;
  });

  if (target.apparitionSlug === "lamentation-of-sinister-deals") {
    await actor.toggleRollOption?.("all", "wish-market:penalty-suppressed", null, true, options.wishChoice === "haggle").catch(() => null);
  }

  if (updatedEntry) {
    const modeLabel = options.dancing ? "Dancing Invocation (Free w/ Leap/Step/Tumble)" : "Sustain (1A)";
    await postVesselPulseChatCard(actor, app, updatedEntry, modeLabel, options);
  }
  return updatedEntry;
}

export async function dismissVesselSpell(actor, activeVesselId) {
  if (!actor) return null;
  const state = getActorSpiritState(actor);
  const target = activeVesselId
    ? state.activeVessels.find((v) => v.id === activeVesselId)
    : state.activeVessels[0];
  if (!target) return null;

  await removeVesselEffectsForSlug(actor, target.apparitionSlug);
  await mutateActorSpiritState(actor, (s) => {
    s.activeVessels = s.activeVessels.filter((v) => v.id !== target.id);
    return s;
  });

  if (target.apparitionSlug === "custodian-of-groves-and-gardens") {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="acd-chat-card" style="border-left-color:#22c55e">
          <div class="acd-chat-header">
            <strong><i class="fa-solid fa-seedling"></i> Garden of Healing Lingers</strong>
            <span class="acd-chat-tag">10 Min Calm</span>
          </div>
          <p class="acd-chat-desc">Creatures healed by <strong>Garden of Healing</strong> gain a +1 circumstance bonus to saves vs emotion effects for 10 minutes.</p>
          <div class="acd-chat-actions">
            <button type="button" class="acd-chat-btn" data-acd-chat="apply-garden-calm" data-actor-id="${escapeHtml(actor.id)}">
              <i class="fa-solid fa-shield-heart"></i> Apply Lingering Calm (10-ft Allies)
            </button>
          </div>
        </div>
      `
    });
  }
  return true;
}

/**
 * Post rich interactive Cast / Sustain chat cards for all 14 Vessel Spells!
 */
async function postVesselPulseChatCard(actor, app, vesselEntry, phaseLabel, options = {}) {
  const stats = getAnimistSpellStats(actor);
  const rank = vesselEntry.rank || stats.rank;
  const dc = stats.dc;
  const inChanneler = hasChannelersStanceActive(actor);
  const channelerBonus = inChanneler ? rank : 0;

  let bodyHtml = `<p class="acd-chat-desc">${escapeHtml(app.vessel.summary)}</p>`;
  let targetsHtml = "";
  let buttonsHtml = "";

  if (app.slug === "steward-of-stone-and-fire") {
    // Earth's Bile: ceil(rank/2)d4 fire + ceil(rank/2)d4 bludgeoning + ceil(rank/2) persistent fire (basic Reflex)
    const diceCount = Math.max(1, Math.ceil(rank / 2));
    const bonusStr = channelerBonus > 0 ? ` + ${channelerBonus}` : "";
    const fireRoll = await new Roll(`${diceCount}d4${bonusStr}`).evaluate();
    const bludgRoll = await new Roll(`${diceCount}d4`).evaluate();
    const totalDmg = Number(fireRoll.total || 0) + Number(bludgRoll.total || 0);
    const persistFire = diceCount;

    const enemies = collectCanvasTargetTokens(actor, 40, false);
    const rows = enemies
      .map(
        (t) => `
        <div class="acd-target-row">
          <span class="acd-target-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
          <div class="acd-target-btns">
            <button type="button" class="acd-chat-mini-btn" data-acd-chat="roll-save" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-save="reflex" data-dc="${dc}">Reflex DC ${dc}</button>
            <button type="button" class="acd-chat-mini-btn acd-btn-dmg" data-acd-chat="apply-dmg" data-sender-actor-id="${escapeHtml(actor.id)}" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-amount="${totalDmg}" data-dmg-type="fire" data-persist="${persistFire}">Fail (${totalDmg}+${persistFire}p)</button>
            <button type="button" class="acd-chat-mini-btn" data-acd-chat="apply-dmg" data-sender-actor-id="${escapeHtml(actor.id)}" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-amount="${Math.floor(totalDmg / 2)}" data-dmg-type="fire">Half (${Math.floor(totalDmg / 2)})</button>
            <button type="button" class="acd-chat-mini-btn acd-btn-crit" data-acd-chat="apply-dmg" data-sender-actor-id="${escapeHtml(actor.id)}" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-amount="${totalDmg * 2}" data-dmg-type="fire" data-persist="${persistFire * 2}">Crit (${totalDmg * 2})</button>
          </div>
        </div>`
      )
      .join("");

    bodyHtml = `
      <div class="acd-roll-banner">
        <span><strong>Molten Burst (10-ft within 30 ft):</strong> ${fireRoll.total} fire + ${bludgRoll.total} bludgeoning = <strong>${totalDmg}</strong> dmg + <strong>${persistFire} persistent fire</strong> (Basic Reflex DC ${dc})</span>
        ${inChanneler ? `<span class="acd-stance-pill">+${channelerBonus} Channeler's Stance</span>` : ""}
      </div>
      ${rows ? `<div class="acd-target-list">${rows}</div>` : `<p class="acd-chat-hint">Tip: Target enemy tokens (T) before clicking Cast/Sustain for 1-click Save & Damage rows.</p>`}
    `;
  } else if (app.slug === "custodian-of-groves-and-gardens") {
    // Garden of Healing: (rank)d4 HP in 10-ft emanation (+rank on initial Cast if in Channeler's Stance)
    const castBonus = inChanneler && phaseLabel === "Cast" ? rank : 0;
    const healRoll = await new Roll(`${rank}d4${castBonus > 0 ? ` + ${castBonus}` : ""}`).evaluate();
    const healAmt = Number(healRoll.total || 1);
    const allies = collectCanvasTargetTokens(actor, 10, true);
    const sourceTok = getActorTokenOnCanvas(actor);
    if (sourceTok && !allies.some((t) => t.id === sourceTok.id)) allies.unshift(sourceTok);

    const rows = allies
      .map(
        (t) => `
        <div class="acd-target-row">
          <span class="acd-target-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
          <div class="acd-target-btns">
            <button type="button" class="acd-chat-mini-btn acd-btn-heal" data-acd-chat="apply-heal" data-sender-actor-id="${escapeHtml(actor.id)}" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-amount="${healAmt}">Heal +${healAmt} HP</button>
          </div>
        </div>`
      )
      .join("");

    bodyHtml = `
      <div class="acd-roll-banner acd-banner-heal">
        <span><strong>Renewing Pulse (10-ft Emanation):</strong> Restores <strong>${healAmt} HP</strong> (${rank}d4${castBonus ? `+${castBonus}` : ""})!</span>
      </div>
      ${rows ? `<div class="acd-target-list">${rows}</div>` : ""}
    `;
    if (allies.length > 1) {
      buttonsHtml = `
        <button type="button" class="acd-chat-btn acd-btn-heal" data-acd-chat="heal-all-emanation" data-sender-actor-id="${escapeHtml(actor.id)}" data-amount="${healAmt}">
          <i class="fa-solid fa-heart-pulse"></i> Heal All Allies in 10 ft (+${healAmt} HP)
        </button>`;
    }
  } else if (app.slug === "reveler-in-lost-glee") {
    const mirrors = vesselEntry.mirrors || 1;
    const hitChanceLabel = mirrors === 1 ? "50% (1-3 on 1d6 hits mirror)" : mirrors === 2 ? "67% (3-6 on 1d6 hits mirror)" : "75% (2-4 on 1d4 hits mirror)";
    bodyHtml = `
      <div class="acd-roll-banner">
        <span><strong>Active Twisted Mirrors:</strong> <strong>${mirrors} / 3</strong> (${hitChanceLabel})</span>
      </div>
      <p class="acd-chat-desc">Shattered mirror deals <strong>${rank}d4${channelerBonus ? `+${channelerBonus}` : ""} mental</strong> damage (basic Will DC ${dc}) to an attacker within 5 ft.</p>
    `;
    buttonsHtml = `
      <div class="acd-chat-actions">
        <button type="button" class="acd-chat-btn" data-acd-chat="roll-mirror-check" data-actor-id="${escapeHtml(actor.id)}">
          <i class="fa-solid fa-clone"></i> Roll Mirror Intercept (${mirrors})
        </button>
        <button type="button" class="acd-chat-btn acd-btn-dmg" data-acd-chat="shatter-mirror" data-actor-id="${escapeHtml(actor.id)}" data-rank="${rank}" data-dc="${dc}">
          <i class="fa-solid fa-burst"></i> Shatter Mirror (${rank}d4 Mental)
        </button>
      </div>
    `;
  } else if (app.slug === "impostor-in-hidden-places") {
    const voidDice = Math.max(1, Math.ceil(rank / 2));
    const backlashRoll = await new Roll(`${voidDice}d6${channelerBonus ? ` + ${channelerBonus}` : ""}`).evaluate();
    const enemies = collectCanvasTargetTokens(actor, 5, false);
    targetsHtml = enemies
      .map(
        (t) => `
        <div class="acd-target-row">
          <span class="acd-target-name">${escapeHtml(t.name)}</span>
          <div class="acd-target-btns">
            <button type="button" class="acd-chat-mini-btn" data-acd-chat="roll-save" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-save="will" data-dc="${dc}">Will DC ${dc}</button>
            <button type="button" class="acd-chat-mini-btn acd-btn-dmg" data-acd-chat="apply-dmg" data-sender-actor-id="${escapeHtml(actor.id)}" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-amount="${backlashRoll.total}" data-dmg-type="void">Void Backlash (${backlashRoll.total})</button>
          </div>
        </div>`
      )
      .join("");
    bodyHtml += `<div class="acd-roll-banner"><span><strong>5-ft Misfortune Aura:</strong> Will DC ${dc} at turn start; failed cursed attack deals <strong>${backlashRoll.total} void</strong> (${voidDice}d6).</span></div>${targetsHtml ? `<div class="acd-target-list">${targetsHtml}</div>` : ""}`;
  } else if (app.slug === "monarch-of-the-fey-courts") {
    const enemies = collectCanvasTargetTokens(actor, 10, false);
    targetsHtml = enemies
      .map(
        (t) => `
        <div class="acd-target-row">
          <span class="acd-target-name">${escapeHtml(t.name)}</span>
          <div class="acd-target-btns">
            <button type="button" class="acd-chat-mini-btn" data-acd-chat="roll-save" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-save="will" data-dc="${dc}">Will DC ${dc}</button>
            <button type="button" class="acd-chat-mini-btn acd-btn-crit" data-acd-chat="apply-cond" data-sender-actor-id="${escapeHtml(actor.id)}" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-cond="confused">Apply Confused</button>
          </div>
        </div>`
      )
      .join("");
    bodyHtml += `<div class="acd-roll-banner"><span><strong>10-ft Bewildering Beauty Aura:</strong> Will DC ${dc} or Confused for 1 round!</span></div>${targetsHtml ? `<div class="acd-target-list">${targetsHtml}</div>` : ""}`;
  } else if (app.slug === "shepherd-of-errant-winds") {
    buttonsHtml = `
      <div class="acd-chat-actions">
        <button type="button" class="acd-chat-btn" data-acd-chat="anemos-shove" data-actor-id="${escapeHtml(actor.id)}">
          <i class="fa-solid fa-wind"></i> Roll Wind Shove (+${stats.attackMod} Spell Attack)
        </button>
      </div>
    `;
  } else if (app.slug === "speaker-in-sibilance") {
    const poisonDice = rank + 1;
    const poisonRoll = await new Roll(`${poisonDice}d4${channelerBonus ? ` + ${channelerBonus}` : ""}`).evaluate();
    bodyHtml += `
      <div class="acd-roll-banner">
        <span><strong>Free Choice:</strong> <em>Serpentine Advice</em> (Dubious Knowledge + Recall Knowledge) OR <em>Toxic Prophecy</em> (${poisonRoll.total} poison [${poisonDice}d4], Basic Fort DC ${dc} within 15 ft).</span>
      </div>
    `;
  } else if (app.slug === "lamentation-of-sinister-deals") {
    const price = WISH_MARKET_PRICES[(vesselEntry.wishPriceRoll || 1) - 1];
    bodyHtml = `
      <div class="acd-roll-banner">
        <span><strong>Merchant Contract:</strong> Boon on Perception & <strong>${escapeHtml(vesselEntry.wishBonusSkill)}</strong> | Price: <strong>${escapeHtml(price.name)}</strong> (${escapeHtml(price.summary)})</span>
      </div>
      <p class="acd-chat-desc">${vesselEntry.wishPenaltySuppressed ? "<strong>Haggled!</strong> Merchant price -2 penalty is suppressed for 1 round." : "Free Action granted: Recall Knowledge or Seek!"}</p>
    `;
  } else if (app.slug === "echo-of-lost-moments") {
    bodyHtml = `
      <div class="acd-roll-banner">
        <span><strong>Temporal Reserve:</strong> Gained <strong>+1 Bonus Reaction</strong> for any Animist or Apparition reaction this round!</span>
      </div>
    `;
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="acd-chat-card" style="border-left-color:${escapeHtml(app.color)}">
        <div class="acd-chat-header">
          <strong><i class="${escapeHtml(app.icon)}"></i> ${escapeHtml(app.vessel.name)} (Rank ${rank})</strong>
          <span class="acd-chat-tag">${escapeHtml(phaseLabel)} · Rd ${vesselEntry.roundsSustained}/10</span>
        </div>
        ${bodyHtml}
        ${buttonsHtml}
      </div>
    `
  });
}

export function getRankedMeleeStrikes(actor) {
  const actions = actor?.system?.actions ?? [];
  return actions
    .map((act, idx) => {
      if (!act || act.type !== "strike") return null;
      const isMelee = Boolean(act.item?.isMelee ?? (!act.item?.isRanged || act.altUsages?.some((u) => u.item?.isMelee)));
      if (!isMelee) return null;
      const ready = act.ready !== false;
      const mod = Number(act.totalModifier ?? act.modifiers?.reduce?.((s, m) => s + (m.enabled ? m.modifier : 0), 0) ?? 0);
      const isShield = /shield/i.test(act.label || act.item?.name || "");
      const isFist = /fist/i.test(act.label || act.item?.name || "");
      const score = (ready ? 1000 : 0) + mod * 10 - (isShield ? 45 : 0) - (isFist ? 20 : 0);
      return {
        index: idx,
        label: act.label || act.item?.name || "Melee Strike",
        ready,
        totalModifier: mod,
        variants: (act.variants ?? []).map((v, vIdx) => ({ index: vIdx, label: v.label || `MAP ${vIdx}` })),
        action: act,
        score
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

/**
 * Trigger an Animist Feat Action (Channeler's Stance, Grasping Spirits Spell, Channeled Protection, Apparition's Enhancement, Relinquish Control, Blazing Spirit, Grudge Strike, Roaring Heart).
 */
export async function executeAnimistFeatAction(actor, featSlug, options = {}) {
  if (!actor) return null;
  const meta = COMBAT_FEAT_ACTIONS.find((f) => f.slug === featSlug);
  if (!meta) return null;

  const state = getActorSpiritState(actor);
  if (meta.cooldownKey && state.cooldowns10Min[meta.cooldownKey]) {
    ui.notifications?.warn(`${meta.name} is on a 10-minute cooldown (use 10-Min Refocus to clear).`);
    return null;
  }

  const stats = getAnimistSpellStats(actor);
  const limits = getAnimistLimits(actor);

  // Toggleable Stance / Self Effects
  if (["channelers-stance", "apparitions-enhancement", "relinquish-control", "channeled-protection", "roaring-heart"].includes(featSlug)) {
    const existing = actor.items.find(
      (i) =>
        i.type === "effect" &&
        (i.sourceId === meta.effectUuid || i.getFlag(MODULE_ID, "featActionSlug") === featSlug)
    );
    if (existing && (featSlug === "channelers-stance" || featSlug === "relinquish-control")) {
      await existing.delete();
      ui.notifications?.info(`${actor.name}: Ended ${meta.name}.`);
      return false;
    }

    let effData = null;
    if (meta.effectUuid) {
      const doc = await fromUuid(meta.effectUuid).catch(() => null);
      if (doc) {
        effData = doc.toObject();
        delete effData._id;
        effData.flags = foundry.utils.mergeObject(effData.flags || {}, {
          [MODULE_ID]: { featActionSlug: featSlug }
        });
      }
    }
    if (!effData) {
      effData = buildCustomEffectData({
        name: `Effect: ${meta.name}`,
        description: `<p>${escapeHtml(meta.summary)}</p>`,
        level: limits.level,
        durationRounds: featSlug === "channelers-stance" ? 100 : 1,
        flags: { [MODULE_ID]: { featActionSlug: featSlug } }
      });
    }
    await actor.createEmbeddedDocuments("Item", [effData]);

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="acd-chat-card" style="border-left-color:#a78bfa">
          <div class="acd-chat-header">
            <strong><i class="fa-solid fa-sparkles"></i> ${escapeHtml(meta.name)}</strong>
            <span class="acd-chat-tag">${escapeHtml(meta.actions)}</span>
          </div>
          <p class="acd-chat-desc">${escapeHtml(meta.summary)}</p>
        </div>
      `
    });
    return true;
  }

  // Grasping Spirits Spell (1/10 min Spellshape + 30-ft Pull on failed Fortitude save!)
  if (featSlug === "grasping-spirits-spell") {
    await mutateActorSpiritState(actor, (s) => {
      s.cooldowns10Min["grasping-spirits-spell"] = true;
      return s;
    });

    const targets = collectCanvasTargetTokens(actor, 90, false);
    const rows = targets
      .map(
        (t) => `
        <div class="acd-target-row">
          <span class="acd-target-name">${escapeHtml(t.name)}</span>
          <div class="acd-target-btns">
            <button type="button" class="acd-chat-mini-btn" data-acd-chat="roll-save" data-target-uuid="${escapeHtml(t.actor.uuid)}" data-save="fortitude" data-dc="${stats.dc}">Fort DC ${stats.dc}</button>
            <button type="button" class="acd-chat-mini-btn acd-btn-crit" data-acd-chat="pull-target" data-sender-actor-id="${escapeHtml(actor.id)}" data-target-token-id="${escapeHtml(t.id)}" data-feet="30">Pull 30 ft</button>
          </div>
        </div>`
      )
      .join("");

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="acd-chat-card" style="border-left-color:#34d399">
          <div class="acd-chat-header">
            <strong><i class="fa-solid fa-hand-sparkles"></i> Grasping Spirits Spell</strong>
            <span class="acd-chat-tag">1A Spellshape · 1/10 Min</span>
          </div>
          <p class="acd-chat-desc">Next single-target ranged/touch spell gains <strong>+30 ft range</strong>! Target must succeed at a <strong>Fortitude save (DC ${stats.dc})</strong> or be pulled up to 30 ft directly toward ${escapeHtml(actor.name)}!</p>
          ${rows ? `<div class="acd-target-list">${rows}</div>` : `<p class="acd-chat-hint">Target an enemy token (T) to roll Fortitude & auto-pull up to 30 ft.</p>`}
        </div>
      `
    });
    return true;
  }

  if (featSlug === "blazing-spirit") {
    await mutateActorSpiritState(actor, (s) => {
      s.cooldowns10Min["blazing-spirit"] = true;
      return s;
    });
    const dice = limits.level >= 18 ? 3 : limits.level >= 12 ? 2 : 1;
    const roll = await new Roll(`${dice}d6`).evaluate();
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="acd-chat-card" style="border-left-color:#f97316">
          <div class="acd-chat-header">
            <strong><i class="fa-solid fa-fire"></i> Blazing Spirit</strong>
            <span class="acd-chat-tag">Reaction · 1/10 Min</span>
          </div>
          <p class="acd-chat-desc">Gain <strong>Resistance ${limits.level}</strong> to triggering melee damage! Melee attacker takes <strong>${roll.total} fire</strong> (${dice}d6) + <strong>${dice} persistent fire</strong>.</p>
        </div>
      `
    });
    return true;
  }

  if (featSlug === "grudge-strike") {
    const ranked = getRankedMeleeStrikes(actor);
    const chosen =
      (options.strikeIndex !== undefined ? ranked.find((r) => r.index === Number(options.strikeIndex)) : null) ??
      ranked[0] ??
      null;
    const mapIdx = Math.max(0, Math.min(2, Number(options.mapIndex || 0)));

    // Apply temporary +2 circumstance bonus for Grudge Strike roll
    const boostEff = buildCustomEffectData({
      name: "Grudge Strike (+2 Circumstance Attack)",
      description: "<p>+2 circumstance bonus to your Grudge Strike melee attack roll.</p>",
      level: limits.level,
      durationRounds: 0,
      rules: [{ key: "FlatModifier", selector: "strike-attack-roll", value: 2, type: "circumstance", label: "Grudge Strike" }]
    });
    const createdBoost = await actor.createEmbeddedDocuments("Item", [boostEff]);
    try {
      if (chosen?.action?.variants?.[mapIdx]?.roll) {
        await chosen.action.variants[mapIdx].roll({ event: options.event });
      }
    } finally {
      if (createdBoost?.[0]?.id && actor.items.has(createdBoost[0].id)) {
        await actor.deleteEmbeddedDocuments("Item", [createdBoost[0].id]);
      }
    }

    const bonusRoll = await new Roll("2d6").evaluate();
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `
        <div class="acd-chat-card" style="border-left-color:#a855f7">
          <div class="acd-chat-header">
            <strong><i class="fa-solid fa-skull"></i> Grudge Strike (${escapeHtml(chosen?.label || "Melee")})</strong>
            <span class="acd-chat-tag">2A · +2 Circ</span>
          </div>
          <p class="acd-chat-desc">Spiteful apparition grudges add <strong>+${bonusRoll.total} void</strong> damage (2d6), or <strong>+${bonusRoll.total} vitality</strong> damage if the target is undead or has void healing!</p>
        </div>
      `
    });
    return true;
  }

  if (featSlug === "whispers-of-warning") {
    await mutateActorSpiritState(actor, (s) => {
      s.cooldowns10Min["whispers-of-warning"] = true;
      return s;
    });
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="acd-chat-card" style="border-left-color:#38bdf8">
        <div class="acd-chat-header">
          <strong><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml(meta.name)}</strong>
          <span class="acd-chat-tag">${escapeHtml(meta.actions)}</span>
        </div>
        <p class="acd-chat-desc">${escapeHtml(meta.summary)}</p>
      </div>
    `
  });
  return true;
}

/**
 * Roll an Apparition Lore skill check natively via PF2e's skill statistic (or fallback d20 roll).
 */
export async function rollApparitionLore(actor, loreName, event = null) {
  if (!actor) return null;
  const fullName = /lore$/i.test(loreName) ? loreName : `${loreName} Lore`;
  const loreItem = (actor.itemTypes?.lore ?? []).find(
    (l) => String(l.name || "").toLowerCase() === fullName.toLowerCase()
  );

  // Try PF2e actor.skills slug match first
  if (actor.skills) {
    const slugMatch = Object.values(actor.skills).find(
      (s) => String(s.label || "").toLowerCase() === fullName.toLowerCase()
    );
    if (slugMatch?.check?.roll) {
      return slugMatch.check.roll({ event });
    }
  }

  const limits = getAnimistLimits(actor);
  const intMod = Number(actor.system?.abilities?.int?.mod ?? 0);
  const profBonus = limits.level + limits.loreRank * 2;
  const hasRelinquish = actor.items.some((i) => i.slug === "effect-relinquish-control" || i.getFlag(MODULE_ID, "featActionSlug") === "relinquish-control");
  const totalMod = profBonus + intMod + (hasRelinquish ? 2 : 0);
  const roll = await new Roll(`1d20 + ${totalMod}`).evaluate();
  return roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `<strong>Recall Knowledge: ${escapeHtml(fullName)}</strong>${hasRelinquish ? " (+2 Relinquish Control)" : ""}`
  });
}

/**
 * Save / Apply Morning Daily Preparation Preset
 */
export async function saveDailySpiritPreset(actor) {
  if (!actor) return null;
  const state = getActorSpiritState(actor);
  const preset = {
    attuned: [...state.attuned],
    primary: [...state.primary],
    familiarSpirit: state.familiarSpirit,
    wishSkill: state.wishSkill
  };
  await mutateActorSpiritState(actor, (s) => {
    s.dailyPreset = preset;
    return s;
  });
  ui.notifications?.info(`Saved Daily Spirit Preparation preset for ${actor.name}.`);
  return preset;
}

export async function applyDailySpiritPreset(actor) {
  if (!actor) return null;
  const cur = getActorSpiritState(actor);
  if (!cur.dailyPreset?.attuned?.length) {
    ui.notifications?.warn("No saved Morning Preset yet — configure your spirits and click Save Preset first.");
    return null;
  }
  const next = await mutateActorSpiritState(actor, (s) => {
    s.attuned = [...cur.dailyPreset.attuned];
    if (s.crafterVowLocked && !s.attuned.includes("crafter-in-the-vault")) {
      s.attuned[s.attuned.length - 1] = "crafter-in-the-vault";
    }
    s.primary = [...cur.dailyPreset.primary].filter((x) => s.attuned.includes(x));
    if (s.primary.length === 0 && s.attuned.length > 0) s.primary = [s.attuned[0]];
    s.dispersed = [];
    s.activeVessels = [];
    s.cooldowns10Min = clearObjectFlags(s.cooldowns10Min);
    s.circleUsedThisTurn = false;
    s.familiarSpirit = cur.dailyPreset.familiarSpirit && s.attuned.includes(cur.dailyPreset.familiarSpirit)
      ? cur.dailyPreset.familiarSpirit
      : s.attuned[0] ?? null;
    return s;
  });
  await syncActorSheetWithState(actor, { refreshSlots: true, stateOverride: next });
  return next;
}

/* ==========================================================================
   Hardened Cross-Actor GM Socket Relay (BUG-261115-02 Compliant)
   ========================================================================== */

const ALLOWED_SOCKET_OPS = new Set([
  "applyDamage",
  "applyHealing",
  "applyCondition",
  "createCalmEffect",
  "pullTokenToward"
]);

const ALLOWED_CONDITIONS = new Set([
  "confused",
  "off-guard",
  "frightened",
  "concealed",
  "stupefied",
  "dazzled"
]);

function isAuthorizedSocketSender(senderUserId, operation, payload, targetActorUuid = null, chatMessageId = null) {
  const user = game.users?.get(senderUserId);
  if (!user || !user.active) return false;
  if (!ALLOWED_SOCKET_OPS.has(operation)) return false;

  if (!user.isGM) {
    const ownedAnimists = (game.actors?.contents ?? []).filter(
      (a) =>
        a.testUserPermission?.(user, "OWNER") &&
        (game.settings?.get(MODULE_ID, "allowAnyCharacter") || isAnimistActor(a))
    );
    if (ownedAnimists.length === 0) return false;

    // Require an originating Animist ChatMessage from an owned Animist actor
    const originMsg = chatMessageId ? game.messages?.get(chatMessageId) : null;
    const speakerActorId = originMsg?.speaker?.actor;
    if (!originMsg || !ownedAnimists.some((a) => a.id === speakerActorId)) {
      return false;
    }
    if (
      targetActorUuid &&
      (operation === "applyDamage" || operation === "applyCondition") &&
      !String(originMsg.content || "").includes(targetActorUuid)
    ) {
      return false;
    }
  }

  if (operation === "applyCondition" && !ALLOWED_CONDITIONS.has(String(payload?.slug || "").toLowerCase())) {
    return false;
  }
  if (operation === "applyDamage" || operation === "applyHealing") {
    const amt = Number(payload?.amount);
    if (!Number.isFinite(amt) || amt < 0 || amt > 500) return false;
  }
  if (operation === "pullTokenToward") {
    const feet = Number(payload?.feet);
    if (!Number.isFinite(feet) || feet <= 0 || feet > 60) return false;
    const scene = game.scenes?.get(payload?.sceneId);
    const srcTok = scene?.tokens?.get(payload?.sourceTokenId);
    const dstTok = scene?.tokens?.get(payload?.targetTokenId);
    if (!scene || !srcTok || !dstTok || srcTok.id === dstTok.id) return false;
    if (!user.isGM) {
      const srcActor = srcTok.actor;
      if (!srcActor || !srcActor.testUserPermission?.(user, "OWNER") || !isAnimistActor(srcActor)) {
        return false;
      }
    }
    const gridSize = Number(scene.grid?.size) || 100;
    const gridDist = Number(scene.grid?.distance) || 5;
    const distFeet = (Math.hypot(srcTok.x - dstTok.x, srcTok.y - dstTok.y) / gridSize) * gridDist;
    if (distFeet > 120) return false;
  }
  return true;
}

export async function executeOnTargetActor(targetActorUuid, operation, payload = {}) {
  if (!targetActorUuid && operation !== "pullTokenToward") return null;
  const targetDoc = targetActorUuid ? await fromUuid(targetActorUuid).catch(() => null) : null;
  const targetActor = targetDoc?.actor ?? (targetDoc?.documentName === "Actor" ? targetDoc : null);

  if ((game.user?.isGM || targetActor?.isOwner) && (targetActor || operation === "pullTokenToward")) {
    return performTargetActorOp(targetActor, operation, payload);
  }

  if (!game.users?.activeGM) {
    ui.notifications?.warn("No active GM connected to apply cross-token spirit effect.");
    return null;
  }

  const requestId = foundry.utils.randomID();
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      Hooks.off(`${MODULE_ID}.socketAck.${requestId}`, onAck);
      resolve(null);
    }, 4000);

    function onAck(result) {
      clearTimeout(timeout);
      resolve(result);
    }

    Hooks.once(`${MODULE_ID}.socketAck.${requestId}`, onAck);
    game.socket.emit(SOCKET_NAME, {
      action: "targetActorOp",
      requestId,
      targetActorUuid,
      chatMessageId: payload?.chatMessageId ?? null,
      operation,
      payload
    });
  });
}

export async function performTargetActorOp(targetActor, operation, payload = {}) {
  try {
    switch (operation) {
      case "applyDamage": {
        if (!targetActor) return null;
        const amount = Math.max(0, Math.min(500, Math.trunc(Number(payload.amount) || 0)));
        if (amount > 0) {
          if (typeof targetActor.applyDamage === "function") {
            try {
              const roll = await new Roll(`${amount}[${payload.damageType || "untyped"}]`).evaluate();
              await targetActor.applyDamage({
                damage: roll,
                token: targetActor.getActiveTokens?.(true, true)?.[0] ?? null
              });
            } catch (_e) {
              const curHp = Number(targetActor.system?.attributes?.hp?.value ?? 0);
              await targetActor.update({ "system.attributes.hp.value": Math.max(0, curHp - amount) });
            }
          } else {
            const curHp = Number(targetActor.system?.attributes?.hp?.value ?? 0);
            await targetActor.update({ "system.attributes.hp.value": Math.max(0, curHp - amount) });
          }
        }
        const persist = Math.max(0, Math.min(50, Math.trunc(Number(payload.persistFire) || 0)));
        if (persist > 0) {
          const persistDoc = await fromUuid("Compendium.pf2e.conditionitems.Item.lDVqvLKA6eF3Df60").catch(() => null);
          if (persistDoc) {
            const obj = persistDoc.toObject();
            delete obj._id;
            obj.system.persistent = { formula: `${persist}`, damageType: "fire", dc: 15 };
            await targetActor.createEmbeddedDocuments("Item", [obj]);
          }
        }
        return { applied: amount };
      }
      case "applyHealing": {
        if (!targetActor) return null;
        const heal = Math.max(0, Math.min(500, Math.trunc(Number(payload.amount) || 0)));
        if (heal <= 0) return { healed: 0 };
        const curHp = Number(targetActor.system?.attributes?.hp?.value ?? 0);
        const maxHp = Number(targetActor.system?.attributes?.hp?.max ?? curHp + heal);
        const nextHp = Math.min(maxHp, curHp + heal);
        await targetActor.update({ "system.attributes.hp.value": nextHp });
        return { healed: nextHp - curHp };
      }
      case "applyCondition": {
        if (!targetActor) return null;
        const slug = String(payload.slug || "").toLowerCase();
        if (!ALLOWED_CONDITIONS.has(slug)) return null;
        if (typeof targetActor.increaseCondition === "function") {
          await targetActor.increaseCondition(slug, { min: 1, value: 1 });
        }
        return { condition: slug };
      }
      case "createCalmEffect": {
        if (!targetActor) return null;
        const calmDoc = await fromUuid("Compendium.pf2e.spell-effects.Item.JhxAUu3JEyERedMd").catch(() => null);
        if (calmDoc) {
          const obj = calmDoc.toObject();
          delete obj._id;
          await targetActor.createEmbeddedDocuments("Item", [obj]);
        }
        return { calm: true };
      }
      case "pullTokenToward": {
        const scene = game.scenes?.get(payload.sceneId);
        const targetTokDoc = scene?.tokens?.get(payload.targetTokenId);
        const sourceTokDoc = scene?.tokens?.get(payload.sourceTokenId);
        if (!targetTokDoc || !sourceTokDoc) return { pulled: false };
        const gridSize = Number(scene.grid?.size) || 100;
        const gridDist = Number(scene.grid?.distance) || 5;
        const maxPx = (Math.min(60, Math.max(5, Number(payload.feet) || 30)) / gridDist) * gridSize;
        const dx = sourceTokDoc.x - targetTokDoc.x;
        const dy = sourceTokDoc.y - targetTokDoc.y;
        const totalDist = Math.hypot(dx, dy);
        if (totalDist <= gridSize) return { pulled: false };
        const movePx = Math.min(maxPx, Math.max(0, totalDist - gridSize));
        const ratio = movePx / totalDist;
        const rawX = targetTokDoc.x + dx * ratio;
        const rawY = targetTokDoc.y + dy * ratio;
        const snappedX = Math.round(rawX / gridSize) * gridSize;
        const snappedY = Math.round(rawY / gridSize) * gridSize;
        await targetTokDoc.update({ x: snappedX, y: snappedY }, { animate: true });
        return { pulled: true };
      }
      default:
        return null;
    }
  } catch (err) {
    console.error(`${MODULE_ID} | performTargetActorOp(${operation}) failed:`, err);
    return null;
  }
}

export function setupSocketListener() {
  if (!game.socket) return;
  game.socket.on(SOCKET_NAME, async (message, socketUserId) => {
    if (!message || typeof message !== "object") return;
    if (message.action === "refreshSpirits") {
      Hooks.callAll(`${MODULE_ID}.refreshSpirits`);
      return;
    }
    if (message.action === "socketAck" && message.requestId) {
      Hooks.callAll(`${MODULE_ID}.socketAck.${message.requestId}`, message.result);
      return;
    }
    if (message.action === "targetActorOp" && isPrimaryGM()) {
      const verifiedSender = socketUserId || message.senderId;
      if (
        !isAuthorizedSocketSender(
          verifiedSender,
          message.operation,
          message.payload,
          message.targetActorUuid,
          message.chatMessageId
        )
      ) {
        console.warn(`${MODULE_ID} | Rejected unauthorized socket operation:`, message.operation);
        return;
      }
      const doc = message.targetActorUuid ? await fromUuid(message.targetActorUuid).catch(() => null) : null;
      const targetActor = doc?.actor ?? (doc?.documentName === "Actor" ? doc : null);
      const result = await performTargetActorOp(targetActor, message.operation, message.payload);
      game.socket.emit(SOCKET_NAME, {
        action: "socketAck",
        requestId: message.requestId,
        result
      });
    }
  });
}

export function registerChatCardListeners() {
  Hooks.on("renderChatMessageHTML", (message, htmlElement) => {
    const root = htmlElement instanceof HTMLElement ? htmlElement : htmlElement?.[0];
    if (!root) return;
    const buttons = root.querySelectorAll("[data-acd-chat]");
    if (!buttons.length) return;

    buttons.forEach((btn) => {
      btn.addEventListener("click", async (ev) => {
        ev.preventDefault();
        const cmd = btn.dataset.acdChat;
        const chatMessageId = message?.id ?? null;

        if (cmd === "roll-save") {
          const doc = await fromUuid(btn.dataset.targetUuid).catch(() => null);
          const targetActor = doc?.actor ?? (doc?.documentName === "Actor" ? doc : null);
          if (!targetActor) return;
          const saveType = btn.dataset.save || "reflex";
          const dc = Number(btn.dataset.dc || 17);
          const saveStat = targetActor.saves?.[saveType];
          if (saveStat?.check?.roll) {
            await saveStat.check.roll({ dc: { value: dc }, event: ev });
          }
        } else if (cmd === "apply-dmg") {
          await executeOnTargetActor(btn.dataset.targetUuid, "applyDamage", {
            amount: Number(btn.dataset.amount || 0),
            damageType: btn.dataset.dmgType || "fire",
            persistFire: Number(btn.dataset.persist || 0),
            chatMessageId
          });
        } else if (cmd === "apply-heal") {
          await executeOnTargetActor(btn.dataset.targetUuid, "applyHealing", {
            amount: Number(btn.dataset.amount || 0),
            chatMessageId
          });
        } else if (cmd === "heal-all-emanation") {
          const actor = game.actors?.get(btn.dataset.senderActorId);
          if (!actor) return;
          const amt = Number(btn.dataset.amount || 0);
          const allies = collectCanvasTargetTokens(actor, 10, true);
          const src = getActorTokenOnCanvas(actor);
          if (src && !allies.some((t) => t.id === src.id)) allies.unshift(src);
          for (const t of allies) {
            if (t.actor?.uuid) await executeOnTargetActor(t.actor.uuid, "applyHealing", { amount: amt, chatMessageId });
          }
          ui.notifications?.info(`Healed ${allies.length} ally token(s) in 10-ft Garden of Healing for +${amt} HP.`);
        } else if (cmd === "apply-cond") {
          await executeOnTargetActor(btn.dataset.targetUuid, "applyCondition", {
            slug: btn.dataset.cond,
            chatMessageId
          });
        } else if (cmd === "apply-garden-calm") {
          const actor = game.actors?.get(btn.dataset.actorId);
          if (!actor) return;
          const allies = collectCanvasTargetTokens(actor, 10, true);
          const src = getActorTokenOnCanvas(actor);
          if (src && !allies.some((t) => t.id === src.id)) allies.unshift(src);
          for (const t of allies) {
            if (t.actor?.uuid) await executeOnTargetActor(t.actor.uuid, "createCalmEffect", { chatMessageId });
          }
          ui.notifications?.info(`Applied lingering Garden of Healing (+1 vs emotion) to ${allies.length} creature(s).`);
        } else if (cmd === "pull-target") {
          const actor = game.actors?.get(btn.dataset.senderActorId);
          const srcTok = getActorTokenOnCanvas(actor);
          const cvs = globalThis.canvas;
          if (!srcTok || !cvs?.scene) return;
          await executeOnTargetActor(null, "pullTokenToward", {
            sceneId: cvs.scene.id,
            sourceTokenId: srcTok.id,
            targetTokenId: btn.dataset.targetTokenId,
            feet: Number(btn.dataset.feet || 30),
            chatMessageId
          });
        } else if (cmd === "roll-mirror-check") {
          const actor = game.actors?.get(btn.dataset.actorId);
          if (!actor) return;
          const state = getActorSpiritState(actor);
          const v = state.activeVessels.find((x) => x.apparitionSlug === "reveler-in-lost-glee");
          const mirrors = v?.mirrors || 0;
          if (mirrors <= 0) {
            ui.notifications?.warn("No Trickster's Mirrors remaining!");
            return;
          }
          const die = mirrors === 3 ? "1d4" : "1d6";
          const r = await new Roll(die).evaluate();
          const hitAnimist = (mirrors === 1 && r.total >= 4) || (mirrors === 2 && r.total <= 2) || (mirrors === 3 && r.total === 1);
          if (!hitAnimist) {
            await mutateActorSpiritState(actor, (s) => {
              const mv = s.activeVessels.find((x) => x.apparitionSlug === "reveler-in-lost-glee");
              if (mv) mv.mirrors = Math.max(0, (mv.mirrors || 1) - 1);
              return s;
            });
          }
          await r.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: hitAnimist
              ? `<strong>Trickster's Mirrors (${mirrors}):</strong> Attack strikes <strong>${escapeHtml(actor.name)}</strong>!`
              : `<strong>Trickster's Mirrors (${mirrors}):</strong> Attack shatters a <strong>Twisted Mirror</strong> instead of hitting ${escapeHtml(actor.name)}!`
          });
        } else if (cmd === "shatter-mirror") {
          const actor = game.actors?.get(btn.dataset.actorId);
          if (!actor) return;
          const rank = Number(btn.dataset.rank || 1);
          const dc = Number(btn.dataset.dc || 17);
          const roll = await new Roll(`${rank}d4`).evaluate();
          await mutateActorSpiritState(actor, (s) => {
            const mv = s.activeVessels.find((x) => x.apparitionSlug === "reveler-in-lost-glee");
            if (mv) mv.mirrors = Math.max(0, (mv.mirrors || 1) - 1);
            return s;
          });
          await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `<strong>Mirror Shatters!</strong> Adjacent attacker takes <strong>${roll.total} mental</strong> damage (Basic Will DC ${dc}).`
          });
        } else if (cmd === "anemos-shove") {
          const actor = game.actors?.get(btn.dataset.actorId);
          if (!actor) return;
          const stats = getAnimistSpellStats(actor);
          const r = await new Roll(`1d20 + ${stats.attackMod}`).evaluate();
          await r.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: `<strong>Gift of the Anemos — Gusting Shove</strong> (Spell Attack vs Fortitude DC)`
          });
        }
      });
    });
  });
}

export function registerLifecycleHooks() {
  // Start of Turn: reset per-turn Circle of Spirits & Sustained flags
  Hooks.on("pf2e.startTurn", async (combatant) => {
    const actor = combatant?.actor;
    if (!actor || !actor.isOwner || !isAnimistActor(actor)) return;
    await mutateActorSpiritState(actor, (s) => {
      s.circleUsedThisTurn = false;
      for (const v of s.activeVessels) {
        if (!v.exploration8h) {
          v.sustainedThisTurn = false;
          v.bonusReactionReady = false;
        }
      }
      return s;
    });
  });

  // End of Turn: auto-expire unsustained combat vessel spells if autoExpireUnsustained setting enabled
  Hooks.on("pf2e.endTurn", async (combatant) => {
    const actor = combatant?.actor;
    if (!actor || !actor.isOwner || !isAnimistActor(actor)) return;
    if (game.settings?.get(MODULE_ID, "autoExpireUnsustained") === false) return;

    const state = getActorSpiritState(actor);
    const unsustained = state.activeVessels.filter((v) => !v.exploration8h && !v.sustainedThisTurn);
    for (const v of unsustained) {
      await dismissVesselSpell(actor, v.id);
      ui.notifications?.info(`${actor.name}: ${v.vesselName} ended (not Sustained before end of turn).`);
    }
  });

  // Rest for the Night: clear dispersed state, reset 10-min cooldowns, refresh spontaneous & focus slots
  Hooks.on("pf2e.restForTheNight", async (actor) => {
    if (!actor || !actor.isOwner || !isAnimistActor(actor)) return;
    const next = await mutateActorSpiritState(actor, (s) => {
      s.dispersed = [];
      s.activeVessels = [];
      s.cooldowns10Min = clearObjectFlags(s.cooldowns10Min);
      s.circleUsedThisTurn = false;
      s.familiarIncorporeal = false;
      return s;
    });
    if (next?.attuned?.length) {
      await syncActorSheetWithState(actor, { refreshSlots: true, silent: true, stateOverride: next });
    }
  });
}
