"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CampaignActions({
  campaignId,
  leadCount,
  initialSubject,
  initialBody,
  initialAttachmentName,
  uncontactedEmailCount = 0,
  hasTemplate = false,
}: {
  campaignId: string;
  leadCount: number;
  initialSubject: string | null;
  initialBody: string | null;
  initialAttachmentName: string | null;
  uncontactedEmailCount?: number;
  hasTemplate?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "fetch" | "enrich" | "delete">(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Template Modal State
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [bodyTemplate, setBodyTemplate] = useState("");
  const [templateAttachment, setTemplateAttachment] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<string | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMsg, setTemplateMsg] = useState<string | null>(null);
  const [templateTab, setTemplateTab] = useState<"edit" | "preview">("edit");

  // Email All Modal State
  const [emailAllModalOpen, setEmailAllModalOpen] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailAllError, setEmailAllError] = useState<string | null>(null);
  const [emailAllSuccess, setEmailAllSuccess] = useState(false);
  const [emailAllSentCount, setEmailAllSentCount] = useState(0);

  // Sync state when props change
  useEffect(() => {
    setSubjectTemplate(initialSubject || "");
    setBodyTemplate(initialBody || "");
    setExistingAttachment(initialAttachmentName);
    setTemplateAttachment(null);
    setRemoveAttachment(false);
  }, [initialSubject, initialBody, initialAttachmentName]);

  async function handleEmailAll() {
    setSendingEmails(true);
    setEmailAllError(null);
    setEmailAllSuccess(false);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/email-all`, {
        method: "POST",
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d.error || "Failed to send bulk emails.");
      }

      setEmailAllSentCount(d.sentCount);
      setEmailAllSuccess(true);
      router.refresh();

      setTimeout(() => {
        setEmailAllModalOpen(false);
        setEmailAllSuccess(false);
      }, 2000);
    } catch (err: any) {
      setEmailAllError(err.message || "Failed to send bulk emails.");
    } finally {
      setSendingEmails(false);
    }
  }

  async function fetchLeads() {
    setBusy("fetch");
    setMsg(null);
    const res = await fetch(`/api/campaigns/${campaignId}/fetch`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setMsg(d.error || "Fetch failed.");
    setMsg(`Fetched ${d.inserted} new leads (${d.skipped} duplicates skipped).`);
    router.refresh();
  }

  async function enrichAll() {
    setBusy("enrich");
    setMsg(null);
    let total = 0;
    while (true) {
      const res = await fetch(`/api/campaigns/${campaignId}/enrich`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBusy(null);
        return setMsg(d.error || "Enrichment failed.");
      }
      total += d.processed;
      if (d.remaining === 0 || d.processed === 0) break;
    }
    setBusy(null);
    setMsg(`Enriched ${total} leads.`);
    router.refresh();
  }

  async function saveTemplate() {
    setSavingTemplate(true);
    setTemplateMsg(null);
    try {
      const formData = new FormData();
      formData.append("subject", subjectTemplate);
      formData.append("body", bodyTemplate);
      formData.append("removeAttachment", removeAttachment ? "true" : "false");
      if (templateAttachment) {
        formData.append("file", templateAttachment);
      }

      const res = await fetch(`/api/campaigns/${campaignId}/template`, {
        method: "POST",
        body: formData,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d.error || "Failed to save template.");
      }
      setTemplateMsg("Template saved successfully!");
      router.refresh();
      setTimeout(() => {
        setTemplateModalOpen(false);
        setTemplateMsg(null);
      }, 1500);
    } catch (err: any) {
      setTemplateMsg(err.message || "Failed to save template.");
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleDeleteCampaign() {
    if (
      !window.confirm(
        "Are you sure you want to delete this campaign? This action is permanent and will delete all associated leads."
      )
    ) {
      return;
    }
    setBusy("delete");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete campaign");
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete campaign");
      setBusy(null);
    }
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button
            onClick={fetchLeads}
            disabled={busy !== null}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy === "fetch" ? "Fetching…" : "Fetch leads"}
          </button>
          <button
            onClick={enrichAll}
            disabled={busy !== null || leadCount === 0}
            className="rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          >
            {busy === "enrich" ? "Enriching…" : "Enrich emails"}
          </button>
          <button
            onClick={() => setTemplateModalOpen(true)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
          >
            ✉ Template
          </button>
          <button
            onClick={() => setEmailAllModalOpen(true)}
            disabled={busy !== null || uncontactedEmailCount === 0 || !hasTemplate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
            title={!hasTemplate ? "Please configure a template first" : ""}
          >
            Email All ({uncontactedEmailCount})
          </button>
          <a
            href={`/api/campaigns/${campaignId}/export`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white"
          >
            Export CSV
          </a>
          <button
            onClick={handleDeleteCampaign}
            disabled={busy !== null}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 flex items-center gap-1.5 transition"
            title="Delete Campaign"
          >
            {busy === "delete" ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent"></span>
                Deleting…
              </>
            ) : (
              "Delete Campaign"
            )}
          </button>
        </div>
        {msg && <p className="text-sm text-slate-500">{msg}</p>}
      </div>

      {/* Configure Template Modal */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            <header className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Campaign Email Template</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define a default subject and body template for this campaign.</p>
              </div>
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </header>

            <div className="p-6 space-y-4">
              {templateMsg && (
                <div className={`rounded-lg p-3 border text-sm flex gap-2 ${templateMsg.includes("successfully") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                  <span>{templateMsg}</span>
                </div>
              )}

              <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3.5 text-xs text-indigo-700 space-y-1">
                <span className="font-semibold uppercase tracking-wider block">Available Placeholder Tags:</span>
                <p className="leading-relaxed">
                  Use these tags to dynamically insert lead details:
                  <code className="mx-1 px-1 py-0.5 rounded bg-indigo-100 font-mono text-[11px] font-semibold">{`{businessName}`}</code>,
                  <code className="mx-1 px-1 py-0.5 rounded bg-indigo-100 font-mono text-[11px] font-semibold">{`{rating}`}</code>,
                  <code className="mx-1 px-1 py-0.5 rounded bg-indigo-100 font-mono text-[11px] font-semibold">{`{reviews}`}</code>,
                  <code className="mx-1 px-1 py-0.5 rounded bg-indigo-100 font-mono text-[11px] font-semibold">{`{website}`}</code>,
                  <code className="mx-1 px-1 py-0.5 rounded bg-indigo-100 font-mono text-[11px] font-semibold">{`{phone}`}</code>,
                  <code className="mx-1 px-1 py-0.5 rounded bg-indigo-100 font-mono text-[11px] font-semibold">{`{address}`}</code>.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="template-subject" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Default Subject</label>
                <input
                  id="template-subject"
                  type="text"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  placeholder="e.g. Partnership opportunity with {businessName}"
                  disabled={savingTemplate}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="template-body" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Default Message Body</label>
                  <div className="flex border border-slate-200 rounded overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setTemplateTab("edit")}
                      className={`px-2.5 py-1 text-[11px] font-medium transition ${templateTab === "edit" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateTab("preview")}
                      className={`px-2.5 py-1 text-[11px] font-medium transition ${templateTab === "preview" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {templateTab === "edit" ? (
                  <textarea
                    id="template-body"
                    value={bodyTemplate}
                    onChange={(e) => setBodyTemplate(e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-brand-500 focus:outline-none font-sans"
                    placeholder="e.g. Hi there, I came across {businessName}..."
                    disabled={savingTemplate}
                  />
                ) : (
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 overflow-hidden h-64">
                    {bodyTemplate.includes("<html") || bodyTemplate.includes("<!DOCTYPE") ? (
                      <iframe
                        srcDoc={bodyTemplate.replace(/{businessName}/g, "Example Business")}
                        className="w-full h-full border-0 bg-white"
                        title="Template Live Preview"
                      />
                    ) : (
                      <pre className="p-3 text-xs font-sans text-slate-600 whitespace-pre-wrap leading-relaxed h-full overflow-y-auto">
                        {bodyTemplate.replace(/{businessName}/g, "Example Business")}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Template Attachment (Optional)</label>

                {existingAttachment && !removeAttachment ? (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-xs">
                      📎 {existingAttachment} (Saved)
                    </span>
                    <button
                      type="button"
                      onClick={() => setRemoveAttachment(true)}
                      className="text-[11px] text-red-500 hover:underline font-medium ml-auto"
                      disabled={savingTemplate}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="template-file-upload"
                      className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition inline-block"
                    >
                      Choose File
                    </label>
                    <input
                      id="template-file-upload"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setTemplateAttachment(file);
                        if (file) setRemoveAttachment(false);
                      }}
                      disabled={savingTemplate}
                    />
                    <span className="text-xs text-slate-500 truncate max-w-xs">
                      {templateAttachment ? templateAttachment.name : "No file attached"}
                    </span>
                    {templateAttachment && (
                      <button
                        onClick={() => setTemplateAttachment(null)}
                        className="text-[11px] text-red-500 hover:underline font-medium"
                        type="button"
                        disabled={savingTemplate}
                      >
                        Remove
                      </button>
                    )}
                    {removeAttachment && (
                      <span className="text-xs text-amber-600 font-medium">
                        (Saved attachment will be deleted on Save)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-end gap-2">
              <button
                onClick={() => setTemplateModalOpen(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={savingTemplate}
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60 flex items-center gap-1.5"
                disabled={savingTemplate}
              >
                {savingTemplate ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Saving…
                  </>
                ) : (
                  "Save Template"
                )}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Email All Confirmation Modal */}
      {emailAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            <header className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Email All Leads</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bulk outreach campaign</p>
              </div>
              <button
                onClick={() => setEmailAllModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                disabled={sendingEmails}
              >
                ✕
              </button>
            </header>

            <div className="p-6 space-y-4">
              {emailAllSuccess ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <div className="rounded-full bg-green-100 p-3 text-green-600">
                    ✓
                  </div>
                  <h4 className="font-semibold text-slate-900">Emails Sent!</h4>
                  <p className="text-sm text-slate-500 text-center">Successfully sent {emailAllSentCount} emails to your leads.</p>
                </div>
              ) : (
                <>
                  {emailAllError && (
                    <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-600 flex gap-2">
                      <span className="font-bold">Error:</span>
                      <span>{emailAllError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      You are about to send the default email template to all <strong className="text-slate-900">{uncontactedEmailCount}</strong> uncontacted leads in this campaign.
                    </p>
                    <div className="rounded-lg bg-slate-50 border border-slate-150 p-3.5 space-y-1.5 text-xs text-slate-500">
                      <div>
                        <span className="font-semibold text-slate-700">Subject:</span> {initialSubject}
                      </div>
                      {initialAttachmentName && (
                        <div>
                          <span className="font-semibold text-slate-700">Attachment:</span> 📎 {initialAttachmentName}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-amber-600 font-medium">
                      Note: This action will personalize the template fields (like business name) for each recipient.
                    </p>
                  </div>
                </>
              )}
            </div>

            {!emailAllSuccess && (
              <footer className="border-t border-slate-100 bg-slate-50 px-6 py-3.5 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEmailAllModalOpen(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={sendingEmails}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailAll}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-1.5"
                  disabled={sendingEmails}
                >
                  {sendingEmails ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Sending ({uncontactedEmailCount})…
                    </>
                  ) : (
                    "Send to All"
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




