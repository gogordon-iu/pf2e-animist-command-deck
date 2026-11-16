/**
 * Complete Pathfinder 2e Animist Database (War of Immortals & Lost Omens)
 * Verified against PF2e Foundry VTT System v8.6.1 Compendiums.
 */

export const APPARITION_SPONTANEOUS_SLOTS = [
  // Lv 1..20 -> Ranks 1..10 (10th rank unlocked at Lv 19 via Supreme Incarnation)
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Lv 1
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Lv 2
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Lv 3
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Lv 4
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Lv 5
  [1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Lv 6
  [1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // Lv 7
  [1, 1, 1, 1, 0, 0, 0, 0, 0, 0], // Lv 8
  [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], // Lv 9
  [2, 2, 2, 1, 1, 0, 0, 0, 0, 0], // Lv 10
  [2, 2, 2, 2, 1, 1, 0, 0, 0, 0], // Lv 11
  [2, 2, 2, 2, 1, 1, 0, 0, 0, 0], // Lv 12
  [2, 2, 2, 2, 2, 1, 1, 0, 0, 0], // Lv 13
  [2, 2, 2, 2, 2, 1, 1, 0, 0, 0], // Lv 14
  [2, 2, 2, 2, 2, 2, 1, 1, 0, 0], // Lv 15
  [2, 2, 2, 2, 2, 2, 1, 1, 0, 0], // Lv 16
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 0], // Lv 17
  [2, 2, 2, 2, 2, 2, 2, 1, 1, 0], // Lv 18
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1], // Lv 19
  [2, 2, 2, 2, 2, 2, 2, 2, 1, 1]  // Lv 20
];

export const BONUS_APPARITION_SPELLS = {
  avatar: {
    name: "Avatar",
    rank: 10,
    uuid: "Compendium.pf2e.spells-srd.Item.ckUOoqOM7Kg7VqxB",
    signature: false
  },
  heal: {
    name: "Heal",
    rank: 1,
    uuid: "Compendium.pf2e.spells-srd.Item.rfZpqmj0AIIdkVIs",
    signature: true
  },
  harm: {
    name: "Harm",
    rank: 1,
    uuid: "Compendium.pf2e.spells-srd.Item.wdA52JJnsuQWeyqz",
    signature: true
  },
  animalForm: {
    name: "Animal Form",
    rank: 2,
    uuid: "Compendium.pf2e.spells-srd.Item.wp09USMB3GIW1qbp",
    signature: true
  },
  aerialForm: {
    name: "Aerial Form",
    rank: 4,
    uuid: "Compendium.pf2e.spells-srd.Item.NzXpEzcZAjuDTZjK",
    signature: true
  },
  monstrosityForm: {
    name: "Monstrosity Form",
    rank: 8,
    uuid: "Compendium.pf2e.spells-srd.Item.8AMvNVOUEtxBCDvJ",
    signature: true
  }
};

export const ANIMIST_PRACTICES = {
  shaman: {
    slug: "shaman",
    name: "Shaman",
    uuid: "Compendium.pf2e.classfeatures.Item.haYJQRVJ8RaA74nt",
    icon: "fa-solid fa-paw",
    color: "#34d399",
    summary: "Manifest one attuned apparition into physical form as a Spirit Familiar.",
    invocations: [
      { level: 1, name: "Invocation of Embodiment", summary: "Gain Spirit Familiar (Lv 1) and Enhanced Familiar (4 abilities at Lv 2). If slain or dispersed, lose that apparition's gifts until daily prep." },
      { level: 9, name: "Invocation of Growth", summary: "Gain Incredible Familiar (6 base familiar/master abilities)." },
      { level: 17, name: "Invocation of Otherworldliness", summary: "Spirit Familiar can spend 1A (concentrate) to become Incorporeal for 1 minute (precision immunity, physical resist = half level, force weakness = half level, within 60 ft)." }
    ]
  },
  liturgist: {
    slug: "liturgist",
    name: "Liturgist",
    uuid: "Compendium.pf2e.classfeatures.Item.Zz7FPvmAaOpebHbu",
    icon: "fa-solid fa-music",
    color: "#f472b6",
    summary: "Draw forth apparitions through song and dance, weaving movement into sustain.",
    invocations: [
      { level: 1, name: "Song of Invocation", summary: "Gain Circle of Spirits (1A, 1/round) to switch your Primary Apparition in combat and expand Focus Pool." },
      { level: 9, name: "Dancing Invocation", summary: "Whenever you Leap, Step, or Tumble Through, you also Sustain an apparition or vessel spell as part of that movement." },
      { level: 17, name: "Invocation of Praise", summary: "Free-action Circle of Spirits on Initiative; first-turn primary apparition cantrip costs 1 fewer action (min 1A)." }
    ]
  },
  medium: {
    slug: "medium",
    name: "Medium",
    uuid: "Compendium.pf2e.classfeatures.Item.k6c2gesVQ8QuEWGm",
    icon: "fa-solid fa-masks-theater",
    color: "#a78bfa",
    summary: "Channel dual primary apparitions and let spirits directly possess your body.",
    invocations: [
      { level: 1, name: "Invocation of Unity", summary: "Gain Relinquish Control (Free, turn start): +4 status vs controlled, +2 circumstance on Apparition Lore Recall Knowledge." },
      { level: 9, name: "Dual Invocation", summary: "Designate TWO attuned apparitions as Primary Apparitions simultaneously (unlocking both Vessel Spells and expanding Focus Pool)." },
      { level: 17, name: "Invocation of Synchronization", summary: "While Relinquishing Control: 1/round free Recall Knowledge, +2 spirit Strike damage, physical resistance = half level (spirit weakness = level)." }
    ]
  },
  seer: {
    slug: "seer",
    name: "Seer",
    uuid: "Compendium.pf2e.classfeatures.Item.NRQOorKeZ310FXuk",
    icon: "fa-solid fa-eye",
    color: "#38bdf8",
    summary: "Perceive invisible spirits, haunts, and undead while warding your soul against them.",
    invocations: [
      { level: 1, name: "Invocation of Sight", summary: "Gain Apparition Sense (30-ft imprecise sense for spirits/haunts/undead) and Spirit Ward (+1 status saves/AC vs haunts & spirits)." },
      { level: 9, name: "Invocation of Resilience", summary: "Gain vitality & void resistance equal to half your level; +2 status bonus vs haunt/undead/spirit possession & death effects." },
      { level: 17, name: "Invocation of Tranquility", summary: "Constant Truesight against spirits/haunts/undead and +1 status bonus to saves vs all divine/occult effects." }
    ]
  }
};

export const WISH_MARKET_PRICES = [
  {
    roll: 1,
    name: "Your Social Graces",
    skills: ["diplomacy", "society"],
    summary: "-2 status penalty to Diplomacy and Society checks."
  },
  {
    roll: 2,
    name: "Your Guile",
    skills: ["deception", "stealth"],
    summary: "-2 status penalty to Deception and Stealth checks."
  },
  {
    roll: 3,
    name: "Your Manual Dexterity",
    skills: ["crafting", "thievery"],
    summary: "-2 status penalty to Crafting and Thievery checks."
  },
  {
    roll: 4,
    name: "Your Higher Reasoning",
    skills: ["arcana", "medicine"],
    summary: "-2 status penalty to Arcana and Medicine checks."
  }
];

export const WISH_MARKET_BONUS_SKILLS = [
  { slug: "religion", label: "Religion" },
  { slug: "nature", label: "Nature" },
  { slug: "occultism", label: "Occultism" },
  { slug: "acrobatics", label: "Acrobatics" },
  { slug: "athletics", label: "Athletics" }
];

