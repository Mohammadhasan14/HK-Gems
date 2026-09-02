/**
 * Stone catalogue — one config object per gemstone. The hero stone is
 * swappable via the single HERO_STONE_ID value below, per the brief.
 *
 * Material fields here are wired into geometry for the hero stone as of
 * Phase 1 (materials pass) — see components/canvas/HeroStone.tsx. The other
 * five stones don't have placeholders yet; their fields stay unused targets
 * until Phase 3.
 */

export type StoneId =
  | "durr-e-najaf"
  | "firoza"
  | "aqeeq"
  | "pukhraj"
  | "zamurd"
  | "yaqoot";

export interface StoneConfig {
  id: StoneId;
  /** Trade name shown in copy. */
  name: string;
  /** Secondary line, per brief: "Each stone gets its Urdu name as a small secondary line." */
  urduName: string;
  scientificName: string;
  origin: string;
  /** Determines which material family Phase 1 assigns: MeshTransmissionMaterial vs MeshPhysicalMaterial. */
  optics: "transmissive" | "opaque";
  /** Index of refraction — only meaningful for transmissive stones. */
  ior?: number;
  /** Base tint, used for both material color and any UI accents referencing this stone. */
  color: string;
  carat?: string;
  metal?: string;
  finish?: string;
  description: string;
}

export const STONES: Record<StoneId, StoneConfig> = {
  "durr-e-najaf": {
    id: "durr-e-najaf",
    name: "Durr-e-Najaf",
    urduName: "درِ نجف",
    scientificName: "Clear Quartz",
    origin: "Najaf, Iraq",
    optics: "transmissive",
    ior: 1.54,
    color: "#f2f0ea",
    carat: "8.2 ct",
    metal: "Sterling Silver 925",
    finish: "Hand-polished bezel",
    description:
      "The hero stone. Transparent by requirement — the camera goes inside it in Beat 3.",
  },
  firoza: {
    id: "firoza",
    name: "Firoza",
    urduName: "فیروزہ",
    scientificName: "Turquoise",
    origin: "Nishapur, Iran",
    optics: "opaque",
    color: "#2f9e8f",
    description: "Nishapuri turquoise, prized for its matrix veining.",
  },
  aqeeq: {
    id: "aqeeq",
    name: "Aqeeq",
    urduName: "عقیق",
    scientificName: "Carnelian / Agate",
    origin: "Yemen",
    optics: "opaque",
    color: "#8a3324",
    description: "Yemeni carnelian, warm and banded.",
  },
  pukhraj: {
    id: "pukhraj",
    name: "Pukhraj",
    urduName: "پکھراج",
    scientificName: "Yellow Sapphire",
    origin: "Ratnapura, Sri Lanka",
    optics: "transmissive",
    ior: 1.77,
    color: "#e8b923",
    description: "Yellow sapphire, corundum family.",
  },
  zamurd: {
    id: "zamurd",
    name: "Zamurd",
    urduName: "زمرد",
    scientificName: "Emerald",
    origin: "Swat Valley, Pakistan",
    optics: "transmissive",
    ior: 1.58,
    color: "#1f7a4d",
    description: "Swat Valley emerald, richly included.",
  },
  yaqoot: {
    id: "yaqoot",
    name: "Yaqoot",
    urduName: "یاقوت",
    scientificName: "Ruby",
    origin: "Mogok, Myanmar",
    optics: "transmissive",
    ior: 1.77,
    color: "#9b1c2e",
    description: "Mogok ruby, corundum family.",
  },
};

/** Swap this one value to change the hero stone site-wide. */
export const HERO_STONE_ID: StoneId = "durr-e-najaf";
export const HERO_STONE = STONES[HERO_STONE_ID];

/** Beat 7 vitrine order — Durr-e-Najaf returns last, closing the loop. */
export const COLLECTION_ORDER: StoneId[] = [
  "firoza",
  "aqeeq",
  "pukhraj",
  "zamurd",
  "yaqoot",
  "durr-e-najaf",
];
