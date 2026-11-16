import {
  APPARITIONS_DB,
  COMBAT_FEAT_ACTIONS,
  WANDERING_FEATS_DB,
  WISH_MARKET_BONUS_SKILLS,
  actorHasFeat,
  getAnimistLimits,
  getApparitionBySlug
} from "./apparitions-db.js";
import { clearSpiritRangePreview, previewSpiritRangeOnCanvas } from "./canvas-spirits.js";
import {
  MODULE_ID,
  applyDailySpiritPreset,
  applyStarterAttunement,
  castVesselSpell,
  clearObjectFlags,
  dismissVesselSpell,
  disperseApparition,
  doesSheetNeedSync,
  escapeHtml,
  executeAnimistFeatAction,
  getActorSpiritState,
  getActorTokenOnCanvas,
  getAnimistSpellStats,
  getCandidateAnimistActors,
  getRankedMeleeStrikes,
  isAnimistActor,
  mutateActorSpiritState,
  resolveAnimistActor,
  restoreDispersedApparition,
  rollApparitionLore,
  saveDailySpiritPreset,
  sustainVesselSpell,
  swapWanderingFeat,
  switchPrimaryApparition,
  syncActorSheetWithState,
  toggleAttunedApparition
} from "./spirit-engine.js";

let deckElement = null;
let launcherElement = null;
let lastToggleTimestamp = 0;
let dragState = null;

const uiState = {
  isOpen: false,
  activeTab: "battle", // "battle" | "attunement" | "daily" | "guide"
  selectedActorId: null,
  roleFilter: "all",
  searchQuery: "",
  disperseReason: "Apparition's Quickening",
  grudgeStrikeIndex: null,
  grudgeMapIndex: 0,
  posLeft: 140,
  posTop: 78
};

/**
 * Debounced toggle to prevent Foundry v14 SceneControls double-fire (see BUG-261024-01).
 */
export function toggleSpiritDeck(forceState = null, options = {}) {
  const now = Date.now();
  if (forceState === null && now - lastToggleTimestamp < 200) return;
  lastToggleTimestamp = now;

  if (options.actorId) uiState.selectedActorId = options.actorId;
  if (options.tab) uiState.activeTab = options.tab;

  const nextOpen = forceState !== null ? Boolean(forceState) : !uiState.isOpen;
  uiState.isOpen = nextOpen;

  if (uiState.isOpen) {
    renderSpiritDeck();
  } else {
    closeSpiritDeck();
  }
  renderSpiritLauncherPill();
}

export function closeSpiritDeck() {
  uiState.isOpen = false;
  clearSpiritRangePreview();
  if (deckElement) {
    deckElement.remove();
    deckElement = null;
  }
  renderSpiritLauncherPill();
}

function shouldShowSpiritUI() {
  if (game.user?.isGM) return true;
  if (game.settings?.get(MODULE_ID, "allowAnyCharacter")) return true;
  if (game.user?.character && isAnimistActor(game.user.character)) return true;
  return (game.actors?.contents ?? []).some((a) => a.isOwner && isAnimistActor(a));
}

export function renderSpiritLauncherPill() {
  if (!shouldShowSpiritUI() || uiState.isOpen) {
    if (launcherElement) {
      launcherElement.remove();
      launcherElement = null;
    }
    return;
  }

  const actor = resolveAnimistActor(uiState.selectedActorId);
  const state = actor ? getActorSpiritState(actor) : { attuned: [], dispersed: [], activeVessels: [] };
  const activeCount = state.attuned.filter((s) => !state.dispersed.includes(s)).length;
  const vesselLive = state.activeVessels.length > 0;

  if (!launcherElement) {
    launcherElement = document.createElement("button");
    launcherElement.type = "button";
    launcherElement.id = "acd-launcher-pill";
    launcherElement.className = "acd-launcher-pill";
    launcherElement.addEventListener("click", (ev) => {
      ev.preventDefault();
      toggleSpiritDeck(true);
    });
    document.body.appendChild(launcherElement);
  }

  const alignPillLeft = () => {
    if (!launcherElement) return;
    const runesmithPill = document.getElementById("rcd-launcher-pill");
    if (runesmithPill) {
      const rect = runesmithPill.getBoundingClientRect?.();
      const rightEdge = rect && rect.right > 0 ? Math.round(rect.right + 10) : 298;
      launcherElement.style.left = `${rightEdge}px`;
    } else {
      launcherElement.style.left = "118px";
    }
  };
  alignPillLeft();
  setTimeout(alignPillLeft, 200);

  launcherElement.innerHTML = `
    <span class="acd-launcher-glyph"><i class="fa-solid fa-ghost"></i></span>
    <span class="acd-launcher-text">Spirit Deck</span>
    ${activeCount > 0 ? `<span class="acd-launcher-count ${vesselLive ? "acd-count-live" : ""}">${vesselLive ? "VESSEL" : activeCount}</span>` : ""}
  `;
}

