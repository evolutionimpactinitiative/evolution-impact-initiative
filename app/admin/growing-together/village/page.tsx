import Link from "next/link";
import {
  Plus,
  Pin,
  Eye,
  EyeOff,
  Calendar,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import type { VillagePost } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORY_META: Record<
  VillagePost["category"],
  { label: string; icon: string }
> = {
  activity: { label: "Activity", icon: "🎉" },
  announcement: { label: "Announcement", icon: "📣" },
  local_service: { label: "Local service", icon: "🏥" },
  programme_update: { label: "Programme update", icon: "📢" },
  resource: { label: "Resource", icon: "📚" },
};

export default async function VillageAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status = "all", category = "all" } = await searchParams;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from("village_posts")
    .select("*")
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (category !== "all") query = query.eq("category", category);

  const { data: posts } = await query;
  const rows = (posts as VillagePost[] | null) ?? [];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link
          href="/admin/growing-together"
          className="inline-flex items-center gap-1 hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Growing Together
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-brand-blue" />
            <h1 className="font-heading font-black text-2xl lg:text-3xl text-brand-dark">
              Our Village
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            The moderated community feed families see in their portal. No comments,
            no DMs — one-way updates from the team.
          </p>
        </div>
        <Button
          asChild
          className="bg-brand-blue hover:bg-brand-dark text-white font-heading font-bold"
        >
          <Link href="/admin/growing-together/village/new">
            <Plus className="h-4 w-4 mr-2" />
            New post
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterLink current={status} value="all" param="status">
          All statuses
        </FilterLink>
        <FilterLink current={status} value="published" param="status">
          Published
        </FilterLink>
        <FilterLink current={status} value="draft" param="status">
          Drafts
        </FilterLink>
        <FilterLink current={status} value="archived" param="status">
          Archived
        </FilterLink>
        <span className="w-px h-6 bg-gray-200 mx-1" />
        <FilterLink current={category} value="all" param="category">
          All categories
        </FilterLink>
        {(
          Object.entries(CATEGORY_META) as [VillagePost["category"], { label: string; icon: string }][]
        ).map(([key, meta]) => (
          <FilterLink key={key} current={category} value={key} param="category">
            {meta.icon} {meta.label}
          </FilterLink>
        ))}
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-gray-500 mb-4">No posts match these filters.</p>
          <Button
            asChild
            variant="outline"
            className="border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Link href="/admin/growing-together/village/new">
              <Plus className="h-4 w-4 mr-1" />
              Create your first post
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {rows.map((post) => (
            <li key={post.id}>
              <Link
                href={`/admin/growing-together/village/${post.id}`}
                className="block p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4">
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-brand-pale/60 text-2xl flex items-center justify-center flex-shrink-0">
                      {CATEGORY_META[post.category].icon}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {CATEGORY_META[post.category].label}
                      </span>
                      {post.pinned && (
                        <span className="inline-flex items-center gap-1 text-xs bg-brand-blue/10 text-brand-blue rounded-full px-2 py-0.5">
                          <Pin className="h-3 w-3" />
                          Pinned
                        </span>
                      )}
                      <StatusPill status={post.status} />
                    </div>
                    <p className="font-heading font-bold text-brand-dark truncate">
                      {post.title}
                    </p>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                      {post.event_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.event_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {post.published_at && (
                        <span>
                          Published{" "}
                          {new Date(post.published_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                      {post.expires_at && (
                        <span className="text-yellow-700">
                          Expires{" "}
                          {new Date(post.expires_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterLink({
  current,
  value,
  param,
  children,
}: {
  current: string;
  value: string;
  param: "status" | "category";
  children: React.ReactNode;
}) {
  const active = current === value;
  const params = new URLSearchParams();
  if (value !== "all") params.set(param, value);
  const href = `/admin/growing-together/village${params.toString() ? `?${params.toString()}` : ""}`;
  return (
    <Link
      href={href}
      className={`text-xs px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-brand-blue text-white border-brand-blue"
          : "bg-white text-brand-dark border-gray-200 hover:border-brand-blue"
      }`}
    >
      {children}
    </Link>
  );
}

function StatusPill({ status }: { status: VillagePost["status"] }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-brand-green/10 text-brand-green rounded-full px-2 py-0.5">
        <Eye className="h-3 w-3" />
        Live
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5">
        <EyeOff className="h-3 w-3" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 rounded-full px-2 py-0.5">
      Archived
    </span>
  );
}
