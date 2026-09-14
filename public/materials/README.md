# Material textures

The built-in imagegen tool generated these project assets. They are
AI-generated surface maps, not photographic scans. The application loads them
locally; it does not call an image generation API at runtime. The target
screenshot is not part of the runtime assets.

- `firoza-reference-albedo.png`: the current map shared by rough, carved, polished and silver-set
  mineral. Color is sampled as sRGB; bump sampling uses linear data. The
  shader derives surface roughness from turquoise versus matrix coloration.
  Dark branching matrix separates irregular blue mineral areas; silver-grey
  and muted brassy inclusion islands get a localized metallic response in
  polished stages. Blue turquoise remains opaque and nonmetallic.
- `firoza-albedo.png`: the earlier generated map, retained as a legacy asset.
  It is no longer loaded by the journey.
- `rock-albedo.png`: maps the displaced terrain, broken slabs and pedestal.
  Geometry, warm lighting and shadows remain real-time Three.js rendering.

The earlier procedural color/height maps and their unused baking script were
removed when these textures replaced them.

The photo-guided refinement uses the user's eight supplied firoza photographs
to distinguish coarse raw mineral from the finished cabochon. The built-in
imagegen tool used photos 2, 4, 6 and 7 as material references: rough chunks on
cloth, turquoise islands in dark host rock, a blue oval with pale inclusions,
and a polished elongated stone in a setting. Those photographs are not shipped
as textures. The resulting generated map is saved locally as
`public/materials/firoza-reference-albedo.png` (1254 × 1254 PNG).

`lib/mineral.ts` layers grey-brown host crust and granular relief onto this
map in rough stages. Stable UV coordinates preserve the mineral identity
through shaping and polishing; fragment UVs sample near each chip's original
surface position. The map is generated reference-guided artwork, not an
extracted photograph or a calibrated scan. Roughness, height and inclusion
masks are derived approximations. No generation service runs in the app.

## Photo-guided firoza prompt

Tool: built-in `image_gen` (not the fallback CLI). The input image numbering
below refers to the four supplied references in the order described above.
Final prompt:

```text
Use case: photorealistic-natural.
Asset type: seamless square PBR base-color texture for an interactive 3D turquoise/firoza cabochon, not a picture of a gemstone.
Input images are material references only. Image 1: rough blue deposits in granular grey-brown host rock. Image 2: irregular turquoise islands in a dark granular matrix. Images 3 and 4: the finished blue stone with irregular silver-grey and muted brassy mineral inclusions and fine black seams.
Primary request: create a flat orthographic macro albedo surface filling every pixel, preserving the characteristic mineral identity in these references. Approximately 72% vivid opaque azure/turquoise blue with subtle fine mottling, 18% ragged charcoal-grey mineral matrix and thin dark branching seams, 10% broken silver-grey and restrained pale brassy inclusion islands embedded in the matrix. Vary island sizes strongly, from tiny flecks to several irregular larger patches. Natural torn, granular boundaries, not smooth brown bands or outlined polygons. Clear expanses of blue between uneven inclusion clusters. Dense photographic small-scale crystalline texture within the host matrix, much quieter subtle mineral grain in the blue.
Lighting: flat diffuse cross-polarized illumination suitable for a base-color texture. Metallic-looking inclusions represented by their muted silver-grey and pale brassy base color, without baked white specular glare.
Composition: one continuous tileable surface, edge-to-edge, no borders, no perspective, no shape silhouette or visible rim, no background, no fabric, no terrain, no text, no collage.
Avoid: cloudy white cyan blobs, gold wire webbing, uniform cells, regular polygon outlines, ornamental cracks, pure white hotspots, gradients or directional lighting. The stone's blue must remain rich and opaque.
```

## Legacy firoza prompt

Use case: photorealistic-natural. Asset type: a seamless tileable PBR albedo texture for a real-time 3D natural turquoise / firoza gemstone. Generate a square flat orthographic macro surface texture filling the entire image edge to edge, no object silhouette, no background, no perspective, no text. It must look like a real polished slab of natural blue turquoise with irregular brown ochre and dark grey host-rock matrix, occasional small silver-grey quartz inclusions. About 75% saturated deep blue to blue-green turquoise with broad uneven mineral patches and subtle cloudy microtexture; about 25% organic broken branching thin veins and small uneven crust islands in dark brown, ochre and muted silver-grey. Dense realistic fine mineral detail. The matrix is irregular and discontinuous, not metallic outlines, not a uniform polygonal web, not gold decorative kintsugi. Flat cross-polarized diffuse illumination with no specular highlights, no cast shadows, no gradient, no depth lighting baked in, suitable as a tileable material base-color map. Photographic mineral realism, not an illustration, not a gemstone product photograph. Rich blue mineral dominates; avoid pale cyan, pale white matrix dominating, thin perfect cells, large gold outlines, diamonds, facets, terrain or jewelry.

## Rock prompt

Use case: photorealistic-natural. Asset type: seamless tileable PBR base color texture for 3D rough dark rocky terrain. Generate a square high detail orthographic macro photograph of fractured nearly black shale and ironstone, filling the entire frame. Irregular sharply broken layered rock plates, craggy small crevices, rugged granular surface and dense natural fine texture. Charcoal black, dark brown iron staining, a few muted grey fracture edges. A rocky solid continuous surface, not scattered pebbles, not an image of a landscape. Uniform diffuse cross-polarized lighting, no sunlight, no bright specular reflections, no cast shadows, no vignette or gradient, no horizon or sky, no text. Suitable for mapping onto a real-time 3D rocky terrain mesh. Photographic mineral detail and natural angular cleavage. Avoid smooth sand, low-poly render, rocks arranged in rows, glitter, silver metal, grey concrete, warm beige color. Must be dark charcoal brown-black dry rock with micro relief texture.
