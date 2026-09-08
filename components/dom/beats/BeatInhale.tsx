import { BeatSection } from "../BeatSection";

/**
 * Beat 2->3 — The Inhale. A pure transition: haze and dust accelerate inward
 * (components/canvas/DustField.tsx) and the stone's surface begins to change
 * as the first facet is ground (components/canvas/HeroStone.tsx).
 *
 * It renders no visible copy. The Inhale is not a chapter of its own — the
 * rail keeps Descent lit through it (lib/journey.ts) — so putting a headline
 * here would announce a scene that the navigation says does not exist, and
 * would compete with the stone at the exact moment it starts to change. The
 * section still exists because it is what produces the beat's scroll
 * distance (see BeatSection), and its label stays available to screen
 * readers and to the dev HUD.
 */
export function BeatInhale() {
  return (
    <BeatSection id="inhale">
      <h2 className="sr-only">The Inhale</h2>
    </BeatSection>
  );
}
