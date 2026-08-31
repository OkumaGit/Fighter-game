## Plan: Fighter portraits and random battle backgrounds

Update both UI stacks so fighter portraits use local assets everywhere they are shown, and make arena backgrounds randomize at the start of each fight. The current React client will gain portraits in the fighter selection UI and a random background passed into the arena. The legacy DOM client will reuse the same local fighter SVGs and choose one of three local battle backgrounds when a fight starts.

**Steps**

1. Confirm and standardize the asset set across both clients.
   - Reuse the existing fighter SVGs already present under the legacy client assets.
   - Add or mirror a shared set of 3 local battle background assets for both apps.
   - Keep fighter data pointing at local `source` paths so the selector and arena render the same portrait consistently.
2. Update the current React client selection UI to show portraits.
   - Extend `server/client/src/components/fighter/index.jsx` so each fighter option includes a thumbnail next to the name.
   - Keep the selected fighter summary showing the portrait and stats together.
   - Preserve the existing `Select` flow; only enrich the visual representation.
3. Randomize the current React battle background on fight start.
   - Add background selection in `server/client/src/components/fight/index.jsx` when `startBattle()` runs.
   - Pass the chosen background into `server/client/src/components/arena/index.jsx`.
   - Add background variants in `server/client/src/components/arena/arena.css` and make the arena root switch styles by background key.
4. Apply the same portrait and background behavior to the legacy DOM client.
   - Keep the fighter cards and preview components bound to local SVG sources in `client/src/javascript/components/fightersView.js` and `client/src/javascript/components/fighterPreview.js`.
   - Choose a random arena background when the legacy fight flow begins in `client/src/javascript/components/arena.js`.
   - Add the 3 background variants in `client/src/styles/arena.css` and ensure the selected variant is applied on the arena root.
5. Verify the change in both apps.
   - Run the current React client lint/build checks.
   - Run the legacy client lint/build checks if available in its package scripts.
   - Smoke-test that fighter portraits appear on the selection screen and that starting a fight selects one of the 3 backgrounds.

**Relevant files**

- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/server/client/src/components/fighter/index.jsx` — add fighter thumbnails to the React selector UI.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/server/client/src/components/fight/index.jsx` — pick and pass the random battle background at fight start.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/server/client/src/components/arena/index.jsx` — accept a background variant and apply it to the arena root.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/server/client/src/components/arena/arena.css` — define the React arena background variants.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/client/src/javascript/components/fightersView.js` — keep fighter card imagery sourced from local assets.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/client/src/javascript/components/fighterPreview.js` — keep preview images aligned with the same local asset map.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/client/src/javascript/components/arena.js` — choose a random battle background for the legacy arena.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/client/src/styles/arena.css` — define the legacy arena background variants.
- `/Users/okuma/Documents/Dev/fighter-game/Fighter-game/client/resources/fighters/` — existing fighter SVGs to reuse or mirror.

**Verification**

1. Run `npm run lint` and `npm run build` in `server/client`.
2. Run the available lint/build command in `client` if present.
3. Open the app in the browser and confirm the selection UI shows fighter portraits and the arena background changes across new fights.

**Decisions**

- Scope includes both UI implementations, not just the current React client.
- Fighter portraits should come from local files in the repo, not remote URLs.
- Background randomness should use a small fixed pool of 3 variants for predictable maintenance.
- The React selector should show portraits both in the dropdown options and in the selected fighter summary.

**Further Considerations**

1. If you want the three backgrounds to be fully image-based instead of CSS-only art, the next step is to place those files under each app's static asset path and wire the chosen URL through the same background key.
2. If you want the two clients to stay visually identical, I should mirror the same background names and fighter asset mapping in both stacks rather than letting them diverge.
