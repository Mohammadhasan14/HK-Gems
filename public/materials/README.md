# Mineral maps

These procedural maps were generated for HK GEMS by
`scripts/generate-mineral-textures.mjs`. They contain no third-party photo
assets. Rebuild with `node scripts/generate-mineral-textures.mjs` from the
project root (Sharp is already installed with Next.js).

Both surfaces are sampled from the same 3D noise field on a spherical unwrap.
Color is sRGB; roughness and height are linear data. The files are intentionally
baked rather than evaluated with layered noise in every rendered fragment.
