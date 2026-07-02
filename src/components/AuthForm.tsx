"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        <h1 className="text-2xl font-semibold">{isRegister ? "Create account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isRegister ? "Start finding leads in minutes." : "Log in to your dashboard."}
        </p>

        {isRegister && (
          <Field label="Name (optional)">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
        )}
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </Field>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-white font-medium hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Please wait…" : isRegister ? "Sign up" : "Log in"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          {isRegister ? (
            <>Already have an account? <Link className="text-brand-600" href="/login">Log in</Link></>
          ) : (
            <>No account? <Link className="text-brand-600" href="/register">Sign up</Link></>
          )}
        </p>
      </form>

      <style>{`.input{margin-top:.25rem;width:100%;border:1px solid #cbd5e1;border-radius:.5rem;padding:.5rem .75rem;outline:none}
        .input:focus{border-color:#6366f1;box-shadow:0 0 0 3px #e0e7ff}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-4 block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
