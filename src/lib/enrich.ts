/**
 * Phase 2 — Enrichment.
 *   Hunter.io domain-search -> find a business email from the website domain.
 *
 * NOTE: email *verification* (NeverBounce) is intentionally skipped for now.
 * Found emails are marked "found" (not deliverability-checked). To add
 * verification later, re-introduce a verify step and map its result into
 * emailStatus (valid/invalid/catchall).
 *
 * Gracefully no-ops (and DEMO_MODE fabricates a plausible email) when the
 * Hunter key is absent, so the pipeline stays runnable end-to-end.
 */

export type EnrichResult = {
  email?: string;
  emailSource?: "hunter" | "places";
  emailStatus: "found" | "unknown";
};

function domainFromWebsite(website?: string | null): string | null {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ---- Hunter.io: find an email for a domain ----
async function findEmail(domain: string): Promise<string | null> {
  const key = process.env.HUNTER_API_KEY;
  const demo = (process.env.DEMO_MODE ?? "true") === "true";

  if (!key) {
    if (demo) return `info@${domain}`; // fabricated placeholder for demo
    return null;
  }

  const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(
    domain
  )}&limit=1&api_key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    data?: { emails?: Array<{ value?: string }>; email?: string };
  };
  return data.data?.emails?.[0]?.value ?? data.data?.email ?? null;
}

/**
 * Enrich a single lead: if it has no email, try to discover one from its
 * website domain. (No deliverability verification at this stage.)
 */
export async function enrichLead(input: {
  email?: string | null;
  website?: string | null;
}): Promise<EnrichResult> {
  let email = input.email ?? undefined;
  let emailSource: EnrichResult["emailSource"] = email ? "places" : undefined;

  if (!email) {
    const domain = domainFromWebsite(input.website);
    if (domain) {
      const found = await findEmail(domain);
      if (found) {
        email = found;
        emailSource = "hunter";
      }
    }
  }

  if (!email) return { emailStatus: "unknown" };
  return { email, emailSource, emailStatus: "found" };
}
