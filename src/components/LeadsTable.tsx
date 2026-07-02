"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  emailStatus: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  score: number;
  enriched: boolean;
  status: string;
  emailSentAt: Date | string | null;
};

const STATUS_STYLES: Record<string, string> = {
  found: "bg-green-100 text-green-700",
  unknown: "bg-slate-100 text-slate-400",
};

const LEAD_STATUS_STYLES: Record<string, string> = {
  new: "bg-slate-100 text-slate-600 border-slate-200",
  contacted: "bg-indigo-50 text-indigo-700 border-indigo-200",
  interested: "bg-emerald-50 text-emerald-700 border-emerald-200",
  won: "bg-green-100 text-green-800 border-green-300 font-semibold",
  lost: "bg-red-50 text-red-700 border-red-200",
};

function replacePlaceholders(template: string, lead: Lead): string {
  if (!template) return "";
  return template
    .replace(/{businessName}/g, lead.name)
    .replace(/{name}/g, lead.name)
    .replace(/{rating}/g, lead.rating ? String(lead.rating) : "N/A")
    .replace(/{reviews}/g, lead.reviews ? String(lead.reviews) : "0")
    .replace(/{website}/g, lead.website || "")
    .replace(/{phone}/g, lead.phone || "")
    .replace(/{address}/g, lead.address || "");
}

function formatDate(dateInput: Date | string) {
  const date = new Date(dateInput);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export default function LeadsTable({
  leads,
  initialSubject,
  initialBody,
  campaignAttachmentName,
}: {
  leads: Lead[];
  initialSubject: string | null;
  initialBody: string | null;
  campaignAttachmentName: string | null;
}) {
  const router = useRouter();
  const [enriching, setEnriching] = useState<string | null>(null);

  // Email Modal State
  const [emailModalLead, setEmailModalLead] = useState<Lead | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailAttachment, setEmailAttachment] = useState<File | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  async function enrichOne(id: string) {
    setEnriching(id);
    await fetch(`/api/leads/${id}/enrich`, { method: "POST" });
    setEnriching(null);
    router.refresh();
  }

  function openEmailModal(lead: Lead) {
    const rawSubject = initialSubject || "Partnership opportunity with {businessName}";
    const rawBody = initialBody || (
      `Hi there,\n\n` +
      `I came across {businessName} while researching businesses in your area.\n\n` +
      (lead.rating ? `I was impressed by your rating of {rating} stars from {reviews} reviews. ` : "") +
      `I would love to chat briefly to see if we can work together.\n\n` +
      `Best regards,\n[Your Name]`
    );

    setEmailModalLead(lead);
    setEmailSubject(replacePlaceholders(rawSubject, lead));
    setEmailBody(replacePlaceholders(rawBody, lead));
    setEmailError(null);
    setEmailSuccess(false);
    setEmailAttachment(null);
  }

  async function handleSendEmail() {
    if (!emailModalLead) return;
    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(false);

    try {
      const formData = new FormData();
      formData.append("subject", emailSubject);
      formData.append("body", emailBody);
      if (emailAttachment) {
        formData.append("file", emailAttachment);
      }

      const res = await fetch(`/api/leads/${emailModalLead.id}/send-email`, {
        method: "POST",
        body: formData,
      });

      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d.error || "Failed to send email");
      }

      setEmailSuccess(true);
      router.refresh();

      setTimeout(() => {
        setEmailModalLead(null);
        setEmailSuccess(false);
        setEmailAttachment(null);
      }, 1500);
    } catch (err: any) {
      setEmailError(err.message || "An unexpected error occurred");
    } finally {
      setSendingEmail(false);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
        No leads yet. Click <span className="font-medium">Fetch leads</span> to pull businesses for this campaign.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <ScorePill score={l.score} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{l.name}</div>
                  {l.website && (
                    <a href={l.website} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
                      {l.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {l.address && <div className="text-xs text-slate-400">{l.address}</div>}
                </td>
                <td className="px-4 py-3">
                  {l.email ? (
                    <div className="flex flex-col gap-1">
                      <span>{l.email}</span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className={`w-fit rounded px-1.5 py-0.5 text-[11px] ${STATUS_STYLES[l.emailStatus] ?? STATUS_STYLES.unknown}`}>
                          {l.emailStatus}
                        </span>
                        {l.emailSentAt && (
                          <span className="text-[10px] text-slate-400">
                            Sent: {formatDate(l.emailSentAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{l.phone ?? <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3">
                  {l.rating ? (
                    <span>★ {l.rating.toFixed(1)} <span className="text-slate-400">({l.reviews ?? 0})</span></span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded border px-2 py-0.5 text-xs font-medium capitalize ${LEAD_STATUS_STYLES[l.status] || LEAD_STATUS_STYLES.new}`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {l.email && (
                      <button
                        onClick={() => openEmailModal(l)}
                        className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                      >
                        Email
                      </button>
                    )}
                    <button
                      onClick={() => enrichOne(l.id)}
                      disabled={enriching === l.id}
                      className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
                    >
                      {enriching === l.id ? "…" : l.enriched ? "Re-enrich" : "Enrich"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Email Modal Dialog */}
      {emailModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Send Live Email</h3>
                <p className="text-xs text-slate-500 mt-0.5">To: {emailModalLead.name} ({emailModalLead.email})</p>
              </div>
              <button
                onClick={() => setEmailModalLead(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </header>

            <div className="p-6 space-y-4">
              {emailSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    ✓
                  </div>
                  <h4 className="font-semibold text-slate-900">Email Sent Successfully!</h4>
                  <p className="text-sm text-slate-500">Lead status updated to "contacted".</p>
                </div>
              ) : (
                <>
                  {emailError && (
                    <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-600 flex gap-2">
                      <span className="font-bold">Error:</span>
                      <span>{emailError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label htmlFor="email-subject" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Subject</label>
                    <input
                      id="email-subject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                      placeholder="Email subject..."
                      disabled={sendingEmail}
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email-body" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Message Body</label>
                    <textarea
                      id="email-body"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={10}
                      className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none font-sans"
                      placeholder="Write your message here..."
                      disabled={sendingEmail}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Attachment (Optional)</label>

                    {campaignAttachmentName && !emailAttachment && (
                      <div className="mb-2 text-xs text-slate-500 flex items-center gap-1.5">
                        <span className="inline-block rounded bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 font-medium">
                          📎 Campaign Default: {campaignAttachmentName}
                        </span>
                        <span className="text-[10px] text-slate-400">(will send automatically)</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition inline-block"
                      >
                        {campaignAttachmentName && !emailAttachment ? "Override File" : "Choose File"}
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setEmailAttachment(file);
                        }}
                        disabled={sendingEmail}
                      />
                      <span className="text-xs text-slate-500 truncate max-w-xs">
                        {emailAttachment ? emailAttachment.name : campaignAttachmentName ? "Using campaign default" : "No file attached"}
                      </span>
                      {emailAttachment && (
                        <button
                          onClick={() => setEmailAttachment(null)}
                          className="text-[11px] text-red-500 hover:underline font-medium"
                          type="button"
                          disabled={sendingEmail}
                        >
                          Remove Override
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {!emailSuccess && (
              <footer className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEmailModalLead(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmail}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 flex items-center gap-1.5"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Sending…
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              </footer>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70 ? "bg-green-100 text-green-700" : score >= 40 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500";
  return <span className={`inline-block rounded-full px-2.5 py-1 font-semibold ${color}`}>{score}</span>;
}

