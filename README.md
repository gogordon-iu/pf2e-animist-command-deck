# PF2e Animist Command Deck

Complete tactical **Spirit Command Deck HUD**, built-in **Apparition & Vessel Spell Compendium** (all 14 official *Pathfinder: War of Immortals* & *Lost Omens* Apparitions, 14 Vessel Spells, 4 Animistic Practices, and 12 Wandering Feats), **Pathmuncher-aware Sheet & Spellbook Synchronizer**, full combat automation, and visual PIXI token spirit orbs & emanation rings for **Pathfinder 2e** on **Foundry VTT v13 / v14**.

## Key Features

- **Zero External Dependencies**: Uses native Foundry VTT `socket` relay and official PF2e compendium items with self-contained Rule Element fallbacks — no extra helper modules required on local or cloud servers!
- **Pathmuncher & Manual Sheet Auto-Healer**:
  - Automatically detects existing Animist spontaneous spellcasting entries (`Animist Apparition`, `Apparition Attunement`, etc.) without duplicating them or leaving broken Pathmuncher slot ghosts.
  - Automatically creates and updates the **Vessel Spells** focus spellcasting entry, configures Focus Pool max (`Circle of Spirits` & `Dual Invocation` aware), marks Apparition spells as Signature Spells, and syncs Apparition Lore skills while preserving permanent background Lores and spent daily spell slots!
- **All 14 Official Apparitions & Vessel Spells**:
  - *Crafter in the Vault* (*Traveling Workshop* — 1A combat & 8h downtime vow), *Custodian of Groves and Gardens* (*Garden of Healing* — 10-ft `Rank`d4 vitality pulse + lingering emotion ward), *Echo of Lost Moments* (*Store Time* — bonus spirit reaction), *Impostor in Hidden Places* (*Discomfiting Whispers* — 5-ft misfortune & void backlash), *Lamentation of Sinister Deals* (*Wish Market* — `1d4` merchant price & sustain haggle), *Lurker in Devouring Dark* (*Devouring Dark Form*), *Monarch of the Fey Courts* (*Nymph's Grace* — 10-ft Will vs Confused), *Reveler in Lost Glee* (*Trickster's Mirrors* — live 1–3 mirror intercept roller & mental shatter), *Shepherd of Errant Winds* (*Gift of the Anemos* — spell-attack wind shove), *Speaker in Sibilance* (*Crown of Prophets*), *Stalker in Darkened Boughs* (*Darkened Forest Form*), *Steward of Stone and Fire* (*Earth's Bile* — repeatable 10-ft molten burst fire + bludgeoning + persistent fire basic Reflex card), *Vanguard of Roaring Waters* (*River Carving Mountains*), and *Witness to Ancient Battles* (*Embodiment of Battle*).
- **Full Practice, Feat & Combat Lifecycle Automation**:
  - **1A Circle of Spirits** & **10-Min Refocus Primary Swap** (plus Liturgist Lv 9 **Free Dancing Invocation Sustain** and Medium Lv 9 **Dual Primary Apparitions**).
  - **Shaman Spirit Familiar Manager** (`2` / `4` / `6` abilities + Lv 17 `1A` Incorporeal Form).
  - **Animist Stances, Spellshapes & Reactions**: *Grasping Spirits Spell* (with 1-click **30-ft Token Pull** on failed Fortitude save!), *Channeler's Stance* (automatically adds `+Rank` status bonus to *Earth's Bile* & *Garden of Healing* pulses!), *Channeled Protection*, *Apparition's Enhancement*, *Relinquish Control*, *Blazing Spirit*, and **Wandering Feats Daily Swapper**.
- **Visual PIXI Token Spirit Orbs & Aura Rings**: Displays Primary (emerald/gold crowned) and Attuned (amethyst) spirit orbs on the top-left of Animist tokens (never colliding with Runesmith badges!) plus live 5-ft / 10-ft Vessel Spell emanation rings.

## Installation (Cloud or Local Server)

1. In Foundry VTT Setup, open **Add-on Modules** -> **Install Module**.
2. Paste the **Manifest URL**:
   ```text
   https://github.com/gogordon-iu/pf2e-animist-command-deck/releases/latest/download/module.json
   ```
   *(Or upload the generated `pf2e-animist-command-deck-v1.0.0.zip` directly on The Forge / Molten / cloud host).*
3. Launch your PF2e world, go to **Settings** -> **Manage Modules**, and enable **PF2e Animist Command Deck**.
