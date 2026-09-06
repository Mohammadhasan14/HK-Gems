/**
 * Fixed brand header — persists throughout the whole scroll, per the brief.
 * Plain semantic markup, no client hooks, so it's visible even before the
 * WebGL layer (or Lenis) has initialised (failure mode #3).
 *
 * Luxury-retail arrangement rather than a web-app bar: monogram and stacked
 * wordmark left, the collection/journey links centred and small, one single
 * outlined action right. No panels, no borders on the bar itself, no
 * backdrop blur — the header should feel printed onto the frame.
 */

const LINKS: Array<{ label: string; href: string }> = [
  { label: "Collection", href: "#collection" },
  { label: "The Journey", href: "#arrival" },
  { label: "Craft", href: "#cut" },
  { label: "About", href: "#origin" },
];

/**
 * The house cut in outline — the same table/crown/girdle/pavilion structure
 * as the stone on screen (lib/gemGeometry.ts), drawn flat. An identity mark
 * derived from the product itself, rather than a generic ornament.
 */
function Monogram() {
  return (
    <svg
      viewBox="0 0 24 26"
      className="h-7 w-[26px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7.5 4.5h9L22 10.5 12 23.5 2 10.5z" />
      <path d="M2 10.5h20" />
      <path d="M7.5 4.5 5 10.5M16.5 4.5 19 10.5" />
      <path d="M5 10.5 12 23.5 19 10.5" />
    </svg>
  );
}

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10">
      {/* Scrim. The canvas behind the header is not always dark — Beat 3
          fills the frame with a lit facet and Beat 6 deliberately blows out
          to warm white — and light text over either of those disappears
          entirely. A short gradient keeps the wordmark and links legible
          across the whole scroll without putting a bar, border or blur on
          the header itself. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-[#08080A]/75 via-[#08080A]/35 to-transparent"
      />
      <a href="#arrival" className="flex items-center gap-3 text-[#C9A227]">
        <Monogram />
        <span className="font-display text-[15px] font-light uppercase leading-[1.05] tracking-[0.22em]">
          HK
          <br />
          Gems
        </span>
      </a>

      <nav
        aria-label="Primary"
        className="absolute left-1/2 hidden -translate-x-1/2 gap-10 font-sans text-[10px] uppercase tracking-[0.24em] text-white/60 md:flex"
      >
        {LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="transition-colors duration-300 hover:text-[#C9A227]"
          >
            {label}
          </a>
        ))}
      </nav>

      <a
        href="#worn"
        className="border border-white/20 px-4 py-2 font-sans text-[10px] uppercase tracking-[0.24em] text-white/70 transition-colors duration-300 hover:border-[#C9A227]/60 hover:text-[#C9A227]"
      >
        Enquire
      </a>
    </header>
  );
}
