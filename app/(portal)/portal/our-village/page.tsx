import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Pin,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  Clock,
  Phone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VillagePost } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORY_META: Record<
  VillagePost["category"],
  { label: string; icon: string; tint: string }
> = {
  activity: { label: "Activity", icon: "🎉", tint: "bg-brand-green/10 text-brand-green" },
  announcement: { label: "Announcement", icon: "📣", tint: "bg-yellow-100 text-yellow-800" },
  local_service: { label: "Local service", icon: "🏥", tint: "bg-brand-blue/10 text-brand-blue" },
  programme_update: { label: "Programme update", icon: "📢", tint: "bg-brand-pale text-brand-dark" },
  resource: { label: "Resource", icon: "📚", tint: "bg-purple-100 text-purple-800" },
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string | null): string {
  if (!time) return "";
  return time.replace(/^(\d{2}:\d{2}):\d{2}$/, "$1");
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.round((now - then) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function OurVillagePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { category = "all" } = await searchParams;

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from("village_posts")
    .select("*")
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(50);

  if (category !== "all") query = query.eq("category", category);

  const { data: posts } = await query;
  const rows = (posts as VillagePost[] | null) ?? [];

  const pinned = rows.filter((p) => p.pinned);
  const rest = rows.filter((p) => !p.pinned);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-6">
      <div>
        <p className="font-heading font-semibold text-sm text-brand-blue uppercase tracking-wider mb-1">
          Growing Together
        </p>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-brand-blue" />
          <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
            Our Village
          </h1>
        </div>
        <p className="text-brand-dark/70 mt-2">
          A gentle stream of activities, announcements and useful local services —
          curated by the Growing Together team.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <CategoryTab current={category} value="all">
          All
        </CategoryTab>
        {(
          Object.entries(CATEGORY_META) as [
            VillagePost["category"],
            (typeof CATEGORY_META)[VillagePost["category"]],
          ][]
        ).map(([key, meta]) => (
          <CategoryTab key={key} current={category} value={key}>
            {meta.icon} {meta.label}
          </CategoryTab>
        ))}
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="bg-white rounded-2xl border border-brand-dark/10 p-8 text-center">
          <p className="text-brand-dark/70">
            Nothing here yet — check back soon.
          </p>
        </div>
      )}

      {/* Pinned strip */}
      {pinned.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-heading font-bold text-brand-dark/70 uppercase tracking-wider">
            <Pin className="h-3.5 w-3.5" />
            Pinned
          </div>
          {pinned.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>
      )}

      {/* Rest of feed */}
      {rest.length > 0 && (
        <section className="space-y-3">
          {rest.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </section>
      )}
    </div>
  );
}

function CategoryTab({
  current,
  value,
  children,
}: {
  current: string;
  value: string;
  children: React.ReactNode;
}) {
  const active = current === value;
  const href = value === "all" ? "/portal/our-village" : `/portal/our-village?category=${value}`;
  return (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded-full border transition ${
        active
          ? "bg-brand-blue text-white border-brand-blue"
          : "bg-white text-brand-dark border-brand-dark/20 hover:border-brand-blue"
      }`}
    >
      {children}
    </Link>
  );
}

function PostCard({ post }: { post: VillagePost }) {
  const meta = CATEGORY_META[post.category];
  return (
    <article className="bg-white rounded-2xl border border-brand-dark/10 overflow-hidden shadow-sm">
      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt=""
          className="w-full h-48 sm:h-56 object-cover"
        />
      )}
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${meta.tint}`}>
            {meta.icon} {meta.label}
          </span>
          {post.published_at && (
            <span className="text-xs text-brand-dark/50">{timeAgo(post.published_at)}</span>
          )}
        </div>

        <h2 className="font-heading font-black text-xl md:text-2xl text-brand-dark leading-tight">
          {post.title}
        </h2>

        {/* Activity meta strip */}
        {post.category === "activity" && (post.event_date || post.venue) && (
          <div className="mt-3 space-y-1 text-sm text-brand-dark/80">
            {post.event_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-blue" />
                {formatDate(post.event_date)}
                {post.event_time && (
                  <>
                    <Clock className="h-4 w-4 text-brand-blue ml-2" />
                    {formatTime(post.event_time)}
                  </>
                )}
              </div>
            )}
            {post.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-blue" />
                {post.venue}
              </div>
            )}
          </div>
        )}

        {/* Local service meta */}
        {post.category === "local_service" && (post.provider_name || post.provider_contact) && (
          <div className="mt-3 space-y-1 text-sm text-brand-dark/80">
            {post.provider_name && (
              <div className="font-medium text-brand-dark">{post.provider_name}</div>
            )}
            {post.provider_contact && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-brand-blue" />
                {post.provider_contact}
              </div>
            )}
          </div>
        )}

        {/* Body */}
        {post.body && (
          <div
            className="prose prose-sm max-w-none mt-3 text-brand-dark/80"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        )}

        {/* Link CTA */}
        {post.link_url && (
          <div className="mt-4">
            <a
              href={post.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-heading font-bold text-brand-blue hover:text-brand-dark"
            >
              {post.link_label || "Open link"}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Author attribution */}
        {post.author_name && (
          <p className="text-xs text-brand-dark/50 mt-4 pt-3 border-t border-brand-dark/5">
            — {post.author_name}
          </p>
        )}
      </div>
    </article>
  );
}
