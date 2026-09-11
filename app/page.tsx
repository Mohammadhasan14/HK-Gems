import { SCENES } from "@/lib/journey";
import { BeatSection } from "@/components/dom/BeatSection";
import { Header } from "@/components/dom/Header";
import { StoryNav } from "@/components/dom/StoryNav";
import { SiteFooter } from "@/components/dom/SiteFooter";
export default function Home() {
  return <>
    {SCENES.map((scene, index) => {
      const Heading = index === 0 ? "h1" : "h2";
      return <BeatSection key={scene.id} index={index}>
        {index === 0 && <><Header /><StoryNav /></>}
        <div className="scene-copy">
          <p className="scene-eyebrow">{scene.eyebrow}</p>
          <Heading className="scene-heading" id={`${scene.id}-title`}>
            {scene.title.map(line => <span key={line}>{line}</span>)}<em>{scene.italic}</em>
          </Heading>
          <span className="gold-divider" aria-hidden="true" />
          <p className="scene-support">{scene.lines.map(line => <span key={line}>{line}</span>)}</p>
          {scene.id !== "masterpiece" && <span className="gold-divider closing-divider" aria-hidden="true" />}
        </div>
        <p className="scene-qualities">{scene.qualities.map(quality => <span key={quality}>{quality}</span>)}<i aria-hidden="true" /></p>
      </BeatSection>;
    })}
    <SiteFooter />
  </>;
}
