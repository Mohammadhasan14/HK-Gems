import type { BeatId } from "./beats";

/**
 * The journey as the VISITOR sees it — the chapter list shown in the left
 * rail and counted by the right-hand progress indicator.
 *
 * Deliberately a separate list from lib/beats.ts rather than a rename of
 * it. beats.ts is the pacing/technical map (it has to carry "inhale", a
 * transition with no chapter of its own), while this is editorial: seven
 * numbered chapters, one per thing the visitor is actually being shown.
 * Mapping many beats to one chapter is why `beats` is an array — the Inhale
 * belongs under Origin, so the rail doesn't flicker to a new chapter during
 * a transition.
 *
 * Labels reuse the existing beat names wherever they already read as
 * chapter titles; Tolerance becomes "The Setting" because that is what the
 * beat is about to anyone who isn't reading the source.
 */
export interface Chapter {
  /** Two-digit index shown in the rail. */
  number: string;
  label: string;
  /** Beats that keep this chapter lit. */
  beats: BeatId[];
  /** DOM id to scroll to — see components/dom/BeatSection.tsx. */
  anchor: BeatId;
}

export const CHAPTERS: Chapter[] = [
  { number: "01", label: "Hero", beats: ["arrival"], anchor: "arrival" },
  { number: "02", label: "Origin", beats: ["origin", "inhale"], anchor: "origin" },
  { number: "03", label: "The Cut", beats: ["cut"], anchor: "cut" },
  { number: "04", label: "The Setting", beats: ["tolerance"], anchor: "tolerance" },
  { number: "05", label: "The Object", beats: ["object"], anchor: "object" },
  { number: "06", label: "Worn", beats: ["worn"], anchor: "worn" },
  { number: "07", label: "Collection", beats: ["collection"], anchor: "collection" },
];

export function chapterIndexForBeat(beat: BeatId): number {
  const i = CHAPTERS.findIndex((c) => c.beats.includes(beat));
  return i === -1 ? 0 : i;
}
