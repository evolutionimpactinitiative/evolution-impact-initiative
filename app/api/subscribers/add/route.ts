import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, name, tags, source = "manual" } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingData } = await supabase
      .from("mailing_list" as "profiles")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .single();

    const existing = existingData as { id: string; status: string } | null;

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { error: "This email is already subscribed" },
          { status: 400 }
        );
      }

      // Reactivate unsubscribed user
      const { error: updateError } = await supabase
        .from("mailing_list" as "profiles")
        .update({
          status: "active",
          name: name || null,
          tags: tags || [],
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
        } as never)
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Subscriber reactivated successfully",
      });
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from("mailing_list" as "profiles")
      .insert({
        email: email.toLowerCase(),
        name: name || null,
        tags: tags || [],
        source,
        status: "active",
      } as never);

    if (insertError) {
      console.error("Add subscriber error:", insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: "Subscriber added successfully",
    });
  } catch (error) {
    console.error("Add subscriber error:", error);
    return NextResponse.json(
      { error: "Failed to add subscriber" },
      { status: 500 }
    );
  }
}
