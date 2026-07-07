"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MasterTemplateForm({
  initialSubject,
  initialBody,
  initialAttachmentName,
}: {
  initialSubject: string;
  initialBody: string;
  initialAttachmentName: string | null;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [templateAttachment, setTemplateAttachment] = useState<File | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<string | null>(initialAttachmentName);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  // Sync when props change
  useEffect(() => {
    setSubject(initialSubject);
    setBody(initialBody);
    setExistingAttachment(initialAttachmentName);
    setTemplateAttachment(null);
    setRemoveAttachment(false);
  }, [initialSubject, initialBody, initialAttachmentName]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("body", body);
      formData.append("removeAttachment", removeAttachment ? "true" : "false");
      if (templateAttachment) {
        formData.append("file", templateAttachment);
      }

      const res = await fetch("/api/template", {
        method: "POST",
        body: formData,
      });

      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d.error || "Failed to save template.");
      }

      setMsg({ type: "success", text: "Master template saved successfully!" });
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message || "Failed to save template." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Edit Email Template</h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure the default subject, HTML template layout, and attachment sent to B2B leads.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {msg && (
            <div
              className={`rounded-lg p-3.5 border text-sm flex gap-2 ${
                msg.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              <span>{msg.text}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Drone Light Show India"
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100">
              <label className="block text-sm font-semibold text-slate-700">Template HTML Body</label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                    tab === "edit"
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Edit HTML
                </button>
                <button
                  type="button"
                  onClick={() => setTab("preview")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
                    tab === "preview"
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {tab === "edit" ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste your HTML template code here..."
                className="w-full h-[460px] rounded-lg border border-slate-200 p-3 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed bg-slate-50"
                required
                disabled={saving}
              />
            ) : (
              <div className="w-full h-[460px] rounded-lg border border-slate-200 bg-white overflow-hidden">
                <iframe
                  title="Template Preview"
                  srcDoc={body}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Template Attachment File (Optional)</label>
            {existingAttachment && !removeAttachment ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-500">📎</span> {existingAttachment}
                </span>
                <button
                  type="button"
                  onClick={() => setRemoveAttachment(true)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                  disabled={saving}
                >
                  Remove File
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  setTemplateAttachment(e.target.files?.[0] || null);
                  setRemoveAttachment(false);
                }}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                disabled={saving}
              />
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition shadow-sm"
            >
              {saving ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Saving Layout…
                </>
              ) : (
                "Save Template"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
