# ChangedGames — self-hosted PS2 player

This repository contains the ChangedGames desktop-first website and a GitHub Actions workflow that builds the browser version of [Play!](https://github.com/jpd002/Play-).

## How the self-hosted build works

1. The workflow checks out the upstream Play! source and its submodules.
2. It compiles the browser WebAssembly core with Emscripten.
3. It builds the official React browser frontend.
4. It copies the generated static app, JavaScript and WebAssembly files into `/emulator`.
5. It commits the generated player files back to this repository. Netlify can then publish them as ordinary static assets.

The workflow runs when its workflow file is first added/changed, and can also be started manually from **GitHub → Actions → Build self-hosted Play! emulator → Run workflow**.

## Netlify

Connect this repository to Netlify. The included `netlify.toml` publishes the repository root as a static site. After the GitHub Actions build finishes and commits the `emulator/` directory, Netlify's normal Git deployment should publish the self-hosted player at `/emulator/index.html`.

## Notes

- The browser version of Play! is experimental; compatibility and performance vary.
- No commercial game images are included. Use only game files you have the right to use.
- The upstream Play! license is included with the generated player at `emulator/PLAY-LICENSE.txt`.
- Upstream project: https://github.com/jpd002/Play-
