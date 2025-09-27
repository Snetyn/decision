# Decision Jar (PWA)

A mobile‑first Progressive Web App that visualizes your streak of decisions as a living jar of animated liquid.

## Features (MVP Stub)
- React + Vite + TypeScript + Tailwind + Framer Motion
- Animated SVG jar: dynamic wave, distortion filters mapped to red ratio
- Good / Bad decision logging with localStorage persistence (`decisions_v1`)
- Balance bubble reacting to ratio
- What‑if mode (simulate all as good without changing history)
- Undo last decision
- Color‑blind assist pattern toggle
- PWA manifest + service worker (offline app‑shell)
- Basic unit test for hook logic (Vitest + Testing Library)

## Data Model
Entries stored in localStorage as an array:
```json
{ "id": 1, "timestamp": "2025-09-26T10:00:00.000Z", "type": "good" }
```
Derived metrics: counts, ratios, fill percent, distortion.

## Animations (Roadmap)
- Droplet fall (present)
- Advanced ripple + ink dispersion (future)
- More organic wave path morphing
- Haptic-like button bounce (Framer Motion spring)

## Scripts
```bash
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
npm run lint     # lint source
npm run test     # run tests
```

## Service Worker
Current implementation: simple cache-first for app shell + opportunistic runtime caching of GET requests. Consider upgrading to Workbox for revisioned precache and finer strategies.

## Accessibility
- Large tap targets (>=56px buttons)
- Aria-live balance region
- Colorblind pattern overlay toggle

## Extending
See `src/components/Jar.tsx` for filter knobs (baseFrequency, displacement scale, blur). Map additional emotional states or streak multipliers here.

## License
MIT (add file if distributing publicly).
