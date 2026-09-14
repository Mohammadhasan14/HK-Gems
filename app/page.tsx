import { SCENES } from "@/lib/journey";
import { BeatSection } from "@/components/dom/BeatSection";
import { Header } from "@/components/dom/Header";
import { JourneyStage } from "@/components/dom/JourneyStage";
import { SiteFooter } from "@/components/dom/SiteFooter";
export default function Home() {
  return <>
    <JourneyStage>{SCENES.map((scene, index) => {
      const Heading = index === 0 ? "h1" : "h2";
      return <BeatSection key={scene.id} index={index}>
        {index === 0 && <Header />}
        <div className="scene-copy">
          <p className="scene-eyebrow">{scene.eyebrow}</p>
          <Heading className="scene-heading" id={`${scene.id}-title`}>
            {scene.title.map(line => <span key={line}>{line}</span>)}<em>{scene.italic}</em>
          </Heading>
          <span className="gold-divider" aria-hidden="true" />
          <p className={`scene-support ${index === 0 ? "hero-support" : ""}`}>
            {index === 0 ? scene.lines.map(line => <span key={line}>{line}</span>) : scene.lines.join(" ")}
          </p>
          {scene.id !== "masterpiece" && <span className="gold-divider closing-divider" aria-hidden="true" />}
        </div>
        <p className="scene-qualities">{scene.qualities.map(quality => <span key={quality}>{quality}</span>)}<i aria-hidden="true" /></p>
      </BeatSection>;
    })}</JourneyStage>
    <SiteFooter />
  </>;
}
