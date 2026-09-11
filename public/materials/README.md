# Material textures

The built-in imagegen tool generated these two project assets. They are
AI-generated surface maps, not photographic scans. The application loads them
locally; it does not call an image generation API at runtime. The target
screenshot is not part of the runtime assets.

- `firoza-albedo.png`: shared by the rough, carved, polished and silver-set
  mineral. Color is sampled as sRGB; bump sampling uses linear data. The
  shader derives surface roughness from turquoise versus matrix coloration.
- `rock-albedo.png`: maps the displaced terrain, broken slabs and pedestal.
  Geometry, warm lighting and shadows remain real-time Three.js rendering.

The earlier procedural color/height maps and their unused baking script were
removed when these textures replaced them.

## Firoza prompt

Use case: photorealistic-natural. Asset type: a seamless tileable PBR albedo texture for a real-time 3D natural turquoise / firoza gemstone. Generate a square flat orthographic macro surface texture filling the entire image edge to edge, no object silhouette, no background, no perspective, no text. It must look like a real polished slab of natural blue turquoise with irregular brown ochre and dark grey host-rock matrix, occasional small silver-grey quartz inclusions. About 75% saturated deep blue to blue-green turquoise with broad uneven mineral patches and subtle cloudy microtexture; about 25% organic broken branching thin veins and small uneven crust islands in dark brown, ochre and muted silver-grey. Dense realistic fine mineral detail. The matrix is irregular and discontinuous, not metallic outlines, not a uniform polygonal web, not gold decorative kintsugi. Flat cross-polarized diffuse illumination with no specular highlights, no cast shadows, no gradient, no depth lighting baked in, suitable as a tileable material base-color map. Photographic mineral realism, not an illustration, not a gemstone product photograph. Rich blue mineral dominates; avoid pale cyan, pale white matrix dominating, thin perfect cells, large gold outlines, diamonds, facets, terrain or jewelry.

## Rock prompt

Use case: photorealistic-natural. Asset type: seamless tileable PBR base color texture for 3D rough dark rocky terrain. Generate a square high detail orthographic macro photograph of fractured nearly black shale and ironstone, filling the entire frame. Irregular sharply broken layered rock plates, craggy small crevices, rugged granular surface and dense natural fine texture. Charcoal black, dark brown iron staining, a few muted grey fracture edges. A rocky solid continuous surface, not scattered pebbles, not an image of a landscape. Uniform diffuse cross-polarized lighting, no sunlight, no bright specular reflections, no cast shadows, no vignette or gradient, no horizon or sky, no text. Suitable for mapping onto a real-time 3D rocky terrain mesh. Photographic mineral detail and natural angular cleavage. Avoid smooth sand, low-poly render, rocks arranged in rows, glitter, silver metal, grey concrete, warm beige color. Must be dark charcoal brown-black dry rock with micro relief texture.