export function renderSpiritDeck() {
  if (!uiState.isOpen) return;

  const candidates = getCandidateAnimistActors();
  const actor = resolveAnimistActor(uiState.selectedActorId);
  if (actor) uiState.selectedActorId = actor.id;

  if (!deckElement) {
    deckElement = document.createElement("section");
    deckElement.id = "acd-command-deck";
    deckElement.className = "acd-deck-window";
    deckElement.style.left = `${uiState.posLeft}px`;
    deckElement.style.top = `${uiState.posTop}px`;
    bindDeckDelegatedEvents(deckElement);
    document.body.appendChild(deckElement);
  }

  if (!actor) {
    deckElement.innerHTML = `
      <header class="acd-header" data-acd-drag="1">
        <div class="acd-brand"><i class="fa-solid fa-ghost acd-sigil"></i> PF2e Animist Command Deck</div>
        <button type="button" class="acd-icon-btn" data-action="close-deck" title="Close">&times;</button>
      </header>
      <div class="acd-empty-state">
        <p>No owned Animist character found. Create or take ownership of an Animist character to begin channeling apparitions.</p>
      </div>
    `;
    return;
  }

  const state = getActorSpiritState(actor);
  const limits = getAnimistLimits(actor);
  const spellStats = getAnimistSpellStats(actor);
  const needsSync = doesSheetNeedSync(actor, state);

  const actorOptionsHtml = candidates
    .map(
      (c) =>
        `<option value="${escapeHtml(c.id)}" ${c.id === actor.id ? "selected" : ""}>${escapeHtml(c.name)} (Lv ${c.system?.details?.level?.value ?? c.level ?? 1})</option>`
    )
    .join("");

  const focusVal = Number(actor.system?.resources?.focus?.value ?? 0);
  const focusMax = Math.max(1, Number(actor.system?.resources?.focus?.max ?? (limits.hasCircleOfSpirits ? Math.min(3, Math.max(1, state.attuned.length)) : 1)));

  let tabBodyHtml = "";
  if (uiState.activeTab === "battle") {
    tabBodyHtml = buildBattleTabHtml(actor, state, limits, spellStats, focusVal, focusMax, needsSync);
  } else if (uiState.activeTab === "attunement") {
    tabBodyHtml = buildAttunementTabHtml(actor, state, limits);
  } else if (uiState.activeTab === "daily") {
    tabBodyHtml = buildDailyTabHtml(actor, state, limits);
  } else {
    tabBodyHtml = buildGuideTabHtml(actor, state, limits);
  }

  deckElement.innerHTML = `
    <header class="acd-header" data-acd-drag="1">
      <div class="acd-brand">
        <i class="fa-solid fa-ghost acd-sigil"></i>
        <span>Animist Spirit Deck</span>
      </div>
      <div class="acd-header-controls">
        <select class="acd-actor-select" data-action="select-actor" title="Select Animist Character">
          ${actorOptionsHtml}
        </select>
        <button type="button" class="acd-mini-sync-btn" data-action="sync-sheet" title="Synchronize Spells, Vessel Spells & Lores to Sheet">
          <i class="fa-solid fa-rotate"></i> Sync
        </button>
        <button type="button" class="acd-icon-btn" data-action="close-deck" title="Close">&times;</button>
      </div>
    </header>

    <div class="acd-subheader">
      <span class="acd-stat-chip"><i class="fa-solid fa-user-astronaut"></i> Lv ${limits.level} ${escapeHtml(limits.practice?.name || "Animist")}</span>
      <span class="acd-stat-chip"><i class="fa-solid fa-wand-sparkles"></i> Spell DC <strong>${spellStats.dc}</strong> (+${spellStats.attackMod}) · R${limits.maxRank}</span>
      <span class="acd-stat-chip"><i class="fa-solid fa-circle-nodes"></i> Spirits <strong>${state.attuned.length}/${limits.maxAttuned}</strong></span>
    </div>

    <nav class="acd-tabs">
      <button type="button" class="acd-tab ${uiState.activeTab === "battle" ? "active" : ""}" data-action="switch-tab" data-tab="battle">
        <i class="fa-solid fa-bolt"></i> Battle &amp; Vessel
      </button>
      <button type="button" class="acd-tab ${uiState.activeTab === "attunement" ? "active" : ""}" data-action="switch-tab" data-tab="attunement">
        <i class="fa-solid fa-ghost"></i> Spirits (${state.attuned.length}/${limits.maxAttuned})
      </button>
      <button type="button" class="acd-tab ${uiState.activeTab === "daily" ? "active" : ""}" data-action="switch-tab" data-tab="daily">
        <i class="fa-solid fa-sun"></i> Daily &amp; Shaman
      </button>
      <button type="button" class="acd-tab ${uiState.activeTab === "guide" ? "active" : ""}" data-action="switch-tab" data-tab="guide">
        <i class="fa-solid fa-book-open"></i> Guide
      </button>
    </nav>

    <div class="acd-body">
      ${tabBodyHtml}
    </div>
  `;
}

