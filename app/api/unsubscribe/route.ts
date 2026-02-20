import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Find the subscriber
    const { data: subscriberData, error: findError } = await supabase
      .from("mailing_list" as "profiles")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .single();

    const subscriber = subscriberData as { id: string; status: string } | null;

    if (findError || !subscriber) {
      return NextResponse.json(
        { error: "Email not found in our mailing list" },
        { status: 404 }
      );
    }

    if (subscriber.status === "unsubscribed") {
      return NextResponse.json({
        success: true,
        message: "This email is already unsubscribed.",
      });
    }

    // Update status to unsubscribed
    const { error: updateError } = await supabase
      .from("mailing_list" as "profiles")
      .update({
        status: "unsubscribed",
        unsubscribed_at: new Date().toISOString(),
      } as never)
      .eq("id", subscriber.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed from our mailing list.",
    });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe. Please try again." },
      { status: 500 }
    );
  }
}
