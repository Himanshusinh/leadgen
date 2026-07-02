# LeadGen — Phase 1 + 2

A lead-generation platform: find businesses by **industry + location**, **enrich** them
with verified emails, **score** quality, and **export** to CSV.

- **Phase 1** — Auth, campaigns, fetch leads from Google Places, dedupe, table, CSV export.
- **Phase 2** — Enrich emails (Hunter.io) + lead scoring. (Email verification skipped for now.)

## Stack
Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · JWT cookie auth.

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   - set DATABASE_URL to your Postgres
#   - set JWT_SECRET (openssl rand -base64 32)
#   - API keys are OPTIONAL: with DEMO_MODE="true" the app uses sample data
#     so you can click through the whole flow without billing.

# 3. Create the database schema
createdb leadgen          # or use any Postgres instance
npm run db:generate
npm run db:push

# 4. Run
npm run dev               # http://localhost:3000
```

## Demo mode
With no API keys and `DEMO_MODE="true"`:
- **Fetch leads** returns 10 sample businesses for your industry/location.
- **Enrich** fabricates a plausible `info@domain` email (marked `found`).

Add real keys to `.env` to switch to live data — no code changes needed.

## How the flow works
1. Register / log in.
2. Create a campaign (industry + country/state/city).
3. **Fetch leads** → pulls from Google Places, dedupes by place id, scores each.
4. **Enrich** → finds emails (Hunter.io), recomputes the score.
5. **Export CSV** → download the list.

## What's next (roadmap)
- **Phase 3** — outreach sequences + follow-ups (move enrichment to a BullMQ worker).
- **Phase 4** — CRM pipeline + analytics dashboard.
- **Phase 5** — intent-based lead capture (the high-converting leads).

## Compliance note
Use official APIs (not scraping). For outreach follow CAN-SPAM / GDPR / India DPDP:
always include an unsubscribe option and honour opt-outs.
# leadgen
