import { BeatSection } from "../BeatSection";
import { HERO_STONE } from "@/lib/stones";

const SPEC_ROWS: Array<[string, string]> = [
  ["Stone", HERO_STONE.name],
  ["Origin", HERO_STONE.origin],
  ["Carat", HERO_STONE.carat ?? "—"],
  ["Metal", HERO_STONE.metal ?? "—"],
  ["Finish", HERO_STONE.finish ?? "—"],
];

/**
 * Beat 5 — The Object. Phase 3 resolves these rows one at a time against a
 * hairline gold rule projected from a facet edge (per the brief); Phase 0
 * renders the final resolved state statically.
 */
export function Beat5Object() {
  return (
    <BeatSection id="object">
      <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/40">
        {HERO_STONE.name}
      </p>
      <p dir="rtl" lang="ur" className="mt-1 font-display text-lg text-white/50">
        {HERO_STONE.urduName}
      </p>
      <dl className="mt-8 max-w-sm space-y-2 font-sans text-xs uppercase tracking-[0.15em] text-white/70">
        {SPEC_ROWS.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between border-b border-white/10 pb-2"
          >
            <dt className="text-white/40">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </BeatSection>
  );
}
