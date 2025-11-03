# Mexicapitals

[![License](https://img.shields.io/github/license/manuel220x/capitals?style=flat-square)](https://github.com/manuel220x/capitals/blob/main/LICENSE)

Mexicapitals is a small, educational web app that helps students learn the 32 federative entities of Mexico: their capitals and the corresponding demonyms (gentilicios). The app combines a question-and-answer quiz with an interactive map so players also learn where each state is located — a helpful spatial side-effect while studying.

The user interface is in Spanish and is intentionally simple so it can be used in classrooms or for self-study.

## Key features

- Quiz-style interaction: users enter their name and answer two short questions per state (capital and demonym).
- Point system: answers are scored (perfect / partial / incorrect) and a final breakdown is shown.
- Interactive map: clicking a state opens the quiz for that state; completed states change color on the map.
- Progress table: shows per-state status, points, and lets users review their submitted answers.
- Mobile-friendly touches: tooltip popups and click-to-toggle help on small screens.

## How it works (brief)

- The app data lives in `mexicanStates.js` (one object per state with capital and accepted demonyms).
- `mx.svg` (loaded by `script.js`) provides the map; `stateMapping.js` maps state names to SVG element IDs.
- When the user clicks a state, a modal asks for the capital and the demonym. Answers are normalized (case, accents removed) and compared against accepted values.
- Scores are awarded: +10 for perfect (both correct), +5 for partial (one correct), -2 for both incorrect.

## Files of interest

- `index.html` — main UI (Spanish)
- `style.css` — styling
- `script.js` — core client logic (game flow, scoring, map wiring, tooltips)
- `mexicanStates.js` — canonical data (capitals, demonyms)
- `stateMapping.js` — mapping between `mexicanStates` keys and SVG IDs in `mx.svg`
- `mx.svg` — SVG map used by the app (expected in the same folder)
- `test_tooltips.py`, `test_popup.py`, etc. — Playwright scripts used to exercise UI behavior

## Run locally (quick)

These instructions assume you have Python 3.10+ installed. The app is a static site and can be served with a simple HTTP server.

1. Create and activate a virtual environment (optional but recommended):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
```

2. Install Playwright (only necessary if you want to run the automated tests):

```bash
pip install playwright
playwright install
```

3. Serve the project root (so the browser can fetch `mx.svg` and JS files):

```bash
# from the project folder that contains index.html
python3 -m http.server 8000
```

4. Open your browser at `http://localhost:8000` and you should see the welcome screen (UI in Spanish).

## Running the automated tests

The repository includes Playwright-based scripts (e.g. `test_tooltips.py`) that exercise the UI. They expect the app to be served on `http://localhost:8000`.

Example (after serving the site and activating the venv):

```bash
# install Playwright if not already installed
pip install playwright
playwright install

# run a test script directly with Python
python3 test_tooltips.py
```

Note: tests may assume a headless browser and the server running on port 8000. Adjust as needed.

## Configuration and data

- To update capitals or accepted demonyms, edit `mexicanStates.js`.
- If the SVG IDs change, update `stateMapping.js` accordingly so the map paths are correctly bound to state keys.


## Contributing

- Fixes and improvements are welcome. Keep UI copy in Spanish unless you intentionally add translations.
- When changing the `mexicanStates.js` data, include sources or notes if you add alternate accepted demonyms.

## License

Add your preferred license here (e.g., MIT, Apache-2.0).

## Contact / questions

Create an issue on this repo and I will answer there. 
