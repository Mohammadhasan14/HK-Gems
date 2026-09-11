/** The visible reference is the only source of journey content and order. */
export const SCENES = [
  { id: "earth", eyebrow: "IN THE MATTER", title: ["The Life"], italic: "of a Stone.",
    lines: ["Born in the Earth.", "Matured in Time.", "Made for a Lifetime."],
    qualities: ["RAW", "NATURAL", "REAL"] },
  { id: "discovery", eyebrow: "A JOURNEY WITHIN", title: ["From the Earth.", "From Time."], italic: "From Depth.",
    lines: ["More than a stone.", "A story of nature, a record", "of time, and a rare beauty", "shaped in silence", "— for real people."],
    qualities: ["NATURAL", "RARE", "ALIVE"] },
  { id: "shedding", eyebrow: "IN HUMAN HANDS", title: ["Shaped by Hand."], italic: "Guided by Expertise.",
    lines: ["Each stone is carefully", "revealed, with patience,", "skill, and a deep respect for", "what nature has created", "but a story."],
    qualities: ["SKILL", "CARE", "TRADITION"] },
  { id: "refinement", eyebrow: "LIGHT WITHIN", title: ["Precision"], italic: "Reveals Light.",
    lines: ["Through careful refinement,", "hidden beauty emerges.", "Natural patterns, unique", "in every stone, begin to shine", "— a character only time", "could create."],
    qualities: ["REFINE", "REVEAL", "UNIQUE"] },
  { id: "masterpiece", eyebrow: "A RARE BEAUTY", title: ["A Singular"], italic: "Masterpiece.",
    lines: ["Nature’s art, perfected", "by human hands.", "No two stones are the same.", "A timeless expression", "of earth, time, and craftsmanship", "— made to be yours."],
    qualities: ["EXCEPTIONAL", "TIMELESS", "YOURS"] },
  { id: "meaning", eyebrow: "TO BE WORN FOREVER", title: ["A Lifetime"], italic: "of Meaning.",
    lines: ["More than a ring — a connection", "to something real. A piece of earth.", "A story on your hand. A legacy", "in your story."],
    qualities: ["WEAR", "CHERISH", "PASS ON"] },
] as const;
export type SceneId = typeof SCENES[number]["id"];
export const CHAPTERS = [
  { label: "The Earth", anchor: "earth", scene: 0 },
  { label: "Discovery", anchor: "discovery", scene: 1 },
  { label: "Shedding", anchor: "shedding", scene: 2 },
  { label: "A Masterpiece", anchor: "masterpiece", scene: 4 },
] as const;
// The reference shows these links, but no additional marketing sections.
export const LINKS = [
  ["OUR STORY", "#discovery"], ["GEMS", "#masterpiece"],
  ["CRAFTSMANSHIP", "#shedding"], ["JOURNAL", "#refinement"], ["CONTACT", "#meaning"],
] as const;
