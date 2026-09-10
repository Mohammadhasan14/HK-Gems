const LINKS = [
  ["COLLECTION", "#collection"], ["THE JOURNEY", "#arrival"], ["CRAFT", "#cut"], ["ABOUT", "#origin"], ["ENQUIRE", "#worn"],
];
export function Header() {
  return <header className="site-header">
    <a href="#arrival" className="wordmark" aria-label="HK Gems — home">
      <svg viewBox="0 0 34 42" fill="none" stroke="currentColor" strokeWidth=".85" aria-hidden="true">
        <path d="M12 6V36M22 6V36M12 20H22M22 20L30 9M22 20L30 32M8 11C0 9 1 21 7 21C0 22 2 33 9 30M26 6C21-1 13-1 9 6M26 36C21 43 13 43 9 36" />
        <path d="M16 5V37M5 15V27" opacity=".55" />
      </svg>
      <span>HK GEMS<small>HERITAGE JEWELS</small></span>
    </a>
    <nav aria-label="Primary">{LINKS.map(([label, href]) => <a key={label} href={href}>{label}</a>)}</nav>
    <span lang="ur" dir="rtl" className="header-urdu">اردو</span>
  </header>;
}
