import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { welcomeSubscriberEmail } from "@/lib/email/templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, name, source = "footer" } = await request.json();

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
      .from("mailing_list")
      .select("id, status")
      .eq("email", email.toLowerCase())
      .single();

    const existing = existingData as { id: string; status: string } | null;

    if (existing) {
      if (existing.status === "unsubscribed") {
        // Resubscribe
        const { error: updateError } = await supabase
          .from("mailing_list" as "profiles")
          .update({
            status: "active",
            unsubscribed_at: null,
            subscribed_at: new Date().toISOString(),
          } as never)
          .eq("id", existing.id);

        if (updateError) {
          throw updateError;
        }

        // Send welcome back email
        try {
          const { subject, html } = welcomeSubscriberEmail(name || null, email.toLowerCase());
          await resend.emails.send({
            from: "Evolution Impact Initiative <noreply@evolutionimpactinitiative.co.uk>",
            to: email.toLowerCase(),
            subject,
            html,
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }

        return NextResponse.json({
          success: true,
          message: "Welcome back! You've been resubscribed.",
        });
      }

      return NextResponse.json({
        success: true,
        message: "You're already subscribed!",
      });
    }

    // Insert new subscriber
    const { error: insertError } = await supabase
      .from("mailing_list" as "profiles")
      .insert({
        email: email.toLowerCase(),
        name: name || null,
        source,
        status: "active",
      } as never);

    if (insertError) {
      console.error("Subscribe error:", insertError);
      throw insertError;
    }

    // Send welcome email
    try {
      const { subject, html } = welcomeSubscriberEmail(name || null, email.toLowerCase());
      await resend.emails.send({
        from: "Evolution Impact Initiative <noreply@evolutionimpactinitiative.co.uk>",
        to: email.toLowerCase(),
        subject,
        html,
      });
    } catch (emailError) {
      // Log email error but don't fail the subscription
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
