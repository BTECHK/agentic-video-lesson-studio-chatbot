# Third-party notices

This repository's own code is released under the [PolyForm Noncommercial License 1.0.0](LICENSE). It bundles or references the
following third-party material, each under its own terms.

| Material | Where | License |
|---|---|---|
| Syne (variable font) | `public/fonts/Syne-Variable.ttf` | SIL Open Font License 1.1, see [`public/fonts/OFL.txt`](public/fonts/OFL.txt) |
| Playfair Display (variable font) | `public/fonts/PlayfairDisplay-Variable.ttf` | SIL Open Font License 1.1, see [`public/fonts/OFL.txt`](public/fonts/OFL.txt) |
| Vendor logos (OpenAI, Anthropic, Google, Perplexity, xAI) | `.claude/skills/animated-lesson/templates/lesson-template.html` | Trademarks of their respective owners, included only to identify the tools discussed |
| `watch` agent skill | `.claude/skills/watch/` | MIT, see the `LICENSE` file in that directory |
| Kokoro-82M speech model | Downloaded at run time by the `tts` Docker sidecar; not bundled | Apache-2.0 |
| npm dependencies (Remotion, Next.js, React, Zod, and others) | Installed from the npm registry; not bundled | Each package's own license; see `package-lock.json` |

Remotion has its own license terms for commercial use (see [remotion.dev/docs/license](https://www.remotion.dev/docs/license)).
Commercial use of this repository is not permitted by its own license in any case; the Remotion terms matter if you
build a separately licensed derivative.