export const APPARITIONS_DB = [
  {
    slug: "crafter-in-the-vault",
    name: "Crafter in the Vault",
    shortName: "CR",
    uuid: "Compendium.pf2e.classfeatures.Item.csrF8UOWPl1rr6st",
    role: "utility",
    color: "#94a3b8",
    icon: "fa-solid fa-hammer",
    lores: ["Architecture", "Engineering"],
    summary: "Master of dungeons, vaults, and spectral workshops; grants Crafting/Thievery mastery and construct-shaping magic.",
    spells: [
      { rank: 0, name: "Sigil", uuid: "Compendium.pf2e.spells-srd.Item.AUctDF2fqPZN2w4W" },
      { rank: 1, name: "Mending", uuid: "Compendium.pf2e.spells-srd.Item.dINQzhqGmIsqGMUY" },
      { rank: 2, name: "Knock", uuid: "Compendium.pf2e.spells-srd.Item.6Ot4N22t5tPD51BO" },
      { rank: 3, name: "Ghostly Weapon", uuid: "Compendium.pf2e.spells-srd.Item.AMEu5zzLN7uCX645" },
      { rank: 4, name: "Creation", uuid: "Compendium.pf2e.spells-srd.Item.TUj8eugNqAvB1vVR" },
      { rank: 5, name: "Impaling Spike", uuid: "Compendium.pf2e.spells-srd.Item.oXeEbcUdgJGWHGEJ" },
      { rank: 6, name: "Wall of Metal", uuid: "Compendium.pf2e.spells-srd.Item.CB5TlGv5ZghtMifi" },
      { rank: 7, name: "Beheading Buzz Saw", uuid: "Compendium.pf2e.spells-srd.Item.dKWc83KKiXoIJkhp" },
      { rank: 8, name: "Ferrous Form", uuid: "Compendium.pf2e.spells-srd.Item.89Hj5QuqvcwVXcqj" },
      { rank: 9, name: "Resplendent Mansion", uuid: "Compendium.pf2e.spells-srd.Item.KPDHmmjJiw7PhTYF" }
    ],
    vessel: {
      slug: "traveling-workshop",
      name: "Traveling Workshop",
      uuid: "Compendium.pf2e.spells-srd.Item.rzcXUF5YmJYxgxEa",
      effectUuid: "Compendium.pf2e.spell-effects.Item.qXWCvqt24iczeN8V",
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 0,
      pulseType: "buff",
      summary: "Trained in Crafting & Thievery (Expert R3, Master R5, Legendary R9) + ephemeral alchemist/repair/thieves' toolkits. Can cast as 10-min activity for 8h workshop (locks Crafter for next daily prep until crafted item used)."
    },
    avatar: {
      name: "Incarnate Dungeon",
      speed: "Speed 50 ft, burrow 50 ft or fly 50 ft",
      melee: "dungeon trap (reach 10 ft, versatile B/P): 6d6+6 slashing + Grab",
      ranged: "deadly darts (120 ft, versatile poison): 6d6+6 piercing"
    }
  },
  {
    slug: "custodian-of-groves-and-gardens",
    name: "Custodian of Groves and Gardens",
    shortName: "CU",
    uuid: "Compendium.pf2e.classfeatures.Item.EyRHVD4h2eZYIsk5",
    role: "healer",
    color: "#22c55e",
    icon: "fa-solid fa-seedling",
    lores: ["Farming", "Herbalism"],
    summary: "Gentle spirit of sanctuaries, orchards, and flourishing life; pulses AoE vitality healing every turn.",
    spells: [
      { rank: 0, name: "Tangle Vine", uuid: "Compendium.pf2e.spells-srd.Item.uZK2BYzPnxUBnDjr" },
      { rank: 1, name: "Protector Tree", uuid: "Compendium.pf2e.spells-srd.Item.K9gI08enGtmih5X1" },
      { rank: 2, name: "Gentle Breeze", uuid: "Compendium.pf2e.spells-srd.Item.C0D2eqzTAhiKm4j9" },
      { rank: 3, name: "Safe Passage", uuid: "Compendium.pf2e.spells-srd.Item.IFuEzfmmWyNwVbhY" },
      { rank: 4, name: "Peaceful Bubble", uuid: "Compendium.pf2e.spells-srd.Item.onjZCEHs3JJJRTD0" },
      { rank: 5, name: "Truespeech", uuid: "Compendium.pf2e.spells-srd.Item.SwUiVavHKMWG7t5K" },
      { rank: 6, name: "Field of Life", uuid: "Compendium.pf2e.spells-srd.Item.x5rGOmhDRDVQPrnW" },
      { rank: 7, name: "Lifewood Cage", uuid: "Compendium.pf2e.spells-srd.Item.HES5jvGiNZZnJycK" },
      { rank: 8, name: "Moment of Renewal", uuid: "Compendium.pf2e.spells-srd.Item.4MOew29Z1oCX8O28" },
      { rank: 9, name: "Nature's Enmity", uuid: "Compendium.pf2e.spells-srd.Item.Tc5NLaMu71vrGTJQ" }
    ],
    vessel: {
      slug: "garden-of-healing",
      name: "Garden of Healing",
      uuid: "Compendium.pf2e.spells-srd.Item.w4M6Vqvq8k6MOFvj",
      effectUuid: "Compendium.pf2e.spell-effects.Item.JhxAUu3JEyERedMd",
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 10,
      pulseType: "heal-emanation",
      summary: "10-ft emanation: on Cast and first Sustain each round, heals creatures in 10 ft for (Rank)d4 HP. When dismissed, healed allies gain +1 circumstance vs emotion for 10 min."
    },
    avatar: {
      name: "Peaceful Reaches",
      speed: "Speed 60 ft, ignore difficult & greater difficult terrain",
      melee: "garden's cradle (agile, nonlethal, reach 10 ft, trip): 6d6+6 bludgeoning + Grab",
      ranged: "impose peace (120 ft, nonlethal): 6d6+6 mental"
    }
  },
  {
    slug: "echo-of-lost-moments",
    name: "Echo of Lost Moments",
    shortName: "EC",
    uuid: "Compendium.pf2e.classfeatures.Item.UbOFa3BBHO8HwLJR",
    role: "control",
    color: "#818cf8",
    icon: "fa-solid fa-hourglass-half",
    lores: ["Fortune-Telling", "Genealogy"],
    summary: "Remnant of forgotten eras and temporal ripples; manipulates time, memory, and bonus reactions.",
    spells: [
      { rank: 0, name: "Figment", uuid: "Compendium.pf2e.spells-srd.Item.0zU8CPejjQFnhZFI" },
      { rank: 1, name: "Déjà Vu", uuid: "Compendium.pf2e.spells-srd.Item.rerNA6YZsdxuJYt3" },
      { rank: 2, name: "Dispel Magic", uuid: "Compendium.pf2e.spells-srd.Item.9HpwDN4MYQJnW0LG" },
      { rank: 3, name: "Curse of Lost Time", uuid: "Compendium.pf2e.spells-srd.Item.B3eLlbaPxOYHcs1o" },
      { rank: 4, name: "Vision of Death", uuid: "Compendium.pf2e.spells-srd.Item.Jmxru8zMdYMRuO5n" },
      { rank: 5, name: "Illusory Scene", uuid: "Compendium.pf2e.spells-srd.Item.Ucf8eynbZMfUucjE" },
      { rank: 6, name: "Phantasmal Calamity", uuid: "Compendium.pf2e.spells-srd.Item.0XP2XOxT9VSiXFDr" },
      { rank: 7, name: "Retrocognition", uuid: "Compendium.pf2e.spells-srd.Item.rsZ5c0AUyywe5yoK" },
      { rank: 8, name: "Quandary", uuid: "Compendium.pf2e.spells-srd.Item.Oj1PJBMQD9vuwCv7" },
      { rank: 9, name: "Foresight", uuid: "Compendium.pf2e.spells-srd.Item.qsNeG9KZpODSACMq" }
    ],
    vessel: {
      slug: "store-time",
      name: "Store Time",
      uuid: "Compendium.pf2e.spells-srd.Item.FZMVLL7HvasjiM6D",
      effectUuid: null,
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 0,
      pulseType: "reaction-boon",
      summary: "On Cast and first Sustain each round, gain a bonus reaction usable for any animist or apparition reaction before your next turn."
    },
    avatar: {
      name: "Devourer of Lost Time",
      speed: "Speed 30 ft, fly 50 ft",
      melee: "devour potential (reach 15 ft, void): 6d10+6 void",
      ranged: "scream of loss (120 ft, void): 6d6+6 void"
    }
  },
  {
    slug: "impostor-in-hidden-places",
    name: "Impostor in Hidden Places",
    shortName: "IM",
    uuid: "Compendium.pf2e.classfeatures.Item.Gss5cYmRySgi1UxP",
    role: "debuff",
    color: "#6366f1",
    icon: "fa-solid fa-mask",
    lores: ["Fortune-Telling", "Underworld"],
    summary: "Whispering entity of secret passages and misfortune; curses nearby attackers with void-punishing bad luck.",
    spells: [
      { rank: 0, name: "Telekinetic Hand", uuid: "Compendium.pf2e.spells-srd.Item.pwzdSlJgYqN7bs2w" },
      { rank: 1, name: "Ill Omen", uuid: "Compendium.pf2e.spells-srd.Item.6ZIKB0151LUR19Rw" },
      { rank: 2, name: "Invisibility", uuid: "Compendium.pf2e.spells-srd.Item.XXqE1eY3w3z6xJCB" },
      { rank: 3, name: "Veil of Privacy", uuid: "Compendium.pf2e.spells-srd.Item.EoKBlgf6Smt8opaU" },
      { rank: 4, name: "Liminal Doorway", uuid: "Compendium.pf2e.spells-srd.Item.OM5NeD7a1CYNqy8S" },
      { rank: 5, name: "Strange Geometry", uuid: "Compendium.pf2e.spells-srd.Item.m4Mc5XbdML92BKOE" },
      { rank: 6, name: "Mislead", uuid: "Compendium.pf2e.spells-srd.Item.WPXzPl7YbMEIGWfi" },
      { rank: 7, name: "Planar Palace", uuid: "Compendium.pf2e.spells-srd.Item.vPWMEyVTreMOoFnm" },
      { rank: 8, name: "Disappearance", uuid: "Compendium.pf2e.spells-srd.Item.wfleiawxsfhpRRwf" },
      { rank: 9, name: "Phantasmagoria", uuid: "Compendium.pf2e.spells-srd.Item.MJx7DmjsWYzDZ3a4" }
    ],
    vessel: {
      slug: "discomfiting-whispers",
      name: "Discomfiting Whispers",
      uuid: "Compendium.pf2e.spells-srd.Item.t1e3U2eluRsp2izf",
      effectUuid: "Compendium.pf2e.spell-effects.Item.JfvVyMWuD8yvSrIe",
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 5,
      save: "will",
      basicSave: false,
      pulseType: "debuff-emanation",
      summary: "5-ft emanation: creatures starting turn in aura roll Will save or roll twice (take lower) on first attack; if that attack fails, they take ceil(Rank/2)d6 void damage."
    },
    avatar: {
      name: "Whisper Hiding in Shadows",
      speed: "Speed 50 ft, fly 50 ft",
      melee: "shadowed touch (reach 15 ft, versatile cold): 6d10+6 void",
      ranged: "whisper of despair (120 ft): 6d6+6 void"
    }
  },
  {
    slug: "lamentation-of-sinister-deals",
    name: "Lamentation of Sinister Deals",
    shortName: "LA",
    uuid: "Compendium.pf2e.classfeatures.Item.QWkvHt0godCcBAxG",
    role: "utility",
    color: "#e11d48",
    icon: "fa-solid fa-file-signature",
    lores: ["Legal", "Scribing"],
    summary: "Ghostly merchants and cosmic notaries trading sharp insight and precision for an esoteric price.",
    spells: [
      { rank: 0, name: "Message", uuid: "Compendium.pf2e.spells-srd.Item.vLzFcIaSXs7YTIqJ" },
      { rank: 1, name: "Sure Strike", uuid: "Compendium.pf2e.spells-srd.Item.Gb7SeieEvd0pL2Eh" },
      { rank: 2, name: "Blistering Invective", uuid: "Compendium.pf2e.spells-srd.Item.hoR6w8BqX2F35Tdx" },
      { rank: 3, name: "Hypercognition", uuid: "Compendium.pf2e.spells-srd.Item.ZYoC630tNGutgbE0" },
      { rank: 4, name: "Honeyed Words", uuid: "Compendium.pf2e.spells-srd.Item.JyxTmqjYYn63V5LY" },
      { rank: 5, name: "Breath of Life", uuid: "Compendium.pf2e.spells-srd.Item.Hnc7eGi7vyZenAIm" },
      { rank: 6, name: "Sacred Form", uuid: "Compendium.pf2e.spells-srd.Item.MMCQsh12TPaDdPbV" },
      { rank: 7, name: "Contingency", uuid: "Compendium.pf2e.spells-srd.Item.WG91Z5TiR6oO5FOw" },
      { rank: 8, name: "Moment of Renewal", uuid: "Compendium.pf2e.spells-srd.Item.4MOew29Z1oCX8O28" },
      { rank: 9, name: "Resplendent Mansion", uuid: "Compendium.pf2e.spells-srd.Item.KPDHmmjJiw7PhTYF" }
    ],
    vessel: {
      slug: "wish-market",
      name: "Wish Market",
      uuid: "Compendium.pf2e.spells-srd.Item.cYW9M2yE16dTTnCF",
      effectUuid: null,
      actions: 2,
      rangeFeet: 0,
      emanationFeet: 0,
      pulseType: "wish-market",
      summary: "2A Cast: +1 status (+2 R4, +3 R7) to Perception & 1 chosen skill + free Recall Knowledge/Seek, but roll 1d4 Merchant Price (-2 to 2 skills). On Sustain: free RK/Seek OR Haggle to suppress penalty 1 round."
    },
    avatar: {
      name: "Cosmic Notary",
      speed: "Speed 30 ft, fly 50 ft",
      melee: "burning pen (agile, reach 15 ft, versatile fire): 6d6+6 piercing",
      ranged: "exacting language (60 ft, fatal d10, mental): 6d6+6 mental"
    }
  },
  {
    slug: "lurker-in-devouring-dark",
    name: "Lurker in Devouring Dark",
    shortName: "LU",
    uuid: "Compendium.pf2e.classfeatures.Item.NNVkvA9fmyFy68ag",
    role: "striker",
    color: "#0ea5e9",
    icon: "fa-solid fa-water",
    lores: ["Ocean", "Sailing"],
    summary: "Abyssal leviathan spirit of crushing depths, freezing trenches, and grasping tentacles.",
    spells: [
      { rank: 0, name: "Caustic Blast", uuid: "Compendium.pf2e.spells-srd.Item.thAHF1zxNplLCJPO" },
      { rank: 1, name: "Grim Tendrils", uuid: "Compendium.pf2e.spells-srd.Item.k34hDOfIIMAxNL4a" },
      { rank: 2, name: "Acid Grip", uuid: "Compendium.pf2e.spells-srd.Item.9h9YCncqah6VNsKf" },
      { rank: 3, name: "Aqueous Orb", uuid: "Compendium.pf2e.spells-srd.Item.oUDNCArkQTdhllxD" },
      { rank: 4, name: "Grasp of the Deep", uuid: "Compendium.pf2e.spells-srd.Item.rwWtpZpkNYvypknx" },
      { rank: 5, name: "Wall of Ice", uuid: "Compendium.pf2e.spells-srd.Item.R5FHRv7VqyRnxg2t" },
      { rank: 6, name: "Frost Pillar", uuid: "Compendium.pf2e.spells-srd.Item.R5r4vtmlvOA8hDiF" },
      { rank: 7, name: "Hungry Depths", uuid: "Compendium.pf2e.spells-srd.Item.0EzLXIpPPH0LOKqt" },
      { rank: 8, name: "Arctic Rift", uuid: "Compendium.pf2e.spells-srd.Item.C2GYCH3TtUFqPfdX" },
      { rank: 9, name: "Implosion", uuid: "Compendium.pf2e.spells-srd.Item.4WS7HrFjwNvTn8T2" }
    ],
    vessel: {
      slug: "devouring-dark-form",
      name: "Devouring Dark Form",
      uuid: "Compendium.pf2e.spells-srd.Item.wTldMJx0vyBAehrI",
      effectUuid: "Compendium.pf2e.spell-effects.Item.Le5Sewk43o7V60nO",
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 0,
      pulseType: "morph-strike",
      summary: "Gain 10-ft reach 1d8 bludgeoning grapple tentacle (or Shark Animal Form at R2, Water Elemental Form at R5). First Sustain each round: free Grapple (or unarmed Strike in battle form)."
    },
    avatar: {
      name: "Tentacles from the Dark",
      speed: "Speed 70 ft, swim 70 ft",
      melee: "grasping tentacles (reach 30 ft): 6d10+6 bludgeoning + Grab",
      ranged: "None"
    }
  },
  {
    slug: "monarch-of-the-fey-courts",
    name: "Monarch of the Fey Courts",
    shortName: "MO",
    uuid: "Compendium.pf2e.classfeatures.Item.95maDg6AsCTLPAmS",
    role: "control",
    color: "#ec4899",
    icon: "fa-solid fa-crown",
    lores: ["Art", "Fey"],
    summary: "Regal First World sovereign of enchantment, glamour, and bewildering unearthly beauty.",
    spells: [
      { rank: 0, name: "Tangle Vine", uuid: "Compendium.pf2e.spells-srd.Item.uZK2BYzPnxUBnDjr" },
      { rank: 1, name: "Charm", uuid: "Compendium.pf2e.spells-srd.Item.vLA0q0WOK2YPuJs6" },
      { rank: 2, name: "Create Food", uuid: "Compendium.pf2e.spells-srd.Item.Mt6ZzkVX8Q4xigFq" },
      { rank: 3, name: "Enthrall", uuid: "Compendium.pf2e.spells-srd.Item.IihxWhRfpsBgQ5jS" },
      { rank: 4, name: "Suggestion", uuid: "Compendium.pf2e.spells-srd.Item.qwlh6aDgi86U3Q7H" },
      { rank: 5, name: "Hallucination", uuid: "Compendium.pf2e.spells-srd.Item.U58aQWJ47VrI36yP" },
      { rank: 6, name: "Dominate", uuid: "Compendium.pf2e.spells-srd.Item.OsOhx3TGIZ7AhD0P" },
      { rank: 7, name: "Mask of Terror", uuid: "Compendium.pf2e.spells-srd.Item.O6VQC1Bs4aSYDa6R" },
      { rank: 8, name: "Uncontrollable Dance", uuid: "Compendium.pf2e.spells-srd.Item.Jvyy6oVIQsD34MHB" },
      { rank: 9, name: "Unfathomable Song", uuid: "Compendium.pf2e.spells-srd.Item.FmNDwqMEjeTEGPrY" }
    ],
    vessel: {
      slug: "nymphs-grace",
      name: "Nymph's Grace",
      uuid: "Compendium.pf2e.spells-srd.Item.SAmyaiVKTDrUNjot",
      effectUuid: null,
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 10,
      save: "will",
      basicSave: false,
      pulseType: "confusion-emanation",
      summary: "10-ft emanation: enemies entering or starting turn in aura must succeed at a Will save or become Confused for 1 round (never harming you)."
    },
    avatar: {
      name: "Queen of the Winter Court",
      speed: "Speed 50 ft, fly 50 ft, swim 50 ft",
      melee: "queen's caress (reach 15 ft, agile): 6d10+6 mental",
      ranged: "monarch's spite (120 ft, mental, versatile cold): 6d6+6 mental"
    }
  },
  {
    slug: "reveler-in-lost-glee",
    name: "Reveler in Lost Glee",
    shortName: "RE",
    uuid: "Compendium.pf2e.classfeatures.Item.9PYHXFMmbHyp4aTL",
    role: "debuff",
    color: "#d946ef",
    icon: "fa-solid fa-masks-theater",
    lores: ["Circus", "Fortune-Telling"],
    summary: "Macabre carnival trickster of twisted mirrors, manic laughter, and mind-shattering illusions.",
    spells: [
      { rank: 0, name: "Prestidigitation", uuid: "Compendium.pf2e.spells-srd.Item.Qw3fnUlaUbnn7ipC" },
      { rank: 1, name: "Dizzying Colors", uuid: "Compendium.pf2e.spells-srd.Item.UKsIOWmMx4hSpafl" },
      { rank: 2, name: "Laughing Fit", uuid: "Compendium.pf2e.spells-srd.Item.tlSE7Ly8vi1Dgddv" },
      { rank: 3, name: "Hypnotize", uuid: "Compendium.pf2e.spells-srd.Item.K2WpC3FFoHrqX9Q5" },
      { rank: 4, name: "Confusion", uuid: "Compendium.pf2e.spells-srd.Item.LiGbewa9pO0yjbsY" },
      { rank: 5, name: "Illusory Scene", uuid: "Compendium.pf2e.spells-srd.Item.Ucf8eynbZMfUucjE" },
      { rank: 6, name: "Vibrant Pattern", uuid: "Compendium.pf2e.spells-srd.Item.RQjSQVZRG497cJhX" },
      { rank: 7, name: "Warp Mind", uuid: "Compendium.pf2e.spells-srd.Item.8kJbiBEjMWG4VUjs" },
      { rank: 8, name: "Quandary", uuid: "Compendium.pf2e.spells-srd.Item.Oj1PJBMQD9vuwCv7" },
      { rank: 9, name: "Wails of the Damned", uuid: "Compendium.pf2e.spells-srd.Item.FEsuyf203wTNE2et" }
    ],
    vessel: {
      slug: "tricksters-mirrors",
      name: "Trickster's Mirrors",
      uuid: "Compendium.pf2e.spells-srd.Item.cuKVbWWNzJj1GDpZ",
      effectUuid: null,
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 0,
      save: "will",
      basicSave: true,
      pulseType: "mirrors",
      summary: "Start with 1 mirror (+1 per Sustain, max 3). Intercepts hits (50% / 67% / 75%); shattered mirror deals (Rank)d4 mental damage (basic Will save) to adjacent attacker!"
    },
    avatar: {
      name: "Ringmaster of the Dark Celebration",
      speed: "Speed 50 ft, ignore difficult & greater difficult terrain",
      melee: "ringmaster's whip (reach 15 ft, trip): 6d10+6 slashing",
      ranged: "feast of the lost (120 ft, acid, versatile void): 6d6+6 acid"
    }
  },
  {
    slug: "shepherd-of-errant-winds",
    name: "Shepherd of Errant Winds",
    shortName: "SH",
    uuid: "Compendium.pf2e.classfeatures.Item.aFVxfp7uQ0ac87GN",
    role: "mobility",
    color: "#38bdf8",
    icon: "fa-solid fa-wind",
    lores: ["Sailing", "Scouting"],
    summary: "Wandering gale spirit of boundless skies; propels your steps and buffets nearby enemies off-balance.",
    spells: [
      { rank: 0, name: "Slashing Gust", uuid: "Compendium.pf2e.spells-srd.Item.1Yoipc5jNcMehtEW" },
      { rank: 1, name: "Tailwind", uuid: "Compendium.pf2e.spells-srd.Item.KcLVELhCUcKXxiKE" },
      { rank: 2, name: "Propulsive Breeze", uuid: "Compendium.pf2e.spells-srd.Item.jlOAXuIOM3YxZKmn" },
      { rank: 3, name: "Wall of Wind", uuid: "Compendium.pf2e.spells-srd.Item.it4ZsAi6XgvGcodc" },
      { rank: 4, name: "Vapor Form", uuid: "Compendium.pf2e.spells-srd.Item.V8wXOsoejQhe6CyG" },
      { rank: 5, name: "Scouting Eye", uuid: "Compendium.pf2e.spells-srd.Item.Ek5XI0aEdZhBgm21" },
      { rank: 6, name: "Mislead", uuid: "Compendium.pf2e.spells-srd.Item.WPXzPl7YbMEIGWfi" },
      { rank: 7, name: "Vacuum", uuid: "Compendium.pf2e.spells-srd.Item.kk7JKox6MdGAWmCH" },
      { rank: 8, name: "Punishing Winds", uuid: "Compendium.pf2e.spells-srd.Item.wi405lBjPcbF1DeR" },
      { rank: 9, name: "Wrathful Storm", uuid: "Compendium.pf2e.spells-srd.Item.yLJROsQtyrPIKcDx" }
    ],
    vessel: {
      slug: "gift-of-the-anemos",
      name: "Gift of the Anemos",
      uuid: "Compendium.pf2e.spells-srd.Item.x2Gf3lt64eoMocMd",
      effectUuid: null,
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 10,
      save: "reflex",
      basicSave: false,
      pulseType: "wind-emanation",
      summary: "10-ft emanation: on Cast/Sustain, free Step, 10-ft Jump, or Shove using Spell Attack! Enemies in aura that crit-fail a Strike vs you roll Reflex or become Off-Guard."
    },
    avatar: {
      name: "Will of the Winds",
      speed: "Speed 40 ft, fly 70 ft, ignore difficult & greater difficult terrain",
      melee: "air blast (reach 20 ft, air): 6d8+6 bludgeoning",
      ranged: "thunderclap (120 ft, electricity, versatile sonic): 6d6+3 electricity"
    }
  },
  {
    slug: "speaker-in-sibilance",
    name: "Speaker in Sibilance",
    shortName: "SP",
    uuid: "Compendium.pf2e.classfeatures.Item.2XlUg9JXtwnSbWOY",
    role: "debuff",
    color: "#84cc16",
    icon: "fa-solid fa-staff-snake",
    lores: ["Fortune-Telling", "Mountain"],
    summary: "Serpentine oracle of venomous prophecies, petrifying gazes, and competing whispers of forbidden truth.",
    spells: [
      { rank: 0, name: "Puff of Poison", uuid: "Compendium.pf2e.spells-srd.Item.D7ZEhTNIDWDLC2J4" },
      { rank: 1, name: "Ill Omen", uuid: "Compendium.pf2e.spells-srd.Item.6ZIKB0151LUR19Rw" },
      { rank: 2, name: "Stupefy", uuid: "Compendium.pf2e.spells-srd.Item.CQb8HtQ1BPeZmu9h" },
      { rank: 3, name: "Hypercognition", uuid: "Compendium.pf2e.spells-srd.Item.ZYoC630tNGutgbE0" },
      { rank: 4, name: "Snake Fangs", uuid: "Compendium.pf2e.spells-srd.Item.wLWMswY7aBHEFTRb" },
      { rank: 5, name: "Slither", uuid: "Compendium.pf2e.spells-srd.Item.xFp4EwVcYwSG336t" },
      { rank: 6, name: "Petrify", uuid: "Compendium.pf2e.spells-srd.Item.znv4ECL7ZtuiagtA" },
      { rank: 7, name: "Mask of Terror", uuid: "Compendium.pf2e.spells-srd.Item.O6VQC1Bs4aSYDa6R" },
      { rank: 8, name: "Unrelenting Observation", uuid: "Compendium.pf2e.spells-srd.Item.y2cQYLr5mljDSu1G" },
      { rank: 9, name: "Unfathomable Song", uuid: "Compendium.pf2e.spells-srd.Item.FmNDwqMEjeTEGPrY" }
    ],
    vessel: {
      slug: "crown-of-prophets",
      name: "Crown of Prophets",
      uuid: "Compendium.pf2e.spells-srd.Item.h2DLv8TQV0Z83tQp",
      effectUuid: "Compendium.pf2e.spell-effects.Item.C2jiokGoehvLu0fi",
      actions: 1,
      rangeFeet: 15,
      emanationFeet: 0,
      save: "fortitude",
      basicSave: true,
      pulseType: "crown-of-prophets",
      summary: "Gain 1d6 agile finesse fangs (versatile poison). First Cast/Sustain each round: free Serpentine Advice (Recall Knowledge w/ Dubious Knowledge) OR Toxic Prophecy ((Rank+1)d4 poison basic Fort save vs foe in 15 ft that damaged you)."
    },
    avatar: {
      name: "Medusa of Merciless Mysteries",
      speed: "Speed 60 ft, climb 60 ft",
      melee: "biting hair (reach 15 ft, poison): 6d6+6 piercing + 2d6 persistent poison",
      ranged: "jarring prophecy (120 ft, mental, versatile sonic): 6d6+3 mental"
    }
  },
  {
    slug: "stalker-in-darkened-boughs",
    name: "Stalker in Darkened Boughs",
    shortName: "ST",
    uuid: "Compendium.pf2e.classfeatures.Item.ImJ09rEZW5WtS26L",
    role: "striker",
    color: "#16a34a",
    icon: "fa-solid fa-paw",
    lores: ["Forest", "Hunting"],
    summary: "Apex primeval predator of shadowed canopies; shifts effortlessly between feral battle forms.",
    spells: [
      { rank: 0, name: "Gouging Claw", uuid: "Compendium.pf2e.spells-srd.Item.MPxbKoR54gkYkqLO" },
      { rank: 1, name: "Runic Body", uuid: "Compendium.pf2e.spells-srd.Item.EE7Q5BHIrfWNCPtT" },
      { rank: 2, name: "Vomit Swarm", uuid: "Compendium.pf2e.spells-srd.Item.cB17yFc9456Pyfec" },
      { rank: 3, name: "Wall of Thorns", uuid: "Compendium.pf2e.spells-srd.Item.KsWhliKfUs3IpW3c" },
      { rank: 4, name: "Bestial Curse", uuid: "Compendium.pf2e.spells-srd.Item.VuPDHoVEPLbMfCJC" },
      { rank: 5, name: "Moon Frenzy", uuid: "Compendium.pf2e.spells-srd.Item.YtesyvfAIwXOqISq" },
      { rank: 6, name: "Tangling Creepers", uuid: "Compendium.pf2e.spells-srd.Item.JbAcSLu62TU1OgNF" },
      { rank: 7, name: "Unfettered Pack", uuid: "Compendium.pf2e.spells-srd.Item.bVtkBJvGLP69qVGI" },
      { rank: 8, name: "Monstrosity Form", uuid: "Compendium.pf2e.spells-srd.Item.8AMvNVOUEtxBCDvJ" },
      { rank: 9, name: "Wrathful Storm", uuid: "Compendium.pf2e.spells-srd.Item.yLJROsQtyrPIKcDx" }
    ],
    vessel: {
      slug: "darkened-forest-form",
      name: "Darkened Forest Form",
      uuid: "Compendium.pf2e.spells-srd.Item.BhJtCTLbngvZm8EA",
      effectUuid: null,
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 0,
      pulseType: "polymorph-shift",
      summary: "Polymorph into Pest Form (R1), Animal Form (R2+), Elemental Form (R5+), Bat/Bird Aerial Form (Wind Seeker), or Phoenix Form (Monstrous Inclinations R8). Shift form on each Sustain!"
    },
    avatar: {
      name: "Beast of the Boughs",
      speed: "Speed 70 ft, fly 70 ft",
      melee: "devouring jaws (reach 15 ft, deadly 3d10): 6d10+6 piercing",
      ranged: "None"
    }
  },
  {
    slug: "steward-of-stone-and-fire",
    name: "Steward of Stone and Fire",
    shortName: "SF",
    uuid: "Compendium.pf2e.classfeatures.Item.ILGq8LQBnwsAz2jK",
    role: "blaster",
    color: "#f97316",
    icon: "fa-solid fa-fire-flame-curved",
    lores: ["Mountain", "Volcano"],
    summary: "Volcanic titan of magma, tectonic fury, and repeatable molten bursts every single round.",
    spells: [
      { rank: 0, name: "Ignition", uuid: "Compendium.pf2e.spells-srd.Item.6DfLZBl8wKIV03Iq" },
      { rank: 1, name: "Interposing Earth", uuid: "Compendium.pf2e.spells-srd.Item.HokKyQl5g655xx9U" },
      { rank: 2, name: "Exploding Earth", uuid: "Compendium.pf2e.spells-srd.Item.v89KwyaBd6g5rWVS" },
      { rank: 3, name: "Fireball", uuid: "Compendium.pf2e.spells-srd.Item.sxQZ6yqTn0czJxVd" },
      { rank: 4, name: "Wall of Fire", uuid: "Compendium.pf2e.spells-srd.Item.IarZrgCeaiUqOuRu" },
      { rank: 5, name: "Wall of Stone", uuid: "Compendium.pf2e.spells-srd.Item.kOa055FIrO9Smnya" },
      { rank: 6, name: "Petrify", uuid: "Compendium.pf2e.spells-srd.Item.znv4ECL7ZtuiagtA" },
      { rank: 7, name: "Volcanic Eruption", uuid: "Compendium.pf2e.spells-srd.Item.O7ZEqWjwdKyo2CUv" },
      { rank: 8, name: "Earthquake", uuid: "Compendium.pf2e.spells-srd.Item.x7SPrsRxGb2Vy2nu" },
      { rank: 9, name: "Falling Stars", uuid: "Compendium.pf2e.spells-srd.Item.jrBa9deU2ULFWvSl" }
    ],
    vessel: {
      slug: "earths-bile",
      name: "Earth's Bile",
      uuid: "Compendium.pf2e.spells-srd.Item.PrlR2sLWeiuTcPF2",
      effectUuid: null,
      actions: 1,
      rangeFeet: 30,
      areaBurstFeet: 10,
      emanationFeet: 0,
      save: "reflex",
      basicSave: true,
      pulseType: "earths-bile",
      summary: "30-ft range, 10-ft burst on Cast & first Sustain each round: ceil(Rank/2)d4 fire + ceil(Rank/2)d4 bludgeoning + ceil(Rank/2) persistent fire (basic Reflex save; persistent negated on success)."
    },
    avatar: {
      name: "Blood of Planets",
      speed: "Speed 50 ft, burrow 50 ft, ignore difficult & greater difficult terrain",
      melee: "avalanche of molten stone (reach 15 ft, versatile B): 6d10+6 fire",
      ranged: "cleansing eruption (120 ft, fire): 6d6+6 fire"
    }
  },
  {
    slug: "vanguard-of-roaring-waters",
    name: "Vanguard of Roaring Waters",
    shortName: "VA",
    uuid: "Compendium.pf2e.classfeatures.Item.M3q0KIyuMvSgUZH7",
    role: "mobility",
    color: "#06b6d4",
    icon: "fa-solid fa-water",
    lores: ["Mountain", "River"],
    summary: "Surging cataract spirit granting mist cover, +10-ft Speeds, and crashing river Strides.",
    spells: [
      { rank: 0, name: "Rousing Splash", uuid: "Compendium.pf2e.spells-srd.Item.zhDIiQlJmrd4UDNC" },
      { rank: 1, name: "Hydraulic Push", uuid: "Compendium.pf2e.spells-srd.Item.jfVCuOpzC6mUrf6f" },
      { rank: 2, name: "Mist", uuid: "Compendium.pf2e.spells-srd.Item.9XHmC2JgTUIQ1CCm" },
      { rank: 3, name: "Crashing Wave", uuid: "Compendium.pf2e.spells-srd.Item.T4QKmtYPeCgYxVGe" },
      { rank: 4, name: "Hydraulic Torrent", uuid: "Compendium.pf2e.spells-srd.Item.Y3G6Y6EDgCY0s3fq" },
      { rank: 5, name: "Control Water", uuid: "Compendium.pf2e.spells-srd.Item.zfn5RqAdF63neqpP" },
      { rank: 6, name: "Personal Ocean", uuid: "Compendium.pf2e.spells-srd.Item.K2bTUhucPyhXlzjw" },
      { rank: 7, name: "Dancing Fountain", uuid: "Compendium.pf2e.spells-srd.Item.smiVuoFMSgY2FTOO" },
      { rank: 8, name: "Whirlpool", uuid: "Compendium.pf2e.spells-srd.Item.0fjz8qc9NfkmWmJZ" },
      { rank: 9, name: "Wrathful Storm", uuid: "Compendium.pf2e.spells-srd.Item.yLJROsQtyrPIKcDx" }
    ],
    vessel: {
      slug: "river-carving-mountains",
      name: "River Carving Mountains",
      uuid: "Compendium.pf2e.spells-srd.Item.ew4ToaTU3o8ahKio",
      effectUuid: "Compendium.pf2e.spell-effects.Item.aaA6cgroFMRMsisy",
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 0,
      pulseType: "stride-wake",
      summary: "Gain +10-ft status bonus to all Speeds and lesser cover vs ranged attacks. On Cast and each Sustain: Stride/Swim/Climb/Fly/Burrow up to Speed, leaving difficult terrain wake!"
    },
    avatar: {
      name: "River that Splits the World",
      speed: "Speed 50 ft, swim 70 ft",
      melee: "parting mountains (reach 15 ft, versatile S, water): 6d10+6 bludgeoning",
      ranged: "crash into the sea (120 ft, versatile P, water): 6d6+6 bludgeoning"
    }
  },
  {
    slug: "witness-to-ancient-battles",
    name: "Witness to Ancient Battles",
    shortName: "WI",
    uuid: "Compendium.pf2e.classfeatures.Item.k9P2mXRjyy5X24rH",
    role: "striker",
    color: "#eab308",
    icon: "fa-solid fa-shield-halved",
    lores: ["Battlegrounds", "Heraldry"],
    summary: "Valorous spirit of fallen champions; imparts martial weapon mastery, status bonuses, and Reactive Strike.",
    spells: [
      { rank: 0, name: "Shield", uuid: "Compendium.pf2e.spells-srd.Item.TVKNbcgTee19PXZR" },
      { rank: 1, name: "Sure Strike", uuid: "Compendium.pf2e.spells-srd.Item.Gb7SeieEvd0pL2Eh" },
      { rank: 2, name: "Enlarge", uuid: "Compendium.pf2e.spells-srd.Item.wzctak6BxOW8xvFV" },
      { rank: 3, name: "Ghostly Weapon", uuid: "Compendium.pf2e.spells-srd.Item.AMEu5zzLN7uCX645" },
      { rank: 4, name: "Weapon Storm", uuid: "Compendium.pf2e.spells-srd.Item.8M03UxGXjYyDFAoy" },
      { rank: 5, name: "Invoke Spirits", uuid: "Compendium.pf2e.spells-srd.Item.hghGRzOSzEl4UXdS" },
      { rank: 6, name: "Phantasmal Calamity", uuid: "Compendium.pf2e.spells-srd.Item.0XP2XOxT9VSiXFDr" },
      { rank: 7, name: "True Target", uuid: "Compendium.pf2e.spells-srd.Item.AlbpWWN87yGegoAF" },
      { rank: 8, name: "Canticle of Everlasting Grief", uuid: "Compendium.pf2e.spells-srd.Item.qlxM7Ik3uUeUIOcv" },
      { rank: 9, name: "Weapon of Judgment", uuid: "Compendium.pf2e.spells-srd.Item.ZqmP9gijBmK7y8Xy" }
    ],
    vessel: {
      slug: "embodiment-of-battle",
      name: "Embodiment of Battle",
      uuid: "Compendium.pf2e.spells-srd.Item.X4On99Nti8gjWywG",
      effectUuid: "Compendium.pf2e.spell-effects.Item.uiXWJVwWuMS3KvkV",
      actions: 1,
      rangeFeet: 0,
      emanationFeet: 0,
      pulseType: "battle-trance",
      summary: "Martial proficiency matches simple, +1 status (+2 R4, +3 R7) to weapon/unarmed attack & damage rolls, and gain Reactive Strike (-2 status to spell attack & spell DC)."
    },
    avatar: {
      name: "General of Endless Battle",
      speed: "Speed 70 ft, immune to Immobilized",
      melee: "final strike (agile, fatal d12, reach 15 ft): 6d8+6 slashing",
      ranged: "None"
    }
  }
];

