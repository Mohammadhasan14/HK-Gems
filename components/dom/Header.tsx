/**
 * Fixed brand header — persists throughout the whole scroll, per the brief.
 * Plain semantic markup, no client hooks, so it's visible even before the
 * WebGL layer (or Lenis) has initialised (failure mode #3).
 */
export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10">
      <span className="font-sans text-xs font-light uppercase tracking-[0.3em] text-[#C9A227]">
        HK Gems
      </span>
      <nav className="flex gap-6 font-sans text-[10px] uppercase tracking-[0.2em] text-white/70">
        <a href="#arrival" className="transition-colors hover:text-[#C9A227]">
          Atelier
        </a>
        <a href="#collection" className="transition-colors hover:text-[#C9A227]">
          Collection
        </a>
        <a href="#worn" className="transition-colors hover:text-[#C9A227]">
          Enquire
        </a>
      </nav>
    </header>
  );
}
