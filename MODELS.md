# HK GEMS: the firoza journey

The approved narrative has six scenes: Earth, Discovery, Shedding, Refinement,
Masterpiece, and Meaning. `lib/journey.ts` owns the content and the six matching
navigation stops. There are no diamond, collection, or worn-jewellery sequences.

## Mineral and craftsmanship

- `lib/mineral.ts` uses one 128 × 88 lattice and stable UV coordinates for the
  whole mineral. The raw shell has broad, sloping broken faces, chipped edges
  and small-scale relief guided by the supplied photographs of rough firoza.
- Discovery turns the complete raw shell to a different side under grazing light.
  Material removal begins only in the craftsmanship transition.
- Three shape targets represent a plane-carved stone, an asymmetrical preform
  with an unfinished shoulder, and a finished oval cabochon with a shallow
  back and a rounder shoulder. Refinement has
  its own silhouette, satin roughness, bump strength and subdued reflections.
- Twenty-two separate cleavage fragments start at positions sampled from the
  raw surface: six larger chips and sixteen flakes. Two shoulder cuts and a
  lower-face cut drive an asymmetric arrangement. Each chip's UV patch samples
  the mineral near its starting point. Scroll controls the release, drift and
  clearance; nothing orbits. Debris clears before the finished reveal.
- `firoza-reference-albedo.png` is the shared source for blue mineral, dark
  branching matrix and irregular inclusion islands. It was generated using
  the user's rough and polished firoza photographs as material references.
  A continuous shader adds dry grey-brown crust and fine relief in the rough
  stages, exposing the underlying mineral during shaping and polishing.
  The field stays attached to the UVs through every morph. Blue turquoise is
  dielectric and the whole stone has zero transmission. Only the brighter
  neutral and muted brassy inclusion patches acquire a metallic response as
  the surface is polished; the dark matrix does not become gold wirework.
- Roughness decreases gradually from dry raw mineral to satin preform and
  restrained polish. Small round reflection sources replace the tall strip
  that previously obscured the stone. The silver setting has neutral reflection
  sources and its own metallic material. The clearcoat shader feature stays
  enabled at negligible strength in the raw stages, avoiding a shader
  compilation when polishing first begins.

## Ring, terrain and lighting

The final cabochon is 76% of the loose stone's height and width, in a silver
bezel following the revised oval outline, with rolled rims, split shoulders,
and a continuous band. Its three-quarter
presentation exposes the ring opening and reduces the oversized-stone effect.

The environment has displaced terrain, 210 instanced slabs, an irregular
pedestal, two warm spots, filtered shadow reception, a haze shaft, and 160
small dust points. Terrain, slabs, pedestal and light directions stay anchored
through every scroll phase; only a viewport resize can reposition the ground
for the mobile composition. The pedestal does not rotate, rise or grow during
the ring reveal. Mineral light strengths still change with its finish.

One fixed overhead spot casts the live gemstone and fragment silhouettes onto
the actual ground geometry. Its 2048px PCF map uses bounded near/far planes,
modest depth/normal bias and 80% shadow intensity. Lower ground bump strength
and gentler texture-based crevice darkening preserve relief without crushed,
noisy shading. Distant ground fades in alpha as well as color, eliminating
the dark horizon silhouette across the haze.

## Layout and scrolling

`JourneyStage.tsx` contains one native sticky viewport inside a 600svh range.
Six invisible anchor blocks provide real scroll destinations. The canvas,
copy and persistent navigation share the sticky stage and leave together when
its containing block ends immediately before the footer. There is no second
canvas, final reveal, fixed layer behind the footer, or generated pin spacer.

Each scene occupies one viewport of scroll distance. The first 28% holds the
settled state; the remainder transitions using the shared fractional Lenis
position. Copy remains fully legible until a short, nonoverlapping handoff.
Navigation subscribes to the active scene rather than rerendering every frame.
Rendering occurs on demand, with shaders warmed before hidden meshes appear.

Desktop paragraphs wrap naturally at 16–18px with comfortable line height.
All desktop scenes use the same inset beside the six-stop rail. Mobile stacks
copy above the product, with six touch-sized navigation buttons at the bottom.
Resizing preserves the current position in the narrative. Reduced motion
switches directly between settled states without scroll smoothing.

## Asset limitations

Eight real rough and polished firoza photographs now guide the material and
shape. They are visual references, not calibrated PBR maps or a scanned model.
The new albedo is AI-generated from four of those references; geometry and
supplemental material detail remain procedural. This approximates their mineral
character rather than reproducing one photographed stone exactly. Calibrated
normal, roughness and inclusion masks, plus scanned cleavage geometry, would
improve remaining differences in fine relief and optical realism.

Nimbus Roman regular and true italic are local fonts. Inter uses the existing
Next font pipeline. See `public/materials/README.md` for the texture
prompts and provenance; the app makes no generation-service calls at runtime.