export const WANDERING_FEATS_DB = [
  {
    slug: "apparition-stabilization",
    name: "Apparition Stabilization",
    level: 6,
    uuid: "Compendium.pf2e.feats-srd.Item.wEMZv0MIBktiwgxH",
    loresRequired: [],
    summary: "DC 15 flat check (DC 13 at Lv 7, DC 10 at Lv 15) to prevent reactions from disrupting your spellcasting."
  },
  {
    slug: "blazing-spirit",
    name: "Blazing Spirit",
    level: 6,
    uuid: "Compendium.pf2e.feats-srd.Item.kRERboV7vHN6EiTt",
    loresRequired: ["Battlegrounds", "Volcano"],
    summary: "Reaction (1/10 min) on melee hit: gain resistance = level and deal 1d6 fire + 1 persistent fire (2d6/2 at Lv 12, 3d6/3 at Lv 18)."
  },
  {
    slug: "grudge-strike",
    name: "Grudge Strike",
    level: 6,
    uuid: "Compendium.pf2e.feats-srd.Item.ii7aCMN4WPQo3N3l",
    loresRequired: ["Heraldry", "Underworld"],
    summary: "2A melee Strike with +2 circumstance to hit and +2d6 void damage (+2d6 vitality vs undead/void-healing)."
  },
  {
    slug: "mediums-awareness",
    name: "Medium's Awareness",
    level: 6,
    uuid: "Compendium.pf2e.feats-srd.Item.laAcB3bauWQxxdAo",
    loresRequired: [],
    summary: "+2 status bonus (+3 Lv 12, +4 Lv 20) to Perception checks to Seek and Perception Initiative rolls."
  },
  {
    slug: "roaring-heart",
    name: "Roaring Heart",
    level: 6,
    uuid: "Compendium.pf2e.feats-srd.Item.F6TIEmYYJGmVhMXl",
    effectUuid: "Compendium.pf2e.feat-effects.Item.K2hqRFjGMX0GCIUi",
    loresRequired: ["Mountain"],
    summary: "2A: Stride twice, Shove up to 2 adjacent foes; grant self & allies in 30 ft temp HP = half level (1 Shove) or full level (2 Shoves)."
  },
  {
    slug: "apparition-cloud",
    name: "Apparition Cloud",
    level: 12,
    uuid: "Compendium.pf2e.feats-srd.Item.lGB1C4r2EtqDY9oy",
    requiresFamiliar: true,
    loresRequired: [],
    summary: "Reaction when attacked (familiar adjacent): become Concealed, protect familiar, and make adjacent squares difficult terrain."
  },
  {
    slug: "shadows-within-shadows",
    name: "Shadows Within Shadows",
    level: 12,
    uuid: "Compendium.pf2e.feats-srd.Item.nBsd828H7AnVRV6r",
    loresRequired: ["Hunting", "Underworld"],
    summary: "Reaction: force foe Seeking you or counteracting your concealment/invisibility to reroll and take the lower result."
  },
  {
    slug: "whispers-of-warning",
    name: "Whispers of Warning",
    level: 12,
    uuid: "Compendium.pf2e.feats-srd.Item.EWMHFtF9pAsRsJwX",
    loresRequired: [],
    summary: "Reaction (1/10 min) when hit (not crit): force attacker to reroll attack roll and take the lower result."
  },
  {
    slug: "forests-heart",
    name: "Forest's Heart",
    level: 16,
    uuid: "Compendium.pf2e.feats-srd.Item.2LjTxYTlRL7RwhOS",
    loresRequired: ["Forest", "Herbalism"],
    summary: "1A Stance: wispy vine unarmed attack with 15-ft reach, grapple, and finesse."
  },
  {
    slug: "jesters-gambol",
    name: "Jester's Gambol",
    level: 16,
    uuid: "Compendium.pf2e.feats-srd.Item.dzPwwXHW5NzYGG5h",
    loresRequired: ["Circus", "Fey"],
    summary: "1A Stance: Tumble Through gains +2 status and triggers tricky repositioning."
  },
  {
    slug: "monstrous-inclinations",
    name: "Monstrous Inclinations",
    level: 16,
    uuid: "Compendium.pf2e.feats-srd.Item.VO2uOVrjIr7ZAjkX",
    loresRequired: ["Forest", "Ocean"],
    summary: "Adds Monstrosity Form (8th) to apparition repertoire when attuned to Forest or Ocean Lore spirit."
  },
  {
    slug: "spiritual-spellshape-stance",
    name: "Spiritual Spellshape Stance",
    level: 16,
    uuid: "Compendium.pf2e.feats-srd.Item.bTfz7ZkPQcGpJ8FZ",
    loresRequired: [],
    summary: "1A Stance: 1/turn use a 1A spellshape feat as a Free Action on spells dealing spirit, vitality, or void damage."
  }
];

