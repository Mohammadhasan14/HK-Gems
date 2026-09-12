# HK GEMS: the firoza journey

The latest reference has six visible compositions: Earth, Discovery, Shedding,
Refinement, Masterpiece, and Meaning (the silver ring). `lib/journey.ts` owns
that order and the visible copy. The four chapter links match the reference.
There are no collection, worn-jewellery, diamond-cut, or ring-assembly stages.

## Geometry and rendering

- `lib/mineral.ts` sculpts one 128 × 88 spherical lattice with rough,
  asymmetrically carved, and smooth oval position/normal targets. Discovery
  turns the raw mineral; refinement polishes it; the final setting uses a
  shallower cabochon made from the same mineral surface.
- `MineralJourney.tsx` moves 34 separate, closed rock fragments away from the
  core during carving. They are not transparent gem facets or sliced caps.
- `SilverRing.tsx` models a silver bezel, two rolled rims, split shoulders and
  a continuous band. No part of the metal setting uses a gold material.
- `public/materials/firoza-albedo.png` is an AI-generated mineral texture,
  shared by all six states. Roughness is derived from the mineral/matrix mask;
  raw and polished bump strengths differ. The stone stays opaque: transmission
  and metalness are zero. `rock-albedo.png` supplies granular rock surface detail.
  The built-in imagegen tool created both maps; see their README for prompts.
- `RockyEnvironment.tsx` supplies displaced terrain, 210 instanced broken
  slabs, a raised ring pedestal, two warm spots, shadow reception, a textured
  light shaft and small dust particles. No reference image is used at runtime.
- One fixed R3F canvas renders on demand, invalidating on scroll, resize and
  texture readiness. Hidden materials are precompiled before their transitions
  to reduce first-use shader stalls. A fixed camera preserves the text/stone separation.

## Scroll behavior

Six native sections each occupy one small viewport height (100svh). Each
section holds its settled state for the first 28% of its scroll distance, then
transitions to the next. The final state remains settled while the footer
enters. The scroll store derives geometry, copy visibility and active chapter
from the same phase; there are no pin spacers or secondary timelines.

Reduced motion disables scroll smoothing and changes directly between the
settled compositions. Mobile uses a separate vertically stacked composition.

## Asset limitations

No scanned turquoise model, photographic mineral PBR maps, or terrain scan
was supplied in the repository. The geometry is procedural and the albedo textures are AI-generated
approximations, not scans or an exact reproduction of the reference. A detailed authored/scanned raw mineral and photographed rock
surfaces would improve the remaining differences in cleavage, matrix relief,
and terrain realism.

Nimbus Roman regular and true italic are bundled locally. Inter uses the
existing Next font pipeline and is self-hosted in the generated application;
a cold build may require network access to download it.
