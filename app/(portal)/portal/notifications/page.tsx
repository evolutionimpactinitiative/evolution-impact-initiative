import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalIdentity } from "@/lib/portal/current-carer";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  id: string;
  type: "village_post";
  title: string;
  body: string | null;
  link_url: string;
  payload: { post_id?: string; category?: string; author_name?: string | null };
  read_at: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<string, string> = {
  activity: "Activity",
  announcement: "Announcement",
  local_service: "Local service",
  programme_update: "Programme update",
  resource: "Resource",
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.round((now - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const identity = await resolvePortalIdentity(supabase, user);
  if (identity.kind === "stale_session") {
    redirect("/api/portal/session-end?reason=session_expired&next=/portal/notifications");
  }
  if (identity.kind !== "carer") {
    redirect("/portal/family");
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw } = await (admin as any)
    .from("notifications")
    .select("id, type, title, body, link_url, payload, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (raw as Row[] | null) ?? [];
  const unreadCount = rows.filter((r) => !r.read_at).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-brand-blue">
            <Bell className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider font-bold">
              Notifications
            </span>
          </div>
          <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mt-2">
            Your updates
          </h1>
          <p className="text-brand-dark/70 mt-2">
            {unreadCount > 0
              ? `${unreadCount} unread · showing your most recent 50.`
              : "You're all caught up. Showing your most recent 50."}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-dark whitespace-nowrap"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl p-10 border border-brand-dark/5 text-center">
          <Bell className="h-8 w-8 text-brand-dark/30 mx-auto mb-3" />
          <p className="text-brand-dark/70">
            No notifications yet. Posts from Our Village and programme updates will
            show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => {
            const unread = !n.read_at;
            const label = n.payload.category
              ? CATEGORY_LABEL[n.payload.category] || "Our Village"
              : "Update";
            return (
              <li key={n.id}>
                <div
                  className={`relative rounded-xl border transition ${
                    unread
                      ? "bg-white border-brand-blue/20 shadow-sm"
                      : "bg-white/60 border-brand-dark/5"
                  }`}
                >
                  {unread && (
                    <span
                      aria-hidden
                      className="absolute left-3 top-5 h-2 w-2 rounded-full bg-brand-green"
                    />
                  )}
                  <Link
                    href={`/api/portal/notifications/${n.id}/open`}
                    className="block pl-8 pr-4 py-4 sm:pr-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-brand-green mb-1">
                          {label}
                        </p>
                        <h3
                          className={`font-heading text-brand-dark leading-snug ${
                            unread ? "font-black" : "font-semibold"
                          }`}
                        >
                          {n.title}
                        </h3>
                        {n.payload.author_name && (
                          <p className="text-xs uppercase tracking-wider text-brand-dark/50 mt-1">
                            Posted by {n.payload.author_name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-brand-dark/50 whitespace-nowrap pt-0.5">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </Link>
                  {unread && (
                    <form
                      action={markNotificationRead.bind(null, n.id)}
                      className="absolute right-3 bottom-3"
                    >
                      <button
                        type="submit"
                        aria-label="Mark as read"
                        className="text-xs text-brand-dark/50 hover:text-brand-blue flex items-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
