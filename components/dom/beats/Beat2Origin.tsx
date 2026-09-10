import { BeatSection } from "../BeatSection";
import { BeatCopy } from "../BeatCopy";
export function Beat2Origin() {
  return <BeatSection id="origin">
    <BeatCopy eyebrow="SCENE 1 — DESCENT" roman={<>From the Earth.<br />From Time.</>} italic="From Depth."
      lines={["MINED FROM MOUNTAINS.", "SHAPED BY RIVERS.", "CARVED BY TIME."]} />
  </BeatSection>;
}
