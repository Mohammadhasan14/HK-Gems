import { BEATS } from "./beats";

const WORN = BEATS.find((b) => b.id === "worn")!;
const COLLECTION = BEATS.find((b) => b.id === "collection")!;

// How much of Collection's own range the wash takes to fade back out —
// small, so it clears quickly and doesn't eat into the turntable beat.
const FADE_OUT_SPAN = (COLLECTION.end - COLLECTION.start) * 0.08;

/**
 * Beat 6's overexposure curve: 0 before Worn, rising to a full warm-white
 * wash across it, then clearing across the start of Collection.
 *
 * Lives here rather than inside components/dom/WornExposure.tsx because two
 * things need it. The wash itself draws it, and Beat 6's copy has to INVERT
 * against it — the beat is the one place on the site where the background
 * travels from near-black to near-white while text is sitting on top of it,
 * so light copy that reads at the start of the beat is invisible by the end
 * of it. Both reading the same function is what keeps the ink and the wash
 * from disagreeing.
 */
export function exposureOpacity(progress: number): number {
  if (progress <= WORN.start) return 0;
  if (progress < WORN.end) {
    // Reaches full exposure a little before the beat's own end, so the CTA
    // at the bottom of the beat reads against the fully blown-out wash
    // rather than mid-transition.
    return Math.min(1, (progress - WORN.start) / (WORN.end - WORN.start) / 0.85);
  }
  // Past Worn: stays fully exposed through the boundary, then fades back out
  // across the start of Collection so its near-black background (and
  // white-on-dark placards) can return — without this, the wash never clears
  // and Collection's text is invisible against it.
  return Math.max(0, 1 - (progress - WORN.end) / FADE_OUT_SPAN);
}
