/**
 * Phase 2 — Enrichment.
 *   Free Website Scraper -> crawl homepage and contact pages directly to extract email addresses.
 *   Hunter.io domain-search -> fallback to find a business email from the website domain.
 *
 * NOTE: email *verification* (NeverBounce) is intentionally skipped for now.
 * Found emails are marked "found" (not deliverability-checked).
 */

export type EnrichResult = {
  email?: string;
  emailSource?: "hunter" | "places" | "scraper";
  emailStatus: "found" | "unknown";
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function domainFromWebsite(website?: string | null): string | null {
  if (!website) return null;
  try {
    const u = new URL(website.startsWith("http") ? website : `https://${website}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// ---- Direct Web Crawler & Email Extractor ----

async function fetchWithTimeout(url: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
  } finally {
    clearTimeout(id);
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url, 4000);
    if (res.ok) {
      return await res.text();
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

function findContactLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const link = match[1];
    if (
      /contact|about|support|info|reach|help/i.test(link) &&
      !/\.(pdf|zip|png|jpe?g|mp4)$/i.test(link)
    ) {
      try {
        const resolved = new URL(link, baseUrl).toString();
        links.push(resolved);
      } catch {
        // Ignore invalid URLs
      }
    }
  }
  return Array.from(new Set(links));
}

function cleanAndExtractEmails(html: string, domain: string): string[] {
  const matches = html.match(EMAIL_REGEX) || [];
  const uniqueEmails = Array.from(new Set(matches.map(e => e.toLowerCase())));

  return uniqueEmails.filter(email => {
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const domainPart = parts[1];

    // Ignore common image/media formats
    if (/\.(png|jpe?g|gif|webp|svg|css|js|woff2?|tiff?|bmp|pdf|zip|tar)$/i.test(domainPart)) {
      return false;
    }

    // Ignore common system/generic placeholder domains (like example.com)
    if (domainPart.includes("example") || domainPart.includes("w3.org") || domainPart.includes("sentry")) {
      return false;
    }

    return true;
  });
}

function selectBestEmail(emails: string[]): string {
  const priorities = ["info@", "contact@", "sales@", "hello@", "admin@", "support@", "office@"];
  for (const prefix of priorities) {
    const found = emails.find(e => e.startsWith(prefix));
    if (found) return found;
  }
  return emails[0];
}

async function scrapeEmailsFromWebsite(websiteUrl: string): Promise<string | null> {
  try {
    const startUrl = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    const parsedUrl = new URL(startUrl);
    const domain = parsedUrl.hostname.replace(/^www\./, "");

    // Fetch and scan homepage
    const homeHtml = await fetchHtml(startUrl);
    if (!homeHtml) return null;

    let emails = cleanAndExtractEmails(homeHtml, domain);
    if (emails.length > 0) {
      return selectBestEmail(emails);
    }

    // Find contact page links in the HTML
    const contactLinks = findContactLinks(homeHtml, startUrl);

    // Scan up to 2 contact/about links
    for (const url of contactLinks.slice(0, 2)) {
      const html = await fetchHtml(url);
      if (html) {
        emails = cleanAndExtractEmails(html, domain);
        if (emails.length > 0) {
          return selectBestEmail(emails);
        }
      }
    }
  } catch (e) {
    console.error("Scraper error for url:", websiteUrl, e);
  }
  return null;
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
 * website using scraping first, and fall back to Hunter.io.
 */
export async function enrichLead(input: {
  email?: string | null;
  website?: string | null;
}): Promise<EnrichResult> {
  let email = input.email ?? undefined;
  let emailSource: EnrichResult["emailSource"] = email ? "places" : undefined;

  if (!email && input.website) {
    // 1. Try direct website email scraping first (completely free and direct)
    const scraped = await scrapeEmailsFromWebsite(input.website);
    if (scraped) {
      email = scraped;
      emailSource = "scraper";
    } else {
      // 2. Fall back to Hunter.io if scraping fails
      const domain = domainFromWebsite(input.website);
      if (domain) {
        const found = await findEmail(domain);
        if (found) {
          email = found;
          emailSource = "hunter";
        }
      }
    }
  }

  if (!email) return { emailStatus: "unknown" };
  return { email, emailSource, emailStatus: "found" };
}
