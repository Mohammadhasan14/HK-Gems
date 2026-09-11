import { Brand } from "./Brand";
import { LINKS } from "@/lib/journey";
export function SiteFooter() {
  return <footer className="site-footer">
    <Brand /><nav aria-label="Footer">{LINKS.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
    <p>REAL STONES. REAL STORIES.</p>
  </footer>;
}
