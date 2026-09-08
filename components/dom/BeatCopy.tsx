import type { ReactNode } from "react";

/**
 * The copy block every scene shares — eyebrow, headline, gold rule, body.
 *
 * One component rather than per-beat markup on purpose. The reference's
 * whole sense of order comes from the fact that its scenes are typeset
 * IDENTICALLY: same eyebrow size and tracking, same headline scale, same
 * rule, same distance between each. Hand-rolling that in seven files
 * guarantees it drifts. Anything a beat needs beyond the block — a spec
 * table, a placard grid, a CTA — comes in as `children` under the body, so
 * beats stay free to differ below the fold of the block without being free
 * to differ inside it.
 *
 * The headline deliberately takes its two lines as separate props rather
 * than as free markup: roman on top, italic underneath is the arrangement,
 * and making it structural stops a beat from quietly setting a headline
 * some other way.
 */
export function BeatCopy({
  eyebrow,
  roman,
  italic,
  urdu,
  lines,
  bodyVariant = "caps",
  tone = "light",
  children,
}: {
  eyebrow: string;
  /** First headline line, set roman. */
  roman: ReactNode;
  /** Second headline line, set italic. */
  italic: ReactNode;
  /** Optional Urdu line, sitting between headline and rule. */
  urdu?: string;
  /** Body copy, one entry per rendered line. */
  lines?: string[];
  /**
   * "caps" is the scene default — small, uppercase, widely tracked, one
   * statement per line. "serif" is the opening chapter's quieter register,
   * used where the copy is a sentence rather than a list of facts.
   */
  bodyVariant?: "caps" | "serif";
  /**
   * "light" is the site default — light copy on the dark set.
   *
   * "adaptive" takes its colours from the `--beat-ink` / `--beat-ink-muted`
   * custom properties instead, which the beat sets itself. Only Beat 6 needs
   * it: that beat's background travels from near-black to a full warm-white
   * wash while the copy sits on top of it, so no fixed colour reads for the
   * whole scene. See components/dom/beats/Beat6Worn.tsx.
   */
  tone?: "light" | "adaptive";
  children?: ReactNode;
}) {
  const headingColor =
    tone === "adaptive" ? "text-[color:var(--beat-ink)]" : "text-white";
  const mutedColor =
    tone === "adaptive" ? "text-[color:var(--beat-ink-muted)]" : "text-white/45";
  const bodyColor =
    tone === "adaptive" ? "text-[color:var(--beat-ink-muted)]" : "text-white/55";
  const serifColor =
    tone === "adaptive" ? "text-[color:var(--beat-ink-muted)]" : "text-white/60";
  return (
    // Measure is load-bearing, not a guess: the reference's copy column is
    // roughly a quarter of the frame, which is what keeps it clear of the
    // stone on the right and reads as a column rather than a paragraph
    // running across the page. Wider than this and the spec rows slide under
    // the stone; narrower and the headline breaks into too many lines.
    <div className="max-w-[26rem]">
      <p
        className={`font-sans text-[10px] font-medium uppercase tracking-[0.3em] ${mutedColor}`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-6 font-display text-[2.5rem] font-light leading-[1.06] tracking-[-0.005em] sm:text-[3.25rem] lg:text-[3.9rem] ${headingColor}`}
      >
        {roman}
        <br />
        <em className="italic">{italic}</em>
      </h2>

      {urdu ? (
        // inline-block so the box shrinks to the word. As a plain block, an
        // RTL paragraph aligns itself to the RIGHT edge of the measure,
        // stranding a two-word name far from the headline it belongs to and
        // pushing it under the stone. Shrinking the box keeps it at the
        // column's start while the text itself still renders right-to-left.
        <p
          dir="rtl"
          lang="ur"
          className={`mt-5 inline-block font-display text-xl font-light ${serifColor}`}
        >
          {urdu}
        </p>
      ) : null}

      <span aria-hidden="true" className="mt-8 block h-px w-10 bg-[#C9A227]" />

      {lines?.length ? (
        <div className="mt-7">
          {lines.map((line) =>
            bodyVariant === "caps" ? (
              <p
                key={line}
                className={`font-sans text-[10px] uppercase leading-[2.1] tracking-[0.22em] ${bodyColor}`}
              >
                {line}
              </p>
            ) : (
              <p
                key={line}
                className={`font-display text-lg font-light leading-[1.65] ${serifColor}`}
              >
                {line}
              </p>
            ),
          )}
        </div>
      ) : null}

      {children}
    </div>
  );
}
