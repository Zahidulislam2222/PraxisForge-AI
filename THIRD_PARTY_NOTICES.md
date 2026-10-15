# Third-party notices and provenance

Original PraxisForge AI code/documentation is copyright 2026 Zahidul Islam, all rights reserved, as stated in [LICENSE](LICENSE). Public availability permits inspection under that policy; it does not relicense dependencies, fonts, model weights or submitted content. This notice is an attribution inventory, not a replacement for each component's full license.

## Runtime and interface components

| Component                         | Role                          | Upstream license/reference                                                                                                                                |
| --------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nous Research Hermes Agent        | Pinned bounded agent runtime  | [MIT](https://github.com/NousResearch/hermes-agent/blob/30463589eb54fa0f48724594cc0e98e6b995729b/LICENSE); retain notice when distributing its source     |
| Next.js, React, React DOM         | Static-export frontend        | [Next.js MIT](https://github.com/vercel/next.js/blob/canary/license.md), [React MIT](https://github.com/facebook/react/blob/main/LICENSE)                 |
| Motion, Lenis                     | Animation and scrolling       | [Motion MIT](https://github.com/motiondivision/motion/blob/main/LICENSE.md), [Lenis MIT](https://github.com/darkroomengineering/lenis/blob/main/LICENSE)  |
| Lucide                            | Interface icons               | [ISC](https://github.com/lucide-icons/lucide/blob/main/LICENSE)                                                                                           |
| Zod                               | Public data/schema validation | [MIT](https://github.com/colinhacks/zod/blob/main/LICENSE)                                                                                                |
| FastAPI, Pydantic, Uvicorn, HTTPX | API, validation and serving   | Respective upstream package licenses; consult the exact locked distributions                                                                              |
| Psycopg                           | PostgreSQL adapter            | [LGPL](https://github.com/psycopg/psycopg/blob/master/LICENSE.txt); review distribution/linking obligations                                               |
| PostgreSQL                        | Authoritative database        | [PostgreSQL License](https://www.postgresql.org/about/licence/)                                                                                           |
| Ollama                            | Local inference service       | [MIT](https://github.com/ollama/ollama/blob/main/LICENSE); model weights have separate licenses                                                           |
| Qwen3-4B-Instruct-2507            | Current model family          | [Apache 2.0 model license](https://huggingface.co/Qwen/Qwen3-4B-Instruct-2507/blob/main/LICENSE); verify the actual quantized artifact and its provenance |

Exact frontend versions are in `package-lock.json`; Python versions are in `backend/requirements.lock`; Hermes revision/archive/base-image provenance is in `config/core-runtime.json`. Hermes is downloaded and verified during build preparation rather than vendored into this repository. A narrow recorded patch updates its PyJWT dependency metadata; upstream execution code is unchanged.

Container images include additional operating-system packages with their own notices. Preserve complete licenses/notices when redistributing images, bundled JavaScript, copied upstream source or model artifacts. This table is not a complete transitive dependency SBOM or legal distribution clearance. Review the exact shipped artifact, including optional packages, before redistribution.

## Fonts and visual assets

- **DM Sans:** copyright 2014 The DM Sans Project Authors; SIL Open Font License 1.1. Complete notice is retained in [dmsans-LICENSE.txt](public/fonts/dmsans-LICENSE.txt).
- **Instrument Serif:** copyright 2022 The Instrument Serif Project Authors; SIL Open Font License 1.1. Complete notice is retained in [instrumentserif-LICENSE.txt](public/fonts/instrumentserif-LICENSE.txt).
- The custom forged-knot hero artwork was generated for this project. It is not an upstream library asset or evidence of a customer endorsement. Do not infer exclusive copyright or a reuse grant from AI generation; the project's own publication/reuse policy remains applicable to its supplied asset collection.

Source documents submitted by users retain their own rights and confidentiality obligations. Model output can reproduce errors or protected material; human review and the model license do not establish permission to use third-party content. No affiliation or endorsement by upstream projects is claimed.
