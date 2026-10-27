# Stumps & Sixes

A browser cricket game you can play on phone, tablet and desktop. Bat, bowl and chase down targets against computer teams. One HTML file, no dependencies, works offline.

## Play

Open `index.html` in any modern browser, or host it on any static host (GitHub Pages, Netlify, Cloudflare Pages).

## Features

- Full matches of 2, 5, 10 or 20 overs with a toss, two innings, a target and a result
- Practice nets mode with no wicket limit
- Batting: time your swing, aim into gaps in the field, optional loft for sixes
- Bowling: pick the bowler each over, then length, line, speed and field setting
- Fielding and dismissals: bowled, LBW, caught, caught behind, run out, edges, misfields
- Live scoreboard with batter stats, bowler figures and over-by-over results, plus a full scorecard
- Three difficulty levels, four teams, saved settings and stats
- Touch, mouse and keyboard controls

## Controls

| Action | Touch / mouse | Keyboard |
|---|---|---|
| Swing | Swing button or tap the pitch | Space |
| Aim | Aim slider | Left / Right |
| Loft | Loft button | Up / Down |
| Bowl | Bowl button | Space |
| Length | Length buttons | 1 to 4 |
| Line | Line slider | Left / Right |
| Field | Field buttons | F |
| Pause | Menu | Esc |

## Project layout

```
src/page.html              page shell and styles
src/01-utils-audio.js      helpers, teams, sound
src/02-field-and-shots.js  field geometry, delivery physics, shot and dismissal rules
src/03-match-engine.js     match state, AI bowlers and batters, innings flow
src/04-render.js           canvas drawing
src/05-ui-and-input.js     scoreboard, menus, overlays, input
build.js                   joins src/ into index.html
index.html                 the built game
```

## Build

Edit files in `src/`, then run `node build.js` to regenerate `index.html`. No packages to install.
