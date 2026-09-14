# HK GEMS: the firoza journey

The approved narrative has six scenes: Earth, Discovery, Shedding, Refinement,
Masterpiece, and Meaning. `lib/journey.ts` owns the content and the six matching
navigation stops. There are no diamond, collection, or worn-jewellery sequences.

## Mineral and craftsmanship

- `lib/mineral.ts` uses one 128 × 88 lattice and stable UV coordinates for the
  whole mineral. The raw shell has irregular relief and clipped cleavage edges.
- Discovery turns the complete raw shell to a different side under grazing light.
  Material removal begins only in the craftsmanship transition.
- Three shape targets represent a plane-carved stone, an asymmetrical preform
  with an unfinished shoulder, and a finished elongated oval. Refinement has
  its own silhouette, satin roughness, bump strength and subdued reflections.
- Twenty-two separate cleavage fragments start at positions sampled from the
  raw surface: six larger chips and sixteen flakes. Two shoulder cuts and a
  lower-face cut drive an asymmetric arrangement. Each chip's UV patch samples
  the mineral near its starting point. Scroll controls the release, drift and
  clearance; nothing orbits. Debris clears before the finished reveal.
- The original generated `firoza-albedo.png` remains the source for larger
  mineral patterns. A continuous shader adds mineral grain, finer branching
  dark veins and nonmetallic host-rock variation, suppressing cloudy white
  areas. The field stays attached to the UVs through every morph. Opaque
  mineral material uses zero metalness and zero transmission.
- Roughness decreases gradually from dry raw mineral to satin preform and
  restrained polish. Small round reflection sources replace the tall strip
  that previously obscured the stone. The silver setting has neutral reflection
  sources and its own metallic material.

## Ring, terrain and lighting

The final cabochon is 76% of the loose stone's height and width, in a silver
bezel with rolled rims, split shoulders, and a continuous band. Its three-quarter
presentation exposes the ring opening and reduces the oversized-stone effect.

The environment has displaced terrain, 210 instanced slabs, a raised irregular
pedestal, two warm spots, soft filtered shadow reception, a haze shaft, and 160
small dust points. Rock framing and light strengths change continuously with
scene phase. Foreground contrast is reduced and distant ground fades in alpha
as well as color, eliminating the dark horizon silhouette across the haze.

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

No scanned turquoise geometry, photographic mineral PBR maps, or separate real
firoza close-up references were available in the supplied project assets. The
existing albedo textures are AI-generated and the geometry and supplemental
material detail are procedural. This is not a scanned or exact mineral match.
Authored cleavage geometry and calibrated mineral roughness/height maps would
improve remaining differences in fine relief and optical realism.

Nimbus Roman regular and true italic are local fonts. Inter uses the existing
Next font pipeline. See `public/materials/README.md` for the original texture
prompts and provenance; the app makes no generation-service calls at runtime.
