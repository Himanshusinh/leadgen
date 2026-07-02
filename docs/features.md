## ✅ Already built (working right now)

**Auth**
- Register with email + password
- Login / logout
- Password hashing (bcrypt)
- JWT session in httpOnly cookie
- Protected routes (401 if not logged in)
- Each user only sees their own data

**Campaigns**
- Create campaign with: industry/niche, country, state, city
- Optional custom campaign name (auto-generated if blank)
- List all your campaigns (with lead count each)
- Open a single campaign
- Delete a campaign

**Lead fetching (Phase 1)**
- Fetch businesses from Google Places (New) API by industry + location
- Pulls: name, phone, website, address, rating, review count, place ID
- Demo mode (sample leads when no API key)
- Automatic dedupe (skips businesses already in the campaign)
- Re-fetch without creating duplicates

**Enrichment + scoring (Phase 2)**
- Find business email from website domain (Hunter.io)
- Enrich all leads in a campaign (bulk, batched)
- Enrich / re-enrich a single lead on demand
- Email status badge (found / unknown)
- Lead quality score 0–100 (email + phone + website + rating + reviews)
- Color-coded score pills (green / amber / grey)

**Leads table / UI**
- Sortable table (sorted by score)
- Shows score, business, website link, address, email + status, phone, rating
- Per-lead enrich button
- "Fetch leads" / "Enrich emails" / "Export CSV" buttons
- Status messages (e.g. "Fetched 10 new, 0 duplicates")
- Lead status field (new / contacted / interested / won / lost) — stored in DB, default "new"

**Export**
- Export campaign leads to CSV (all fields + score + status)

**Infra**
- SQLite for local dev / Postgres for production (one-line switch)
- Demo mode toggle so it runs without any API keys

---

## 🔜 Planned (not built yet)

**Phase 3 — Outreach + follow-ups**
- Connect email sending (SendGrid / Amazon SES)
- Email sequence builder (step → wait → follow-up)
- Automated scheduled follow-ups (background worker / queue)
- Open / click / reply tracking
- Unsubscribe handling (compliance)

**Phase 4 — CRM + analytics**
- Pipeline / Kanban board (drag leads: New → Contacted → Interested → Won)
- Auto-move lead to "Interested" on reply
- Notes / activity log per lead
- Dashboard metrics (leads found, sent, opened, replied, booked)
- Filtering / search inside lead table
- Edit lead details manually

**Phase 5 — Real high-intent leads**
- Landing-page form capture
- Google / Meta lead-ad integration
- Inbound lead intake (people who actually want the service)

**Other planned / nice-to-have**
- Email verification / deliverability check (we removed this — can re-add)
- More data sources (Yelp, OpenStreetMap, Apollo)
- Billing / subscription (Stripe) + lead credits
- Team accounts / multiple users
- Bulk actions (select + delete/export/tag)
- Rate-limit handling + retry for API calls

Want me to start on Phase 3, or add any of the Phase 4 "quick wins" (search/filter, manual edit, pipeline) to the current app first?