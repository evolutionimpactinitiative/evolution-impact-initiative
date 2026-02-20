import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { subscriberId } = await request.json();

    if (!subscriberId) {
      return NextResponse.json({ error: "Subscriber ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Delete the subscriber
    const { error } = await supabase
      .from("mailing_list" as "profiles")
      .delete()
      .eq("id", subscriberId);

    if (error) {
      console.error("Delete subscriber error:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Subscriber removed successfully",
    });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    return NextResponse.json(
      { error: "Failed to remove subscriber" },
      { status: 500 }
    );
  }
}
