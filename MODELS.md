# Assets and implementation status

The repository did not contain supplied GLB models, scanned mineral textures,
terrain scans, or an HDR environment. The first four chapters use procedural
3D assets and locally baked PBR maps. These are approximations of the supplied
art direction, not photorealistic scans or an exact reproduction.

## Active four-scene journey

- `lib/mineral.ts`: a 160 × 112 sphere lattice sculpted into a chipped, upright
  raw rock, with a position/normal morph into a polished elongated oval.
- `components/canvas/MineralJourney.tsx`: the shared mineral mesh and four
  separate, closed faceted meshes. Top, bottom, left and right pieces all
  remain visible in the settled Cut. The final oval adopts a quieter tilt.
- `public/materials/`: six 1536 × 768 color, roughness and height maps sampled
  from deterministic 3D noise. Raw and polished maps share the same mineral
  field. Brown matrix interrupts the turquoise; veins do not follow polygons.
- `scripts/generate-mineral-textures.mjs`: rebuilds those maps with Node and
  the existing Sharp dependency. No image service or remote texture request
  is needed at runtime.
- The mineral and its cut pieces are opaque. The facets use a stronger local
  reflection response; the central body never receives glass transmission.
- `components/canvas/RockyEnvironment.tsx`: displaced terrain, 65 instanced
  rock fragments, a warm shadow-casting spotlight, a light shaft, and small
  illuminated dust points. All four scenes retain the environment.
- `components/canvas/Scene.tsx`: a local light-card environment; no remote HDR
  is fetched. `CanvasRoot.tsx` uses demand rendering for the first four states
  and invalidates on scroll, resize and texture readiness.

## Later chapters retained

`HeroStone.tsx`, `rawStone.ts`, `gemGeometry.ts`, `cutStages.ts` and
`gemTextures.ts` support the existing later object/collection presentation.
Their legacy faceted geometry is not used for the first four compositions.
`BezelAssembly.tsx` remains a procedural silver assembly, and `Vitrine.tsx`
retains the six-stone collection. Product copy, specifications and stone
metadata are preserved. No photographed worn-jewelry asset is supplied.

## Remaining asset improvements

A photographed/scanned turquoise rough and authored oval/shard geometry would
improve the mineral relief, vein structure and optical detail. Scanned rock
PBR textures and an authored light volume would improve terrain realism and
atmospheric depth. The current floor is real geometry with bump detail, but
remains visibly procedural under close inspection.

## Fonts

Nimbus Roman regular/italic and Noto Nastaliq Urdu are bundled in
`public/fonts/`, with redistribution licenses alongside them. Inter retains
its existing Next Google Font configuration and requires network access on
a cold production build. Browsers receive the self-hosted build output.
