# WheelSpin

A wheel for names, choices and party games, hosted at https://fingergame.co.uk/WheelSpin/.

## Development

Use Node 20.19+ or Node 22.12+.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The app retains its existing React/Vite stack and GitHub Pages deployment. Pushes to `master` build and test before publishing `dist` at the same `/WheelSpin/` path.

## Behaviour

- Up to 50 entries, with editable names and hexadecimal colours. Above 18 entries, the wheel displays numbers linked to a numbered list.
- Each entry has an equal chance. Duplicate names represent separate entries. Selection uses Web Crypto with rejection sampling; the animation lands on the selected segment centre.
- Editing is locked while spinning. Spins, removals, templates, imports, library changes and clearing results can be undone within the current session (up to 25 actions).
- Current wheel, settings, latest 50 results and up to 20 saved wheels persist on the current browser. Existing `wheelspin_items` lists migrate on first use. A storage error displays a notice while retaining an interactive session.
- Shared wheels are versioned, validated snapshots in the URL fragment. They contain title, names and colours; recipients preview before replacing their wheel. History and saved wheels are excluded. Links are readable by anyone holding them.
- Presentation mode removes surrounding controls. Space spins when not editing or interacting with another control; Escape closes a dialog or exits presentation mode.
- Reduced motion respects the device preference as well as the app setting. Sound is optional and off by default.
- Result CSV files escape quotes and protect against leading spreadsheet formulas.

## Validation

`npm test` checks landing alignment across 1–50 entries, rejection sampling, shared Unicode data, validation limits, legacy migration, corrupt storage recovery, and CSV escaping. Browser testing must also cover mobile editing, keyboard focus, animated spin locking, persistence, saved wheels, sharing and result actions.

For rollback, revert the release commit and push; Pages rebuilds the earlier app. Keep the version-2 browser data: it can be used again when the release is restored.
