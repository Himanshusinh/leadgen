import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import CustomSendForm from "@/components/CustomSendForm";

export const dynamic = "force-dynamic";

export default async function CustomSendPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <CustomSendForm />
    </main>
  );
}
