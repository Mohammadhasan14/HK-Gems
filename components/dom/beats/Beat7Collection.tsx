import { BeatSection } from "../BeatSection";
import { STONES, COLLECTION_ORDER } from "@/lib/stones";

/**
 * Beat 7 — The Collection. Six placards; Phase 3 wires the vitrine
 * turntable (scroll rotates a lazy-susan, only the lit stone is placarded).
 * Phase 0 lists all six statically. Footer wordmark closes the loader's
 * gesture from Beat 1.
 */
export function Beat7Collection() {
  return (
    <BeatSection id="collection">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        The Collection
      </p>
      <ul className="mt-8 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        {COLLECTION_ORDER.map((id) => {
          const stone = STONES[id];
          return (
            <li key={id} className="border-l border-[#C9A227]/30 pl-4">
              <p className="font-display text-xl font-light text-white">
                {stone.name}
              </p>
              <p dir="rtl" lang="ur" className="font-display text-sm text-white/40">
                {stone.urduName}
              </p>
              <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.15em] text-white/50">
                {stone.scientificName} — {stone.origin}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-16 font-sans text-sm font-light uppercase tracking-[0.3em] text-[#C9A227]">
        HK Gems
      </p>
    </BeatSection>
  );
}
