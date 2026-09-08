import { BeatSection } from "../BeatSection";
import { BeatCopy } from "../BeatCopy";
import { chapterForBeat } from "@/lib/journey";

const CHAPTER = chapterForBeat("arrival");

/**
 * Beat 1 — Arrival. The loader (components/dom/Loader.tsx) plays once on
 * mount, ahead of this headline; this content is what's underneath it the
 * whole time and what remains once it hands off.
 *
 * The opening chapter is the one that sets its body in serif rather than
 * caps: it is a sentence about the brand, where every later scene's body is
 * a list of facts about the stone.
 */
export function Beat1Arrival() {
  return (
    <BeatSection id="arrival" align="top">
      <BeatCopy
        eyebrow={CHAPTER.eyebrow}
        roman="A stone carries"
        italic="its mountain."
        bodyVariant="serif"
        lines={["Natural stones. Precisely cut.", "Hand-finished in sterling silver."]}
      />
    </BeatSection>
  );
}
