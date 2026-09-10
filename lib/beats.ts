/** Section distances and legacy chapter ranges, normalized to total document
 * height (not scrollable height). The first four visible sections are 100svh;
 * sceneTimeline.ts defines their resting states and transition windows.
 * The zero-length inhale entry preserves legacy camera imports only.
 */

export type BeatId =
  | "arrival"
  | "origin"
  | "inhale"
  | "cut"
  | "tolerance"
  | "object"
  | "worn"
  | "collection";

export interface Beat {
  id: BeatId;
  /** Display name — shown in the dev HUD, nowhere else. */
  name: string;
  /** Scroll distance this beat occupies, in viewport-heights. Edit this to retune pacing. */
  pinVh: number;
  /** [startIndex, endIndex] into lib/curve.ts's waypoint arrays. */
  curveWaypointIndices: [number, number];
  /** 0-1, derived from pinVh below. Do not edit directly. */
  start: number;
  /** 0-1, derived from pinVh below. Do not edit directly. */
  end: number;
}

const RAW_BEATS: Array<Omit<Beat, "start" | "end">> = [
  { id: "arrival", name: "Arrival", pinVh: 100, curveWaypointIndices: [0, 1] },
  { id: "origin", name: "Origin", pinVh: 100, curveWaypointIndices: [1, 2] },
  { id: "inhale", name: "The Inhale", pinVh: 0, curveWaypointIndices: [2, 3] },
  { id: "cut", name: "The Cut", pinVh: 100, curveWaypointIndices: [3, 5] },
  { id: "tolerance", name: "The Stone", pinVh: 100, curveWaypointIndices: [5, 6] },
  { id: "object", name: "The Object", pinVh: 160, curveWaypointIndices: [6, 7] },
  { id: "worn", name: "Worn", pinVh: 100, curveWaypointIndices: [7, 8] },
  { id: "collection", name: "The Collection", pinVh: 220, curveWaypointIndices: [8, 10] },
];

export const TOTAL_SCROLL_VH = RAW_BEATS.reduce((sum, b) => sum + b.pinVh, 0);

export const BEATS: Beat[] = (() => {
  let cursor = 0;
  return RAW_BEATS.map((b) => {
    const start = cursor / TOTAL_SCROLL_VH;
    cursor += b.pinVh;
    const end = cursor / TOTAL_SCROLL_VH;
    return { ...b, start, end };
  });
})();

/** Looks up which beat owns a given 0-1 scroll progress value. */
export function getBeatAt(progress: number): Beat {
  const p = Math.min(1, Math.max(0, progress));
  const found = BEATS.find((b) => p >= b.start && p < b.end);
  return found ?? BEATS[BEATS.length - 1];
}
