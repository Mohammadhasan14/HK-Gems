import type { BeatId } from "./beats";

/**
 * The journey as the VISITOR sees it — the chapter list shown in the left
 * rail, counted by the right-hand progress indicator, and named in each
 * beat's eyebrow.
 *
 * Deliberately a separate list from lib/beats.ts rather than a rename of it.
 * beats.ts is the pacing/technical map (it has to carry "inhale", a
 * transition with no chapter of its own), while this is editorial: seven
 * numbered chapters, one per thing the visitor is actually shown. Mapping
 * many beats to one chapter is why `beats` is an array — the Inhale belongs
 * under Descent, so the rail doesn't flicker to a new chapter mid-transition.
 *
 * Numbered from ZERO, and labelled to match the art direction: a chapter
 * list that starts at 0 reads as a film's scene list rather than as a
 * paginated UI, which is the distinction the whole rail is trading on.
 */
export interface Chapter {
  /** Single digit shown in the rail's marker. */
  number: string;
  /** Rail label. */
  label: string;
  /**
   * Eyebrow shown above the beat's headline. The opening chapter names the
   * film rather than numbering itself; every later one is "Scene n — Label".
   */
  eyebrow: string;
  /** Beats that keep this chapter lit. */
  beats: BeatId[];
  /** DOM id to scroll to — see components/dom/BeatSection.tsx. */
  anchor: BeatId;
}

export const CHAPTERS: Chapter[] = [
  {
    number: "0",
    label: "Hero",
    eyebrow: "The Life of a Stone",
    beats: ["arrival"],
    anchor: "arrival",
  },
  {
    number: "1",
    label: "Descent",
    eyebrow: "Scene 1 — Descent",
    beats: ["origin", "inhale"],
    anchor: "origin",
  },
  {
    number: "2",
    label: "The Cut",
    eyebrow: "Scene 2 — The Cut",
    beats: ["cut"],
    anchor: "cut",
  },
  {
    number: "3",
    label: "The Setting",
    eyebrow: "Scene 3 — The Setting",
    beats: ["tolerance"],
    anchor: "tolerance",
  },
  {
    number: "4",
    label: "The Ring",
    eyebrow: "Scene 4 — The Ring",
    beats: ["object"],
    anchor: "object",
  },
  {
    number: "5",
    label: "Worn",
    eyebrow: "Scene 5 — Worn",
    beats: ["worn"],
    anchor: "worn",
  },
  {
    number: "6",
    label: "Collection",
    eyebrow: "Scene 6 — The Collection",
    beats: ["collection"],
    anchor: "collection",
  },
];

export function chapterIndexForBeat(beat: BeatId): number {
  const i = CHAPTERS.findIndex((c) => c.beats.includes(beat));
  return i === -1 ? 0 : i;
}

/** The chapter a given beat belongs to — used by beats for their eyebrow. */
export function chapterForBeat(beat: BeatId): Chapter {
  return CHAPTERS[chapterIndexForBeat(beat)];
}
