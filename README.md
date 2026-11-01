# استهلاكي — Saudi Electricity Consumption Calculator

Arabic-first web app for residential SEC electricity tariffs, mixed-capacity AC savings, and a seasonal annual projection.

Live Link: (https://istehlaki.vercel.app/)

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Deployed on Vercel from this GitHub repository

## Run locally

```bash
npm install
npm run dev
```


Type kWh from the paper bill. No PDF or photo upload.

## Deploy

Vercel builds from the `main` branch of this repo. After the first GitHub ↔ Vercel connection, every push to `main` publishes automatically.

Optional environment variables (Vercel → Project → Settings → Environment Variables):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GA_ID` | Google Analytics measurement ID (`G-…`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL for Open Graph / Facebook link previews |

## Tests

```bash
npm test
```

Tariff helpers live in `lib/tariffs.ts`.
