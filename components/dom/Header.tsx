import { Brand } from "./Brand";
import { LINKS } from "@/lib/journey";
export function Header() {
  return <header className="site-header">
    <Brand />
    <nav aria-label="Primary">{LINKS.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
    <span className="header-ornament" aria-hidden="true">•••</span>
  </header>;
}
