# NHL Player Ratings — Static Demo Website

This is a static demo website that:

- Fetches current NHL rosters from the public NHL Stats API (`statsapi.web.nhl.com`).
- Fetches each player's season statistics (client-side).
- Computes a simple 0–100 rating per player using available stats and optional external fantasy ranking JSON.
- Renders rosters grouped by team.

## What you get in this ZIP
- `index.html` — main page.
- `styles.css` — styling.
- `script.js` — JavaScript to fetch data and compute ratings.
- `README.md` — this file.
- `LICENSE.txt` — MIT license.

## How the rating is computed (summary)
1. If you provide an external fantasy ranking JSON URL (via the input on the page), the code attempts to consume it. Expected formats:
   - Array of objects: `[{"playerId":8478402,"rank":12}, ...]`
   - Object mapping: `{"8478402":12, ...}`

   The external rank contributes ~40% of the composite score (higher rank -> higher score).

2. If external rankings aren't provided or unavailable, the site uses season stats (points, shots) that it pulls from the NHL API to create a normalized score.

3. Final mapping is normalized and scaled to 0–100. This is a simple, client-side demonstration — you can refine weights and inputs in `script.js`.

## Notes & limitations
- This demo fetches data directly from the NHL public API from the user's browser. There are no API keys required, but heavy usage may hit rate limits.
- For a production deployment, add server-side caching and rate limit handling, plus better handling of seasons and partial data.
- The script currently requests 2024–25 season stats. If you want a different season, update the `season` parameter in `script.js` (line with statsSingleSeason).
- External fantasy ranking sources must be CORS-enabled to be fetchable from the browser.

## How to run
1. Unzip the files.
2. Open `index.html` in a modern browser (Chrome/Edge/Firefox).
3. Select a team or "All NHL Teams", optionally paste a fantasy ranking JSON URL, then click "Load Roster & Compute Ratings".

## License
MIT. See `LICENSE.txt`.
