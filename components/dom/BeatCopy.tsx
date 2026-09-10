import type { ReactNode } from "react";
export function BeatCopy({ eyebrow, roman, italic, urdu, lines, bodyVariant = "caps", tone = "light", children }: {
  eyebrow: string; roman: ReactNode; italic: ReactNode; urdu?: string; lines?: string[];
  bodyVariant?: "caps" | "serif"; tone?: "light" | "adaptive"; children?: ReactNode;
}) {
  const Heading = bodyVariant === "serif" ? "h1" : "h2";
  return (
    <div className={`beat-copy ${tone === "adaptive" ? "adaptive-copy" : ""}`}>
      <p className="scene-eyebrow">{eyebrow}</p>
      <Heading className="scene-heading">{roman}<br /><em>{italic}</em></Heading>
      {urdu && <p dir="rtl" lang="ur" className="scene-urdu">{urdu}</p>}
      <span aria-hidden="true" className="gold-divider" />
      {lines && <div className={`scene-support ${bodyVariant === "serif" ? "serif-support" : ""}`}>
        {lines.map((line) => <p key={line}>{line}</p>)}
      </div>}
      {children}
    </div>
  );
}
