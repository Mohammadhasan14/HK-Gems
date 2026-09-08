import { BeatSection } from "../BeatSection";
import { BeatCopy } from "../BeatCopy";
import { chapterForBeat } from "@/lib/journey";

const CHAPTER = chapterForBeat("cut");

/**
 * Beat 3 — The Cut, the signature moment. The 3D layer carries it: the rough
 * is genuinely carved down to the finished gem by that cut's own facet
 * planes (lib/cutStages.ts), so the body copy below is a caption on
 * something literally true of the geometry rather than a claim laid over a
 * crossfade.
 */
export function Beat3Cut() {
  return (
    <BeatSection id="cut" align="top">
      <BeatCopy
        eyebrow={CHAPTER.eyebrow}
        roman="Precision"
        italic="reveals light."
        lines={["Nothing is added.", "Only what does not belong", "is taken away."]}
      />
    </BeatSection>
  );
}
