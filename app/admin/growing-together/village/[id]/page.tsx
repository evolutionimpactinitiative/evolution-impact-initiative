import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VillagePost } from "@/lib/supabase/types";
import { VillagePostForm } from "../VillagePostForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditVillagePostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: post } = await (admin as any)
    .from("village_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-4">
        <h1 className="font-heading font-black text-2xl text-brand-dark">
          Edit post
        </h1>
        <p className="text-sm text-gray-500 mt-1 truncate">
          {(post as VillagePost).title}
        </p>
      </div>
      <VillagePostForm post={post as VillagePost} />
    </div>
  );
}
