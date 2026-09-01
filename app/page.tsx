import { Beat1Arrival } from "@/components/dom/beats/Beat1Arrival";
import { Beat2Origin } from "@/components/dom/beats/Beat2Origin";
import { BeatInhale } from "@/components/dom/beats/BeatInhale";
import { Beat3Cut } from "@/components/dom/beats/Beat3Cut";
import { Beat4Tolerance } from "@/components/dom/beats/Beat4Tolerance";
import { Beat5Object } from "@/components/dom/beats/Beat5Object";
import { Beat6Worn } from "@/components/dom/beats/Beat6Worn";
import { Beat7Collection } from "@/components/dom/beats/Beat7Collection";
import { STONES } from "@/lib/stones";

const productsJsonLd = Object.values(STONES).map((stone) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: stone.name,
  description: stone.description,
  material: stone.scientificName,
  additionalProperty: {
    "@type": "PropertyValue",
    name: "Origin",
    value: stone.origin,
  },
}));

export default function Home() {
  return (
    <>
      <Beat1Arrival />
      <Beat2Origin />
      <BeatInhale />
      <Beat3Cut />
      <Beat4Tolerance />
      <Beat5Object />
      <Beat6Worn />
      <Beat7Collection />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productsJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {/* The WebGL scene renders no text of its own — this is the fallback
          for JS-disabled clients and a plain-text anchor for crawlers. */}
      <noscript>
        <ul>
          {Object.values(STONES).map((stone) => (
            <li key={stone.id}>
              {stone.name} ({stone.scientificName}) — {stone.origin}
            </li>
          ))}
        </ul>
      </noscript>
    </>
  );
}
