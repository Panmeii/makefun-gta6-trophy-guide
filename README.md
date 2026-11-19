# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Panmeii/makefun-gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Panmeii/makefun-gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline web app that is both a guide and a tracker for the **55 official PlayStation 5 trophies of Grand Theft Auto VI**. Open `app/index.html` in a desktop browser (or serve the `app/` folder with any static server) — it works with the network off and loads nothing from outside its own files.

Built for the make.fun bounty [Build the best GTA 6 trophy guide](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **The full official list** — every one of the 55 trophies with its exact official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze), as PlayStation publishes them.
- **A guide to every trophy, in our own words**, saying what to do, where and how, and when it can be missed — with its **sources cited beside it**. Where launch coverage has not confirmed a trigger yet (five trophies), the guide says exactly that instead of inventing steps.
- **A tracker, not just a list** — tick trophies off and progress is saved in the browser (localStorage), with **export and import** to a JSON file. The 20 trophies PlayStation tracks with a count (250 stunts, 42 range golds, $250,000 laundered…) get **counters with steppers** that auto-earn at the target.
- **Filters** by grade (the `<select id="grade">` is the single source of truth, exactly as the kit's starter wired it), by kind — story, strangers, activities, collectibles, misc — plus full-text search.
- **Spoiler protection** — 28 of the trophies are hidden on PlayStation until earned. With protection on (the default), unearned hidden trophies are masked console-style: no name, no description, and no leak through search or the guide panel, until you earn or deliberately reveal them.
- **A six-stage roadmap to the platinum** — Chapter 1 carefully, the story, strangers, activities, free-roam cleanup, then 100% and the platinum — with per-stage progress and every trophy placed on it.
- **Missables, flagged honestly** — exactly one trophy is suspected missable, *Positive Mental Attitude*, and it is flagged everywhere it appears, with the Chapter 1 warning up front. The Missables view also covers the cheats warning, the single-sourced stranger-chain caution, and why everything else is safe.

## Run it

```sh
node serve.ts          # serves app/ at http://localhost:8080
# or open app/index.html through any static file server
```

## Hand in (maintainers)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` first validates the entry — exactly 55 trophies, the exact grade split, a real sourced guide for each, a complete six-stage roadmap, screenshots inside the caps — and refuses (non-zero exit) if anything is off. It then copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `vendor/makefun-frontend.ts`, byte for byte as the scorer expects.

Screenshots in `screenshots/` are real renders of this app in Chromium, taken with `tools/take-screenshots.py` following `shots.json` (checklist, the silver filter, the bronze filter scrolled 1400px, and the roadmap).

## License

MIT — see `LICENSE`. Trophy names and descriptions are PlayStation's official list; everything else here, including all guide text and the design, is original to this repository. No Rockstar Games logo or artwork is used.
