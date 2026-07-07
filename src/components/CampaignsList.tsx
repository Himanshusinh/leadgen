"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CampaignItem {
  id: string;
  name: string;
  industry: string;
  city: string | null;
  state: string | null;
  country: string | null;
  _count: {
    leads: number;
  };
}

export default function CampaignsList({ initialCampaigns }: { initialCampaigns: CampaignItem[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete the campaign "${name}"? This will delete all associated leads.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete campaign");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to delete campaign.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="mt-4 space-y-3">
      {initialCampaigns.map((c) => (
        <li key={c.id}>
          <Link
            href={`/dashboard/campaigns/${c.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-500 hover:shadow-sm transition group relative"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 group-hover:text-indigo-650 transition">{c.name}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md">
                  {c._count.leads} leads
                </span>
                <button
                  onClick={(e) => handleDelete(e, c.id, c.name)}
                  disabled={deletingId === c.id}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-650 transition shrink-0"
                  title="Delete Campaign"
                >
                  {deletingId === c.id ? (
                    <span className="inline-block h-4.5 w-4.5 animate-spin rounded-full border-2 border-red-650 border-t-transparent"></span>
                  ) : (
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {c.industry}
              {[c.city, c.state, c.country].filter(Boolean).length > 0 &&
                ` · ${[c.city, c.state, c.country].filter(Boolean).join(", ")}`}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