function buildBattleTabHtml(actor, state, limits, spellStats, focusVal, focusMax, needsSync) {
  const pips = [];
  for (let i = 1; i <= Math.min(3, focusMax); i++) {
    const filled = i <= focusVal;
    pips.push(
      `<button type="button" class="acd-focus-pip ${filled ? "filled" : ""}" data-action="set-focus" data-val="${filled && i === focusVal ? i - 1 : i}" title="Focus Point ${i}/${focusMax}">${filled ? "&#9670;" : "&#9671;"}</button>`
    );
  }

  const syncAlertHtml = needsSync
    ? `
      <div class="acd-sync-banner">
        <div>
          <strong><i class="fa-solid fa-triangle-exclamation"></i> Sheet Needs Spirit Sync</strong>
          <p>Detected unsynchronized Vessel Spells or Pathmuncher spell entries on <strong>${escapeHtml(actor.name)}</strong>.</p>
        </div>
        <button type="button" class="acd-primary-btn" data-action="sync-sheet">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Fix &amp; Sync Sheet Now
        </button>
      </div>`
    : "";

  // Active Sustained Vessel Spells Section
  const activeVesselsHtml = state.activeVessels.length
    ? state.activeVessels
        .map((v) => {
          const app = getApparitionBySlug(v.apparitionSlug);
          if (!app) return "";
          const canDance = limits.practice?.slug === "liturgist" && limits.level >= 9;
          return `
            <div class="acd-vessel-live-card" style="border-color:${escapeHtml(app.color)}">
              <div class="acd-vessel-live-top">
                <div>
                  <span class="acd-live-dot"></span>
                  <strong>${escapeHtml(v.vesselName)}</strong>
                  <span class="acd-badge">${v.exploration8h ? "8h Workshop" : `Rd ${v.roundsSustained}/10`}</span>
                  ${v.sustainedThisTurn ? `<span class="acd-badge acd-badge-ok">Sustained</span>` : `<span class="acd-badge acd-badge-warn">Needs Sustain!</span>`}
                  ${v.apparitionSlug === "reveler-in-lost-glee" ? `<span class="acd-badge">Mirrors: ${v.mirrors}/3</span>` : ""}
                  ${v.bonusReactionReady ? `<span class="acd-badge acd-badge-ok">+1 Spirit Reaction</span>` : ""}
                </div>
                <button type="button" class="acd-danger-mini" data-action="dismiss-vessel" data-vessel-id="${escapeHtml(v.id)}" title="Dismiss Vessel Spell">Dismiss</button>
              </div>
              <div class="acd-vessel-live-actions">
                <button type="button" class="acd-primary-btn" data-action="sustain-vessel" data-vessel-id="${escapeHtml(v.id)}">
                  <i class="fa-solid fa-rotate"></i> 1A Sustain Pulse
                </button>
                ${
                  canDance
                    ? `<button type="button" class="acd-secondary-btn" data-action="sustain-dancing" data-vessel-id="${escapeHtml(v.id)}" title="Dancing Invocation: Free Sustain with Leap, Step, or Tumble Through">
                        <i class="fa-solid fa-person-running"></i> Free Dance Sustain
                      </button>`
                    : ""
                }
                ${
                  v.apparitionSlug === "lamentation-of-sinister-deals"
                    ? `<button type="button" class="acd-secondary-btn" data-action="sustain-haggle" data-vessel-id="${escapeHtml(v.id)}" title="Haggle on Sustain to suppress the -2 Merchant Price penalty for 1 round">
                        <i class="fa-solid fa-scale-balanced"></i> Sustain &amp; Haggle
                      </button>`
                    : ""
                }
              </div>
            </div>
          `;
        })
        .join("")
    : "";

  // Attuned Spirits Tactical Cards
  let spiritsHtml = "";
  if (state.attuned.length === 0) {
    spiritsHtml = `
      <div class="acd-empty-card">
        <p>No apparitions attuned yet today.</p>
        <div class="acd-btn-row">
          <button type="button" class="acd-primary-btn" data-action="starter-loadout">
            <i class="fa-solid fa-bolt"></i> Apply Recommended Spirits
          </button>
          <button type="button" class="acd-secondary-btn" data-action="switch-tab" data-tab="attunement">
            Choose Apparitions
          </button>
        </div>
      </div>
    `;
  } else {
    spiritsHtml = state.attuned
      .map((slug) => {
        const app = getApparitionBySlug(slug);
        if (!app) return "";
        const isDispersed = state.dispersed.includes(slug);
        const isPrimary = !isDispersed && state.primary.includes(slug);
        const isFamiliar = !isDispersed && state.familiarSpirit === slug && limits.hasSpiritFamiliar;
        const previewFeet = app.vessel.rangeFeet || app.vessel.emanationFeet || 0;

        const wishSelectHtml =
          isPrimary && slug === "lamentation-of-sinister-deals"
            ? `<select class="acd-inline-select" data-action="set-wish-skill" title="Wish Market Boon Skill">
                ${WISH_MARKET_BONUS_SKILLS.map((sk) => `<option value="${sk.slug}" ${state.wishSkill === sk.slug ? "selected" : ""}>+${sk.label}</option>`).join("")}
              </select>`
            : "";

        return `
          <div class="acd-spirit-card ${isPrimary ? "is-primary" : ""} ${isDispersed ? "is-dispersed" : ""}"
               style="--spirit-color:${escapeHtml(app.color)}"
               data-preview-range="${previewFeet}"
               data-preview-color="${escapeHtml(app.color)}">
            <div class="acd-spirit-card-head">
              <div class="acd-spirit-title">
                <i class="${escapeHtml(app.icon)}" style="color:${escapeHtml(app.color)}"></i>
                <strong>${escapeHtml(app.name)}</strong>
                ${isPrimary ? `<span class="acd-pill-primary">PRIMARY</span>` : ""}
                ${isFamiliar ? `<span class="acd-pill-familiar" title="Manifested as Shaman Spirit Familiar"><i class="fa-solid fa-paw"></i> Familiar</span>` : ""}
                ${isDispersed ? `<span class="acd-pill-dispersed">DISPERSED</span>` : ""}
              </div>
              <span class="acd-spirit-lores">${app.lores.map((l) => `${escapeHtml(l)} Lore`).join(" · ")}</span>
            </div>

            <div class="acd-spirit-vessel-line">
              <span><strong>Vessel:</strong> ${escapeHtml(app.vessel.name)} (${app.vessel.actions}A${app.vessel.emanationFeet ? ` · ${app.vessel.emanationFeet}-ft aura` : app.vessel.rangeFeet ? ` · ${app.vessel.rangeFeet} ft` : ""})</span>
            </div>
            <p class="acd-spirit-mini-desc">${escapeHtml(app.vessel.summary)}</p>

            <div class="acd-spirit-actions">
              ${
                isDispersed
                  ? `<button type="button" class="acd-secondary-btn" data-action="restore-spirit" data-slug="${escapeHtml(slug)}">
                      <i class="fa-solid fa-rotate-left"></i> Re-Attune Spirit
                    </button>`
                  : isPrimary
                  ? `
                    ${wishSelectHtml}
                    <button type="button" class="acd-primary-btn" data-action="cast-vessel" data-slug="${escapeHtml(slug)}">
                      <i class="fa-solid fa-wand-sparkles"></i> Cast ${escapeHtml(app.vessel.name)} (${app.vessel.actions}A)
                    </button>
                    ${
                      slug === "crafter-in-the-vault"
                        ? `<button type="button" class="acd-secondary-btn" data-action="cast-workshop-8h" data-slug="${escapeHtml(slug)}" title="10-min Exploration Cast -> 8-hour Workshop">8h Craft</button>`
                        : ""
                    }
                  `
                  : `
                    ${
                      limits.hasCircleOfSpirits
                        ? `<button type="button" class="acd-primary-btn" data-action="switch-primary" data-mode="circle" data-slug="${escapeHtml(slug)}" ${game.combat?.started && state.circleUsedThisTurn ? "disabled" : ""}>
                            <i class="fa-solid fa-arrows-spin"></i> 1A Circle of Spirits
                          </button>`
                        : ""
                    }
                    <button type="button" class="acd-secondary-btn" data-action="switch-primary" data-mode="refocus" data-slug="${escapeHtml(slug)}" title="10-Minute Refocus: Regain +1 Focus Point & Make Primary">
                      <i class="fa-solid fa-hourglass-start"></i> 10m Refocus Primary
                    </button>
                  `
              }
              ${
                !isDispersed
                  ? `<button type="button" class="acd-ghost-btn" data-action="disperse-spirit" data-slug="${escapeHtml(slug)}" title="Disperse Apparition (${escapeHtml(uiState.disperseReason)})">
                      <i class="fa-solid fa-wind"></i> Disperse
                    </button>`
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");
  }

  // Owned Combat Feats & Practice Actions
  const ownedCombatFeats = COMBAT_FEAT_ACTIONS.filter((f) => {
    if (f.slug === "relinquish-control" && limits.practice?.slug === "medium") return true;
    return actorHasFeat(actor, f.slug);
  });

  let grudgeSelectorHtml = "";
  if (ownedCombatFeats.some((f) => f.slug === "grudge-strike")) {
    const rankedStrikes = getRankedMeleeStrikes(actor);
    if (rankedStrikes.length > 0) {
      const selIdx =
        uiState.grudgeStrikeIndex !== null && rankedStrikes.some((s) => s.index === uiState.grudgeStrikeIndex)
          ? uiState.grudgeStrikeIndex
          : rankedStrikes[0].index;
      grudgeSelectorHtml = `
        <div class="acd-btn-row" style="margin-bottom:4px">
          <span class="acd-spirit-lores">Grudge Weapon:</span>
          <select class="acd-inline-select" data-action="set-grudge-weapon">
            ${rankedStrikes
              .map(
                (s, i) =>
                  `<option value="${s.index}" ${s.index === selIdx ? "selected" : ""}>${i === 0 ? "[Best] " : ""}${escapeHtml(s.label)} (+${s.totalModifier})</option>`
              )
              .join("")}
          </select>
          <select class="acd-inline-select" data-action="set-grudge-map">
            <option value="0" ${uiState.grudgeMapIndex === 0 ? "selected" : ""}>1st (No MAP)</option>
            <option value="1" ${uiState.grudgeMapIndex === 1 ? "selected" : ""}>2nd Attack</option>
            <option value="2" ${uiState.grudgeMapIndex === 2 ? "selected" : ""}>3rd Attack</option>
          </select>
        </div>
      `;
    }
  }

  const featsHtml = ownedCombatFeats.length
    ? `
      <div class="acd-section">
        <div class="acd-section-head">
          <span><i class="fa-solid fa-hand-sparkles"></i> Spirit Feats, Stances &amp; Spellshapes</span>
        </div>
        ${grudgeSelectorHtml}
        <div class="acd-feat-grid">
          ${ownedCombatFeats
            .map((f) => {
              const onCd = f.cooldownKey && state.cooldowns10Min[f.cooldownKey];
              const isActive = actor.items.some(
                (i) => i.type === "effect" && (i.sourceId === f.effectUuid || i.getFlag(MODULE_ID, "featActionSlug") === f.slug)
              );
              return `
                <button type="button" class="acd-feat-btn ${isActive ? "is-active" : ""} ${onCd ? "is-cooldown" : ""}"
                        data-action="trigger-feat" data-feat="${escapeHtml(f.slug)}"
                        title="${escapeHtml(f.summary)}" ${onCd ? "disabled" : ""}>
                  <span class="acd-feat-name">${escapeHtml(f.name)}</span>
                  <span class="acd-feat-meta">${onCd ? "10m CD" : isActive ? "ACTIVE" : escapeHtml(f.actions)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    `
    : "";

  // Active Apparition Lores Recall Knowledge Strip
  const activeLores = [];
  for (const s of state.attuned) {
    if (state.dispersed.includes(s)) continue;
    const a = getApparitionBySlug(s);
    if (!a) continue;
    for (const l of a.lores) {
      if (!activeLores.includes(l)) activeLores.push(l);
    }
  }

  const loresStripHtml = activeLores.length
    ? `
      <div class="acd-section">
        <div class="acd-section-head">
          <span><i class="fa-solid fa-scroll"></i> Apparition Skills (1-Click Recall Knowledge)</span>
        </div>
        <div class="acd-lore-row">
          ${activeLores
            .map(
              (l) => `
              <button type="button" class="acd-lore-chip" data-action="roll-lore" data-lore="${escapeHtml(l)}">
                <i class="fa-solid fa-dice-d20"></i> ${escapeHtml(l)} Lore
              </button>`
            )
            .join("")}
        </div>
      </div>
    `
    : "";

  return `
    ${syncAlertHtml}

    <div class="acd-focus-bar">
      <div class="acd-focus-left">
        <span class="acd-focus-label">Focus Pool:</span>
        <div class="acd-pips">${pips.join("")}</div>
        <span class="acd-focus-num">${focusVal}/${focusMax}</span>
      </div>
      <div class="acd-focus-right">
        <button type="button" class="acd-secondary-btn" data-action="refocus-now" title="10-Min Exploration Refocus: +1 Focus Point & Reset 10-Min Cooldowns">
          <i class="fa-solid fa-spa"></i> 10m Refocus
        </button>
      </div>
    </div>

    ${activeVesselsHtml}

    <div class="acd-section">
      <div class="acd-section-head">
        <span><i class="fa-solid fa-circle-radiation"></i> Attuned Conduit Spirits</span>
        <select class="acd-inline-select" data-action="set-disperse-reason" title="Reason when clicking Disperse">
          <option value="Apparition's Quickening" ${uiState.disperseReason === "Apparition's Quickening" ? "selected" : ""}>Disperse: Quickening</option>
          <option value="Fly on Shadowed Wings" ${uiState.disperseReason === "Fly on Shadowed Wings" ? "selected" : ""}>Disperse: Shadowed Wings</option>
          <option value="Spirit's Sacrifice" ${uiState.disperseReason === "Spirit's Sacrifice" ? "selected" : ""}>Disperse: Spirit's Sacrifice</option>
          <option value="Familiar Slain" ${uiState.disperseReason === "Familiar Slain" ? "selected" : ""}>Disperse: Familiar Slain</option>
        </select>
      </div>
      <div class="acd-spirits-list">
        ${spiritsHtml}
      </div>
    </div>

    ${featsHtml}
    ${loresStripHtml}
  `;
}

function buildAttunementTabHtml(actor, state, limits) {
  const roles = ["all", "blaster", "healer", "striker", "control", "debuff", "mobility", "utility"];
  const q = uiState.searchQuery.trim().toLowerCase();

  const filtered = APPARITIONS_DB.filter((app) => {
    if (uiState.roleFilter !== "all" && app.role !== uiState.roleFilter) return false;
    if (!q) return true;
    const hay = [
      app.name,
      app.summary,
      app.vessel.name,
      app.vessel.summary,
      ...app.lores,
      ...app.spells.map((s) => s.name)
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  const cardsHtml = filtered
    .map((app) => {
      const isAttuned = state.attuned.includes(app.slug);
      const isPrimary = state.primary.includes(app.slug);
      const unlockedSpells = app.spells
        .map((sp) => {
          const unlocked = sp.rank <= limits.maxRank;
          const rkLabel = sp.rank === 0 ? "C" : `R${sp.rank}`;
          return `<span class="acd-spell-pill ${unlocked ? "unlocked" : "locked"}" title="Rank ${sp.rank}">${rkLabel}: ${escapeHtml(sp.name)}</span>`;
        })
        .join("");

      return `
        <div class="acd-rep-card ${isAttuned ? "attuned" : ""}" style="--spirit-color:${escapeHtml(app.color)}">
          <div class="acd-rep-top">
            <div>
              <i class="${escapeHtml(app.icon)}" style="color:${escapeHtml(app.color)}"></i>
              <strong>${escapeHtml(app.name)}</strong>
              <span class="acd-role-tag">${escapeHtml(app.role)}</span>
            </div>
            <div class="acd-rep-btns">
              ${
                isAttuned && !isPrimary
                  ? `<button type="button" class="acd-secondary-btn" data-action="switch-primary" data-mode="instant" data-slug="${escapeHtml(app.slug)}">Make Primary</button>`
                  : ""
              }
              <button type="button" class="${isAttuned ? "acd-danger-mini" : "acd-primary-btn"}" data-action="toggle-attune" data-slug="${escapeHtml(app.slug)}">
                ${isAttuned ? "Unattune" : "+ Attune"}
              </button>
            </div>
          </div>
          <div class="acd-rep-meta">
            <span><strong>Lores:</strong> ${app.lores.map((l) => `${escapeHtml(l)} Lore`).join(", ")}</span>
            <span><strong>Vessel:</strong> ${escapeHtml(app.vessel.name)} (${app.vessel.actions}A)</span>
          </div>
          <p class="acd-spirit-mini-desc">${escapeHtml(app.vessel.summary)}</p>
          <div class="acd-spell-pills">${unlockedSpells}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="acd-filter-bar">
      <input type="search" class="acd-search-input" data-action="rep-search" placeholder="Search 14 apparitions, spells, lores, vessel spells..." value="${escapeHtml(uiState.searchQuery)}" />
      <div class="acd-role-chips">
        ${roles
          .map(
            (r) =>
              `<button type="button" class="acd-chip ${uiState.roleFilter === r ? "active" : ""}" data-action="filter-role" data-role="${r}">${escapeHtml(r.toUpperCase())}</button>`
          )
          .join("")}
      </div>
    </div>
    <div class="acd-rep-toolbar">
      <span>Attuned: <strong>${state.attuned.length} / ${limits.maxAttuned}</strong> · Primary: <strong>${state.primary.length} / ${limits.maxPrimary}</strong></span>
      <div class="acd-btn-row">
        <button type="button" class="acd-secondary-btn" data-action="starter-loadout">Starter Loadout</button>
        <button type="button" class="acd-primary-btn" data-action="sync-sheet-refresh">Sync &amp; Refresh Slots</button>
      </div>
    </div>
    <div class="acd-rep-list">
      ${cardsHtml}
    </div>
  `;
}

function buildDailyTabHtml(actor, state, limits) {
  // Shaman Spirit Familiar Section
  let shamanHtml = "";
  if (limits.hasSpiritFamiliar) {
    const famOptions = state.attuned
      .filter((s) => !state.dispersed.includes(s))
      .map((s) => {
        const a = getApparitionBySlug(s);
        return `<option value="${escapeHtml(s)}" ${state.familiarSpirit === s ? "selected" : ""}>${escapeHtml(a?.name || s)}</option>`;
      })
      .join("");

    shamanHtml = `
      <div class="acd-section acd-shaman-box">
        <div class="acd-section-head">
          <span><i class="fa-solid fa-paw"></i> Shaman Spirit Familiar Bond</span>
          <span class="acd-badge acd-badge-ok">${limits.familiarAbilities} Familiar Abilities</span>
        </div>
        <p class="acd-spirit-mini-desc">Dedicate one attuned apparition to physically manifest as your Spirit Familiar (gains the <em>spirit</em> trait). If slain or dispersed, you lose that apparition's gifts until next daily prep.</p>
        <div class="acd-btn-row">
          <label>Manifested Spirit:</label>
          <select class="acd-inline-select" data-action="set-familiar-spirit">
            ${famOptions || "<option value=''>Attune a spirit first</option>"}
          </select>
          ${
            limits.practice?.slug === "shaman" && limits.level >= 17
              ? `<button type="button" class="acd-secondary-btn" data-action="toggle-familiar-incorporeal">
                  ${state.familiarIncorporeal ? "Dismiss Incorporeal" : "1A Incorporeal Form (1 min)"}
                </button>`
              : ""
          }
        </div>
      </div>
    `;
  }

  // Wandering Feats Swapper
  const activeLoreSet = new Set();
  for (const s of state.attuned) {
    if (state.dispersed.includes(s)) continue;
    const a = getApparitionBySlug(s);
    for (const l of a?.lores ?? []) activeLoreSet.add(l.toLowerCase());
  }

  const currentWanderingItems = (actor.itemTypes?.feat ?? []).filter((f) =>
    (f.system?.traits?.value ?? []).includes("wandering")
  );

  const wanderingRows = WANDERING_FEATS_DB.map((wf) => {
    const levelMet = limits.level >= wf.level;
    const loreMet =
      wf.loresRequired.length === 0 ||
      wf.loresRequired.some((l) => activeLoreSet.has(l.toLowerCase()));
    const famMet = !wf.requiresFamiliar || limits.hasSpiritFamiliar;
    const alreadyOwned = currentWanderingItems.some((i) => i.slug === wf.slug || i.system?.slug === wf.slug);
    const replaceTargetId = currentWanderingItems[0]?.id ?? "";

    return `
      <div class="acd-wandering-row ${alreadyOwned ? "owned" : ""} ${!levelMet ? "locked" : ""}">
        <div>
          <strong>Lv ${wf.level} · ${escapeHtml(wf.name)}</strong>
          ${wf.loresRequired.length ? `<span class="acd-badge ${loreMet ? "acd-badge-ok" : "acd-badge-warn"}">Req: ${wf.loresRequired.join(" / ")} Lore</span>` : ""}
          ${wf.requiresFamiliar ? `<span class="acd-badge ${famMet ? "acd-badge-ok" : "acd-badge-warn"}">Req: Familiar</span>` : ""}
          <p class="acd-spirit-mini-desc">${escapeHtml(wf.summary)}</p>
        </div>
        <button type="button" class="acd-secondary-btn" data-action="swap-wandering" data-old-id="${escapeHtml(replaceTargetId)}" data-new-slug="${escapeHtml(wf.slug)}" ${!levelMet || !loreMet || !famMet || alreadyOwned ? "disabled" : ""}>
          ${alreadyOwned ? "Equipped" : replaceTargetId ? "Swap In" : "Add"}
        </button>
      </div>
    `;
  }).join("");

  return `
    <div class="acd-section">
      <div class="acd-section-head">
        <span><i class="fa-solid fa-sun"></i> Morning Daily Preparations</span>
      </div>
      <div class="acd-btn-row">
        <button type="button" class="acd-primary-btn" data-action="save-preset">
          <i class="fa-solid fa-bookmark"></i> Save Morning Preset
        </button>
        <button type="button" class="acd-secondary-btn" data-action="apply-preset">
          <i class="fa-solid fa-play"></i> Apply Morning Preset &amp; Refresh Slots
        </button>
      </div>
      ${
        state.crafterVowLocked
          ? `<div class="acd-vow-box">
              <span><strong>Crafter's Vow Active:</strong> Must keep Crafter in the Vault attuned until your 8h crafted item is used in combat.</span>
              <button type="button" class="acd-ghost-btn" data-action="clear-crafter-vow">Mark Item Used</button>
            </div>`
          : ""
      }
    </div>

    ${shamanHtml}

    <div class="acd-section">
      <div class="acd-section-head">
        <span><i class="fa-solid fa-compass"></i> Wandering Feats (Daily Retrainable)</span>
        <span class="acd-badge">Current: ${currentWanderingItems.map((i) => escapeHtml(i.name)).join(", ") || "None"}</span>
      </div>
      <div class="acd-wandering-list">
        ${wanderingRows}
      </div>
    </div>
  `;
}

function buildGuideTabHtml(actor, state, limits) {
  const practice = limits.practice;
  const practiceHtml = practice
    ? `
      <div class="acd-section">
        <div class="acd-section-head">
          <span><i class="${escapeHtml(practice.icon)}"></i> Practice: ${escapeHtml(practice.name)}</span>
        </div>
        <p class="acd-spirit-mini-desc">${escapeHtml(practice.summary)}</p>
        ${practice.invocations
          .map(
            (inv) => `
            <div class="acd-guide-card ${limits.level >= inv.level ? "unlocked" : "locked"}">
              <strong>Lv ${inv.level} · ${escapeHtml(inv.name)} ${limits.level >= inv.level ? "&#10003;" : "(Locked)"}</strong>
              <p class="acd-spirit-mini-desc">${escapeHtml(inv.summary)}</p>
            </div>`
          )
          .join("")}
      </div>
    `
    : `<div class="acd-section"><p>No Animistic Practice detected on sheet yet.</p></div>`;

  const avatarCards = state.attuned
    .map((s) => getApparitionBySlug(s))
    .filter(Boolean)
    .map(
      (a) => `
      <div class="acd-guide-card">
        <strong><i class="${escapeHtml(a.icon)}" style="color:${escapeHtml(a.color)}"></i> ${escapeHtml(a.avatar.name)} (${escapeHtml(a.name)})</strong>
        <p class="acd-spirit-mini-desc"><strong>Speed:</strong> ${escapeHtml(a.avatar.speed)}<br/><strong>Melee:</strong> ${escapeHtml(a.avatar.melee)}<br/><strong>Ranged:</strong> ${escapeHtml(a.avatar.ranged)}</p>
      </div>`
    )
    .join("");

  return `
    ${practiceHtml}
    <div class="acd-section">
      <div class="acd-section-head">
        <span><i class="fa-solid fa-dragon"></i> Supreme Incarnation (Lv 19 Avatar Forms)</span>
      </div>
      ${avatarCards || "<p class='acd-spirit-mini-desc'>Attune apparitions to preview their unique Avatar forms.</p>"}
    </div>
  `;
}

function bindDeckDelegatedEvents(container) {
  // Header drag handling
  container.addEventListener("pointerdown", (ev) => {
    const header = ev.target.closest("[data-acd-drag]");
    if (!header || ev.target.closest("button, select, input")) return;
    dragState = {
      startX: ev.clientX,
      startY: ev.clientY,
      origLeft: uiState.posLeft,
      origTop: uiState.posTop
    };
    const onMove = (moveEv) => {
      if (!dragState || !deckElement) return;
      uiState.posLeft = Math.max(8, Math.min(window.innerWidth - 120, dragState.origLeft + (moveEv.clientX - dragState.startX)));
      uiState.posTop = Math.max(8, Math.min(window.innerHeight - 80, dragState.origTop + (moveEv.clientY - dragState.startY)));
      deckElement.style.left = `${uiState.posLeft}px`;
      deckElement.style.top = `${uiState.posTop}px`;
    };
    const onUp = () => {
      dragState = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  // Hover range preview on canvas
  container.addEventListener("mouseover", (ev) => {
    const card = ev.target.closest("[data-preview-range]");
    if (!card) return;
    const feet = Number(card.dataset.previewRange || 0);
    if (feet <= 0) return;
    const actor = resolveAnimistActor(uiState.selectedActorId);
    const tok = getActorTokenOnCanvas(actor);
    if (tok) previewSpiritRangeOnCanvas(tok, feet, card.dataset.previewColor || "#34d399");
  });

  container.addEventListener("mouseout", (ev) => {
    if (ev.target.closest("[data-preview-range]")) {
      clearSpiritRangePreview();
    }
  });

  // Input / Select changes
  container.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.dataset.action === "rep-search") {
      uiState.searchQuery = el.value;
      const selStart = el.selectionStart;
      renderSpiritDeck();
      const nextInput = deckElement?.querySelector('[data-action="rep-search"]');
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(selStart, selStart);
      }
    }
  });

  container.addEventListener("change", async (ev) => {
    const el = ev.target;
    const act = el.dataset.action;
    const actor = resolveAnimistActor(uiState.selectedActorId);
    if (act === "select-actor") {
      uiState.selectedActorId = el.value;
      renderSpiritDeck();
    } else if (act === "set-disperse-reason") {
      uiState.disperseReason = el.value;
    } else if (act === "set-wish-skill" && actor) {
      await mutateActorSpiritState(actor, (s) => {
        s.wishSkill = el.value;
        return s;
      });
    } else if (act === "set-familiar-spirit" && actor) {
      await mutateActorSpiritState(actor, (s) => {
        s.familiarSpirit = el.value || null;
        return s;
      });
      renderSpiritDeck();
    } else if (act === "set-grudge-weapon") {
      uiState.grudgeStrikeIndex = Number(el.value);
    } else if (act === "set-grudge-map") {
      uiState.grudgeMapIndex = Number(el.value);
    }
  });

  // Button click actions
  container.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("[data-action]");
    if (!btn || btn.tagName === "SELECT" || btn.tagName === "INPUT") return;
    ev.preventDefault();

    const act = btn.dataset.action;
    const actor = resolveAnimistActor(uiState.selectedActorId);

    switch (act) {
      case "close-deck":
        closeSpiritDeck();
        break;
      case "switch-tab":
        uiState.activeTab = btn.dataset.tab || "battle";
        renderSpiritDeck();
        break;
      case "filter-role":
        uiState.roleFilter = btn.dataset.role || "all";
        renderSpiritDeck();
        break;
      case "sync-sheet":
        if (actor) {
          await syncActorSheetWithState(actor, { refreshSlots: false });
          renderSpiritDeck();
        }
        break;
      case "sync-sheet-refresh":
        if (actor) {
          await syncActorSheetWithState(actor, { refreshSlots: true });
          renderSpiritDeck();
        }
        break;
      case "starter-loadout":
        if (actor) {
          await applyStarterAttunement(actor);
          renderSpiritDeck();
        }
        break;
      case "toggle-attune":
        if (actor) {
          await toggleAttunedApparition(actor, btn.dataset.slug);
          renderSpiritDeck();
        }
        break;
      case "switch-primary":
        if (actor) {
          await switchPrimaryApparition(actor, btn.dataset.slug, btn.dataset.mode || "circle");
          renderSpiritDeck();
        }
        break;
      case "cast-vessel":
        if (actor) {
          await castVesselSpell(actor, btn.dataset.slug);
          renderSpiritDeck();
        }
        break;
      case "cast-workshop-8h":
        if (actor) {
          await castVesselSpell(actor, btn.dataset.slug, { exploration8h: true });
          renderSpiritDeck();
        }
        break;
      case "sustain-vessel":
        if (actor) {
          await sustainVesselSpell(actor, btn.dataset.vesselId);
          renderSpiritDeck();
        }
        break;
      case "sustain-dancing":
        if (actor) {
          await sustainVesselSpell(actor, btn.dataset.vesselId, { dancing: true });
          renderSpiritDeck();
        }
        break;
      case "sustain-haggle":
        if (actor) {
          await sustainVesselSpell(actor, btn.dataset.vesselId, { wishChoice: "haggle" });
          renderSpiritDeck();
        }
        break;
      case "dismiss-vessel":
        if (actor) {
          await dismissVesselSpell(actor, btn.dataset.vesselId);
          renderSpiritDeck();
        }
        break;
      case "disperse-spirit":
        if (actor) {
          await disperseApparition(actor, btn.dataset.slug, uiState.disperseReason);
          renderSpiritDeck();
        }
        break;
      case "restore-spirit":
        if (actor) {
          await restoreDispersedApparition(actor, btn.dataset.slug);
          renderSpiritDeck();
        }
        break;
      case "set-focus":
        if (actor) {
          const val = Math.max(0, Number(btn.dataset.val || 0));
          await actor.update({ "system.resources.focus.value": val });
          renderSpiritDeck();
        }
        break;
      case "refocus-now":
        if (actor) {
          const cur = Number(actor.system?.resources?.focus?.value ?? 0);
          const mx = Math.max(1, Number(actor.system?.resources?.focus?.max ?? 1));
          await actor.update({ "system.resources.focus.value": Math.min(mx, cur + 1) });
          await mutateActorSpiritState(actor, (s) => {
            s.cooldowns10Min = clearObjectFlags(s.cooldowns10Min);
            s.circleUsedThisTurn = false;
            return s;
          });
          ui.notifications?.info(`${actor.name}: Refocused (+1 Focus Point & cleared 10-minute spirit cooldowns).`);
          renderSpiritDeck();
        }
        break;
      case "trigger-feat":
        if (actor) {
          await executeAnimistFeatAction(actor, btn.dataset.feat, {
            strikeIndex: uiState.grudgeStrikeIndex ?? undefined,
            mapIndex: uiState.grudgeMapIndex,
            event: ev
          });
          renderSpiritDeck();
        }
        break;
      case "roll-lore":
        if (actor) {
          await rollApparitionLore(actor, btn.dataset.lore, ev);
        }
        break;
      case "save-preset":
        if (actor) {
          await saveDailySpiritPreset(actor);
          renderSpiritDeck();
        }
        break;
      case "apply-preset":
        if (actor) {
          await applyDailySpiritPreset(actor);
          renderSpiritDeck();
        }
        break;
      case "clear-crafter-vow":
        if (actor) {
          await mutateActorSpiritState(actor, (s) => {
            s.crafterVowLocked = false;
            return s;
          });
          renderSpiritDeck();
        }
        break;
      case "toggle-familiar-incorporeal":
        if (actor) {
          await mutateActorSpiritState(actor, (s) => {
            s.familiarIncorporeal = !s.familiarIncorporeal;
            return s;
          });
          renderSpiritDeck();
        }
        break;
      case "swap-wandering":
        if (actor) {
          await swapWanderingFeat(actor, btn.dataset.oldId, btn.dataset.newSlug);
          renderSpiritDeck();
        }
        break;
      default:
        break;
    }
  });
}

export function registerUIHooks() {
  // Foundry v13 / v14 SceneControls registration (onChange ONLY per BUG-261024-01)
  Hooks.on("getSceneControlButtons", (controls) => {
    if (!shouldShowSpiritUI()) return;
    const toolDef = {
      name: "animist-spirit-deck",
      title: "PF2e Animist Spirit Deck",
      icon: "fa-solid fa-ghost",
      order: 98,
      button: true,
      visible: true,
      onChange: () => toggleSpiritDeck()
    };

    if (Array.isArray(controls)) {
      const tokenGroup = controls.find((c) => c.name === "token" || c.name === "tokens");
      if (tokenGroup && Array.isArray(tokenGroup.tools)) {
        tokenGroup.tools.push(toolDef);
      }
    } else if (controls && typeof controls === "object") {
      const tokenGroup = controls.tokens || controls.token;
      if (tokenGroup?.tools && typeof tokenGroup.tools === "object") {
        tokenGroup.tools["animist-spirit-deck"] = toolDef;
      }
    }
  });

  // Inject "Spirit Deck" button on PF2e Character Sheet
  Hooks.on("renderCharacterSheetPF2e", (sheet, html) => {
    const actor = sheet?.actor || sheet?.object;
    if (!actor || !actor.isOwner || !isAnimistActor(actor)) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".acd-sheet-open-btn")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "acd-sheet-open-btn";
    btn.innerHTML = `<i class="fa-solid fa-ghost"></i> Spirit Deck`;
    btn.title = "Open PF2e Animist Spirit Command Deck";
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      toggleSpiritDeck(true, { actorId: actor.id });
    });

    const targetBar =
      root.querySelector(".window-header .window-title") ??
      root.querySelector("aside .sidebar") ??
      root.querySelector(".char-header");
    if (targetBar) {
      targetBar.after(btn);
    }
  });

  Hooks.on("controlToken", () => {
    renderSpiritLauncherPill();
    if (uiState.isOpen) renderSpiritDeck();
  });

  Hooks.on("updateActor", (actor) => {
    if (uiState.isOpen && actor.id === uiState.selectedActorId) {
      renderSpiritDeck();
    }
    renderSpiritLauncherPill();
  });

  Hooks.on(`${MODULE_ID}.stateChanged`, () => {
    renderSpiritLauncherPill();
    if (uiState.isOpen) renderSpiritDeck();
  });
}
