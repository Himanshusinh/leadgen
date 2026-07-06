"use client";

import { useState } from "react";
import Link from "next/link";

export default function CustomSendForm() {
  const [customEmailsInput, setCustomEmailsInput] = useState("");
  const [sendingCustomEmails, setSendingCustomEmails] = useState(false);
  const [customEmailsError, setCustomEmailsError] = useState<string | null>(null);
  const [customEmailsSuccess, setCustomEmailsSuccess] = useState(false);
  const [customEmailsSentCount, setCustomEmailsSentCount] = useState(0);

  // Calculate valid emails count on the fly
  const emailsList = customEmailsInput
    .split(/[\s,;\n]+/)
    .map((e) => e.trim())
    .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  async function handleSendCustomList(e: React.FormEvent) {
    e.preventDefault();
    if (emailsList.length === 0) {
      setCustomEmailsError("No valid email addresses detected in the input.");
      return;
    }

    setSendingCustomEmails(true);
    setCustomEmailsError(null);
    setCustomEmailsSuccess(false);

    try {
      const res = await fetch(`/api/email-custom-list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emails: emailsList.join(",") }),
      });

      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(d.error || "Failed to send custom emails.");
      }

      setCustomEmailsSentCount(d.sentCount);
      setCustomEmailsSuccess(true);
      setCustomEmailsInput("");
    } catch (err: any) {
      setCustomEmailsError(err.message || "Failed to send emails.");
    } finally {
      setSendingCustomEmails(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-indigo-650 hover:underline">
        &larr; Back to dashboard
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Email Custom List</h2>
          <p className="text-sm text-slate-500 mt-1">
            Send the active campaign template directly to custom emails.
          </p>
        </div>

        {customEmailsSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="rounded-full bg-green-100 p-4 text-green-600 text-2xl font-bold animate-bounce">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Emails Sent Successfully!</h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Dispatched the template layout to <strong className="text-slate-900">{customEmailsSentCount}</strong> email addresses.
            </p>
            <button
              onClick={() => setCustomEmailsSuccess(false)}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition animate-in fade-in duration-200"
            >
              Send more emails
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendCustomList} className="space-y-5">
            {customEmailsError && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-sm text-red-600 flex gap-2">
                <span className="font-bold">Error:</span>
                <span>{customEmailsError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="block text-sm font-medium text-slate-700">Email Addresses</label>
                {emailsList.length > 0 && (
                  <span className="text-xs font-semibold text-green-600">
                    {emailsList.length} valid email{emailsList.length > 1 ? "s" : ""} detected
                  </span>
                )}
              </div>
              <textarea
                value={customEmailsInput}
                onChange={(e) => setCustomEmailsInput(e.target.value)}
                placeholder="Enter or paste email addresses separated by commas, spaces, or newlines..."
                className="w-full h-48 rounded-lg border border-slate-200 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                required
                disabled={sendingCustomEmails}
              />
              <p className="text-xs text-slate-450 leading-relaxed font-normal">
                This will send the template configuration (Subject, Body, and PDF Attachment) from your latest active campaign. Placeholders like `{`{name}`}` will be customized using the username prefix of each recipient's email address.
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={sendingCustomEmails || emailsList.length === 0}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition shadow-sm"
              >
                {sendingCustomEmails ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Sending ({emailsList.length})…
                  </>
                ) : (
                  `Send Emails (${emailsList.length})`
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