export const COMBAT_FEAT_ACTIONS = [
  {
    slug: "channelers-stance",
    name: "Channeler's Stance",
    actions: "1A",
    effectUuid: "Compendium.pf2e.feat-effects.Item.BZPPcHtYugsNKz4Z",
    summary: "Stance: +Rank status bonus to energy damage of apparition/vessel spells and initial vitality/void spell healing."
  },
  {
    slug: "channeled-protection",
    name: "Channeled Protection",
    actions: "1A",
    effectUuid: "Compendium.pf2e.feat-effects.Item.UookwOq46zEokGOM",
    summary: "In Channeler's Stance after slot spell: +1 status (+2 if R7+) to AC & Reflex for self and adjacent allies for 1 round."
  },
  {
    slug: "grasping-spirits-spell",
    name: "Grasping Spirits Spell",
    actions: "1A",
    cooldownKey: "grasping-spirits-spell",
    summary: "1/10 min Spellshape: +30 ft single-target spell range (touch -> 30 ft); target rolls Fortitude vs Spell DC or is pulled up to 30 ft toward you!"
  },
  {
    slug: "spiritual-expansion-spell",
    name: "Spiritual Expansion Spell",
    actions: "1A",
    summary: "Spellshape: +5 ft radius to >=10-ft burst, +5/+10 ft to cone/line, or dedicate primary spirit for +5 ft sustained emanation."
  },
  {
    slug: "apparitions-enhancement",
    name: "Apparition's Enhancement",
    actions: "Free",
    effectUuid: "Compendium.pf2e.feat-effects.Item.C1SVTVEwhKpqSs6B",
    summary: "1/turn after casting a non-cantrip spell: +1d6 spirit damage + divine trait on weapon/unarmed Strikes until end of turn."
  },
  {
    slug: "relinquish-control",
    name: "Relinquish Control",
    actions: "Free",
    effectUuid: "Compendium.pf2e.feat-effects.Item.6M6JRjWjJy0rwtX2",
    summary: "Turn start: +4 status vs controlled, +2 circumstance on Apparition Lore Recall Knowledge (Lv 17 Medium: +2 spirit Strike dmg & physical resist)."
  },
  {
    slug: "blazing-spirit",
    name: "Blazing Spirit",
    actions: "Reaction",
    cooldownKey: "blazing-spirit",
    summary: "1/10 min on melee hit: resistance = level + deal 1d6/2d6/3d6 fire & 1/2/3 persistent fire to attacker."
  },
  {
    slug: "grudge-strike",
    name: "Grudge Strike",
    actions: "2A",
    summary: "Melee Strike with +2 circumstance to attack and +2d6 void (or +2d6 vitality vs undead)."
  },
  {
    slug: "roaring-heart",
    name: "Roaring Heart",
    actions: "2A",
    effectUuid: "Compendium.pf2e.feat-effects.Item.K2hqRFjGMX0GCIUi",
    summary: "Stride twice + Shove up to 2 foes; grant temp HP (half or full level) in 30-ft emanation."
  },
  {
    slug: "whispers-of-warning",
    name: "Whispers of Warning",
    actions: "Reaction",
    cooldownKey: "whispers-of-warning",
    summary: "1/10 min when hit (not crit): attacker rerolls and takes lower result."
  }
];

