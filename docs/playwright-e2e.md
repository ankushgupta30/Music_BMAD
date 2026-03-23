# Playwright smoke tests

One-time (per machine / after `npm ci`):

```bash
npx playwright install chromium
```

Run (builds the app, starts `next start` on **port 3005**, runs tests — avoids clashing with `next dev` on 3000):

```bash
npm run test:e2e
```

Manual run (server already up on 3005):

```bash
npm run build && npm run start -- --port 3005
# other terminal:
npx playwright test
```

Vercel does not run these by default; add a CI job if you want them on every PR.
