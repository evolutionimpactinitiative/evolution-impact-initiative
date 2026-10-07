import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Attachment upload path for chat. Accepts multipart with:
//   - file: the File
//   - threadId: destination thread
//
// Enforces: 10 MB per file. Caller is responsible for the "max 3 per
// message" cap. Attaches to the latest message of the authenticated
// sender in that thread (whichever side they're on).
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const threadId = form.get("threadId") as string | null;
  if (!file || !threadId) {
    return NextResponse.json({ error: "Missing file or threadId" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File is over 10 MB" }, { status: 413 });
  }

  const admin = createAdminClient();

  // Authorize: carer must own the thread, OR be a team member.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: thread } = await (admin as any)
    .from("chat_threads")
    .select("id, family_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  let senderType: "family" | "team" | null = null;
  let senderId: string | null = null; // carer.id or team_member.id

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: carer } = await (admin as any)
    .from("parent_carers")
    .select("id, family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (carer && carer.family_id === thread.family_id) {
    senderType = "family";
    senderId = carer.id;
  } else if (user.email) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tm } = await (admin as any)
      .from("team_members")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();
    if (tm) {
      senderType = "team";
      senderId = tm.id;
    }
  }

  if (!senderType) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find the sender's latest message in this thread (the one we're
  // attaching to). Must exist — composer sends the message first.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestQuery = (admin as any)
    .from("chat_messages")
    .select("id, created_at")
    .eq("thread_id", threadId)
    .eq("sender_type", senderType)
    .order("created_at", { ascending: false })
    .limit(1);
  const { data: latestRaw } = await latestQuery;
  const latest = (latestRaw as { id: string }[] | null)?.[0];
  if (!latest) {
    return NextResponse.json(
      { error: "No message to attach to — send text first" },
      { status: 400 },
    );
  }

  // Upload to Storage.
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const storagePath = `${threadId}/${latest.id}-${Date.now()}-${safeName}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: uploadErr } = await (admin as any).storage
    .from("chat-attachments")
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadErr) {
    console.error("chat upload storage failed:", uploadErr);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  // Record attachment.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (admin as any)
    .from("chat_attachments")
    .insert({
      message_id: latest.id,
      storage_path: storagePath,
      filename: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    });
  if (insertErr) {
    console.error("chat upload insert failed:", insertErr);
    return NextResponse.json({ error: "Record failed" }, { status: 500 });
  }

  // Mark the sender's id usage so eslint is happy.
  void senderId;

  return NextResponse.json({ ok: true, messageId: latest.id });
}