const APPARITION_MAP = new Map(APPARITIONS_DB.map((a) => [a.slug, a]));
const APPARITION_BY_UUID = new Map(APPARITIONS_DB.map((a) => [a.uuid, a]));

export function getApparitionBySlug(slug) {
  return APPARITION_MAP.get(slug) ?? null;
}

export function getApparitionByUuid(uuid) {
  return APPARITION_BY_UUID.get(uuid) ?? null;
}

export function getAllApparitionLoreNames() {
  const set = new Set();
  for (const app of APPARITIONS_DB) {
    for (const lore of app.lores) {
      set.add(lore.toLowerCase());
      set.add(`${lore.toLowerCase()} lore`);
    }
  }
  return set;
}

export function getAllKnownApparitionSpellUuids() {
  const uuids = new Set();
  for (const app of APPARITIONS_DB) {
    for (const sp of app.spells) {
      if (sp.uuid) uuids.add(sp.uuid);
    }
    if (app.vessel?.uuid) uuids.add(app.vessel.uuid);
  }
  for (const b of Object.values(BONUS_APPARITION_SPELLS)) {
    if (b.uuid) uuids.add(b.uuid);
  }
  return uuids;
}

export function detectActorPractice(actor) {
  if (!actor?.items) return null;
  for (const p of Object.values(ANIMIST_PRACTICES)) {
    const found = actor.items.some(
      (i) => i.slug === p.slug || i.system?.slug === p.slug || i.sourceId === p.uuid
    );
    if (found) return p;
  }
  return null;
}

