"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCampaignForm() {
  const router = useRouter();
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry.trim()) return setError("Industry / niche is required.");
    setError(null);
    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry, country, state, city }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      return setError(d.error || "Could not create campaign.");
    }
    const c = await res.json();
    router.push(`/dashboard/campaigns/${c.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
      <h2 className="font-semibold">New campaign</h2>
      <p className="mt-1 text-sm text-slate-500">
        Pick a niche and the area you want leads from.
      </p>

      <label className="mt-4 block text-sm font-medium">
        Industry / niche *
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="e.g. dentist, gym, physiotherapy"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">
          Country
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="USA"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none" />
        </label>
        <label className="block text-sm font-medium">
          State
          <input value={state} onChange={(e) => setState(e.target.value)} placeholder="Texas"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none" />
        </label>
      </div>

      <label className="mt-3 block text-sm font-medium">
        City
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none" />
      </label>

      <label className="mt-3 block text-sm font-medium">
        Campaign name (optional)
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto-generated if blank"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none" />
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        disabled={loading}
        className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create campaign"}
      </button>
    </form>
  );
}
