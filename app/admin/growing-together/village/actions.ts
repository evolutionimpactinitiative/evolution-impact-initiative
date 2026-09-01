"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Category =
  | "activity"
  | "announcement"
  | "local_service"
  | "programme_update"
  | "resource";

type Status = "draft" | "published" | "archived";

async function requireTeamMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teamMember } = await (supabase as any)
    .from("team_members")
    .select("id, name, email")
    .eq("email", user.email || "")
    .maybeSingle();
  if (!teamMember) throw new Error("Team members only");
  return teamMember as { id: string; name: string | null; email: string };
}

function readPayload(fd: FormData) {
  const category = fd.get("category") as Category;
  const title = (fd.get("title") as string | null)?.trim();
  if (!category || !title) throw new Error("Category and title are required.");

  const text = (name: string) => {
    const v = (fd.get(name) as string | null)?.trim();
    return v ? v : null;
  };

  const status = ((fd.get("status") as string | null) || "draft") as Status;
  const now = new Date().toISOString();

  return {
    category,
    title,
    body: text("body"),
    cover_image_url: text("cover_image_url"),
    link_url: text("link_url"),
    link_label: text("link_label"),
    event_date: text("event_date"),
    event_time: text("event_time"),
    venue: text("venue"),
    provider_name: text("provider_name"),
    provider_contact: text("provider_contact"),
    author_name: text("author_name"),
    pinned: fd.get("pinned") === "on",
    status,
    // Stamp published_at the moment status flips to published.
    published_at: status === "published" ? now : null,
    expires_at: text("expires_at"),
  };
}

export async function createVillagePost(fd: FormData) {
  const member = await requireTeamMember();
  const payload = readPayload(fd);

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("village_posts")
    .insert({ ...payload, created_by: member.id })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/admin/growing-together/village");
  revalidatePath("/portal/our-village");
  revalidatePath("/portal");
  redirect(`/admin/growing-together/village/${(data as { id: string }).id}`);
}

export async function updateVillagePost(id: string, fd: FormData) {
  await requireTeamMember();
  const payload = readPayload(fd);

  const admin = createAdminClient();

  // If moving to published for the first time, stamp published_at.
  // If already published, preserve the original published_at.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("village_posts")
    .select("published_at, status")
    .eq("id", id)
    .maybeSingle();

  const wasPublished = existing?.status === "published";
  const nowPublished = payload.status === "published";
  const published_at = nowPublished
    ? wasPublished
      ? existing?.published_at ?? new Date().toISOString()
      : new Date().toISOString()
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("village_posts")
    .update({ ...payload, published_at })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/growing-together/village");
  revalidatePath(`/admin/growing-together/village/${id}`);
  revalidatePath("/portal/our-village");
  revalidatePath("/portal");
}

export async function deleteVillagePost(id: string) {
  await requireTeamMember();
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("village_posts").delete().eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/growing-together/village");
  revalidatePath("/portal/our-village");
  revalidatePath("/portal");
  redirect("/admin/growing-together/village");
}

export async function toggleVillagePinned(id: string, pinned: boolean) {
  await requireTeamMember();
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("village_posts")
    .update({ pinned })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/admin/growing-together/village");
  revalidatePath("/portal/our-village");
}

export async function setVillageStatus(id: string, status: Status) {
  await requireTeamMember();
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (admin as any)
    .from("village_posts")
    .select("published_at, status")
    .eq("id", id)
    .maybeSingle();

  const wasPublished = existing?.status === "published";
  const published_at =
    status === "published"
      ? wasPublished
        ? existing?.published_at ?? new Date().toISOString()
        : new Date().toISOString()
      : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from("village_posts")
    .update({ status, published_at })
    .eq("id", id);
  if (error) throw error;

  revalidatePath("/admin/growing-together/village");
  revalidatePath(`/admin/growing-together/village/${id}`);
  revalidatePath("/portal/our-village");
  revalidatePath("/portal");
}
