import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";

export default async function Home() {
  const userId = await getUserId();
  if (userId) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">LeadGen</h1>
      <p className="mt-4 max-w-xl text-slate-600">
        Find businesses by industry and location, enrich them with emails,
        score lead quality, and export — all in one place.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/register"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-white font-medium hover:bg-brand-700"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-slate-300 px-5 py-2.5 font-medium hover:bg-white"
        >
          Log in
        </Link>
      </div>
      <p className="mt-10 text-xs text-slate-400">
        Phase 1 — fetch & export · Phase 2 — enrich & score
      </p>
    </main>
  );
}
