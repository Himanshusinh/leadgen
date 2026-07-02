/**
 * Phase 1 — Lead source: Google Places API (Text Search v1).
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Given an industry + location it returns businesses with name, phone,
 * website, address and rating. If no API key is set and DEMO_MODE is on,
 * it returns sample data so the UI is testable without billing.
 */

export type RawLead = {
  name: string;
  website?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  placeId?: string;
};

type Query = {
  industry: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

function buildQueryString(q: Query): string {
  return [q.industry, q.city, q.state, q.country].filter(Boolean).join(" ");
}

export async function fetchPlaces(q: Query): Promise<RawLead[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const demo = (process.env.DEMO_MODE ?? "true") === "true";

  if (!key) {
    if (demo) return demoLeads(q);
    throw new Error("GOOGLE_PLACES_API_KEY is not set (and DEMO_MODE is off).");
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      // Field mask controls which fields (and billing tier) are returned.
      "X-Goog-FieldMask": [
        "places.displayName",
        "places.formattedAddress",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.id",
      ].join(","),
    },
    body: JSON.stringify({ textQuery: buildQueryString(q), maxResultCount: 20 }),
    // Places API is server-to-server; don't cache personalised business pulls.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
      id?: string;
    }>;
  };

  return (data.places ?? []).map((p) => ({
    name: p.displayName?.text ?? "Unknown",
    website: p.websiteUri,
    phone: p.internationalPhoneNumber,
    address: p.formattedAddress,
    rating: p.rating,
    reviews: p.userRatingCount,
    placeId: p.id,
  }));
}

// ---- Demo data so the app runs end-to-end without an API key ----
function demoLeads(q: Query): RawLead[] {
  const loc = [q.city, q.state, q.country].filter(Boolean).join(", ") || "Sample City";
  const base = q.industry || "business";
  const names = [
    "Sunrise", "Green Valley", "Metro", "Prime", "Lakeside",
    "Citywide", "Apex", "Harmony", "Pioneer", "Evergreen",
  ];
  return names.map((n, i) => ({
    name: `${n} ${base[0].toUpperCase() + base.slice(1)} Center`,
    website: i % 4 === 0 ? undefined : `https://www.${n.toLowerCase()}${base.replace(/\s+/g, "")}.com`,
    phone: i % 5 === 0 ? undefined : `+1 555-0${100 + i}`,
    address: `${100 + i * 7} Main St, ${loc}`,
    rating: 3.5 + (i % 5) * 0.3,
    reviews: 10 + i * 13,
    placeId: `demo-${base}-${loc}-${i}`.replace(/\s+/g, "_"),
  }));
}