export function actorHasFeat(actor, slugOrUuid) {
  if (!actor?.items) return false;
  return actor.items.some(
    (i) =>
      i.slug === slugOrUuid ||
      i.system?.slug === slugOrUuid ||
      i.sourceId === slugOrUuid ||
      i._stats?.compendiumSource === slugOrUuid
  );
}

export function getAnimistLimits(actor) {
  const level = Math.max(1, Number(actor?.system?.details?.level?.value ?? actor?.level ?? 1));
  const isFullAnimist =
    actor?.class?.slug === "animist" ||
    Boolean(actor?.rollOptions?.all?.["class:animist"]) ||
    actorHasFeat(actor, "Compendium.pf2e.classfeatures.Item.AHMjKkIx21AoMc9W") ||
    actorHasFeat(actor, "apparition-attunement");

  const practice = detectActorPractice(actor);
  const hasThird = isFullAnimist && (level >= 7 || actorHasFeat(actor, "third-apparition"));
  const hasFourth = isFullAnimist && (level >= 15 || actorHasFeat(actor, "fourth-apparition"));
  const maxAttuned = isFullAnimist ? 2 + (hasThird ? 1 : 0) + (hasFourth ? 1 : 0) : 1;

  const isDualPrimary = practice?.slug === "medium" && level >= 9;
  const maxPrimary = isDualPrimary ? 2 : 1;

  const maxRank = Math.max(1, Math.min(10, Math.ceil(level / 2)));
  const loreRank = level >= 16 ? 3 : level >= 8 ? 2 : 1;
  const hasSupremeIncarnation = isFullAnimist && (level >= 19 || actorHasFeat(actor, "supreme-incarnation"));
  const hasCircleOfSpirits =
    practice?.slug === "liturgist" ||
    actorHasFeat(actor, "circle-of-spirits") ||
    actorHasFeat(actor, "Compendium.pf2e.feats-srd.Item.M8jbV0il124Ve5oV");

  const hasSpiritFamiliar =
    practice?.slug === "shaman" ||
    actorHasFeat(actor, "spirit-familiar-animist") ||
    actorHasFeat(actor, "Compendium.pf2e.feats-srd.Item.8VvRnIQI2x9bmlmQ");

  let familiarAbilities = 0;
  if (hasSpiritFamiliar) {
    if (level >= 9 && practice?.slug === "shaman") familiarAbilities = 6;
    else if (actorHasFeat(actor, "incredible-familiar-animist") || actorHasFeat(actor, "incredible-familiar")) familiarAbilities = 6;
    else if (actorHasFeat(actor, "enhanced-familiar") || (practice?.slug === "shaman" && level >= 2)) familiarAbilities = 4;
    else familiarAbilities = 2;
  }

  const slotRow = APPARITION_SPONTANEOUS_SLOTS[Math.min(20, Math.max(1, level)) - 1];

  return {
    level,
    isFullAnimist,
    practice,
    maxAttuned,
    maxPrimary,
    maxRank,
    loreRank,
    hasSupremeIncarnation,
    hasCircleOfSpirits,
    hasSpiritFamiliar,
    familiarAbilities,
    spontaneousSlots: slotRow
  };
}
