# GroomIQ

**Scheduling and client management for independent pet groomers.**

[Live app](https://groom-iq.vercel.app) · Next.js 16 · Prisma · Postgres · Stripe

## Why

Most groomers run their business out of a paper book, texts and memory. The software that exists is built for big salons and feels like it. GroomIQ bets that a small, fast tool with really good UX wins this market.

## What it does

- **Calendar** with day and week views. Drag an appointment to reschedule it
- **Clients and their pets** in one place
- **Services** with prices and default durations
- **Settings** for business hours, days open and default appointment length
- **Billing** with Stripe checkout and a customer portal. The free plan has a client limit, Pro removes it

## Design decisions

- **The calendar is the product.** It's where a groomer lives all day, so it got the most attention: drag to reschedule and a quick day and week toggle.
- **Fast data entry.** Searchable selects for clients and pets, and forms validated with zod so errors show up inline before you hit save.
- **Theme tokens in oklch** so colors stay consistent and easy to tune.
- **Limits enforced on the server.** The free plan cap is checked in the server action, not just hidden in the UI.

## Run it

```bash
npm install
npx prisma migrate dev
npm run dev
```

You'll need a `.env` with `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID` and `NEXT_PUBLIC_APP_URL`. See [STRIPE_SETUP.md](STRIPE_SETUP.md) for the Stripe side.

## Stack

Next.js 16 with React 19 and the React Compiler, Tailwind v4, shadcn and Radix, Prisma on Postgres (Supabase), Auth.js, Stripe, Vercel. Architecture diagrams live in [diagrams/](diagrams).
