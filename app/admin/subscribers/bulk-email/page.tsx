import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BulkEmailForm } from "./BulkEmailForm";

export const metadata = {
  title: "Bulk Email | Admin | Evolution Impact Initiative",
};

export default async function BulkEmailPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get active subscribers count
  const { count } = await supabase
    .from("mailing_list" as "profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/subscribers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscribers
        </Link>
        <h1 className="font-heading font-black text-2xl md:text-3xl text-gray-900">
          Bulk Email
        </h1>
        <p className="text-gray-600 mt-1">
          Send an email to {count || 0} active subscribers
        </p>
      </div>

      <BulkEmailForm subscriberCount={count || 0} />
    </div>
  );
}
