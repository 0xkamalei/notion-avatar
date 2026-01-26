# Avatar Maker

AI-powered web app for generating clean black-and-white avatars from photos or text.

## Tech stack

- Next.js (Pages Router)
- Supabase (Auth + DB + Storage)
- Cloudflare Workers (via OpenNext) for deployment
- bun for dependency management

## Billing model

- Daily free quota: 1 shared free generation per day (site-wide, resets daily)
- Paid usage: recharge credits and pay per generation; credits charged are derived from estimated token usage with a configurable profit multiplier

