import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import type { Event, Survey } from "@/lib/supabase/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";

export async function POST(request: NextRequest) {
  try {
    const { surveyId, eventId } = await request.json();

    if (!surveyId) {
      return NextResponse.json({ error: "Survey ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get the survey
    const { data: surveyData, error: surveyError } = await supabase
      .from("surveys")
      .select("*")
      .eq("id", surveyId)
      .single();

    if (surveyError || !surveyData) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const survey = surveyData as Survey;

    // Get recipients (either from event registrations or all subscribers)
    let recipients: Array<{ email: string; name: string }> = [];

    if (eventId) {
      // Get attendees from the event
      const { data: registrationsData } = await supabase
        .from("registrations")
        .select("parent_email, parent_name")
        .eq("event_id", eventId)
        .in("status", ["confirmed", "attended"]);

      type RegRow = { parent_email: string; parent_name: string };
      const registrations = (registrationsData as RegRow[] | null) || [];
      recipients = registrations.map((r) => ({
        email: r.parent_email,
        name: r.parent_name,
      }));
    } else {
      // Get all active subscribers
      const { data: subscribersData } = await supabase
        .from("mailing_list")
        .select("email, name")
        .eq("status", "active");

      type SubRow = { email: string; name: string | null };
      const subscribers = (subscribersData as SubRow[] | null) || [];
      recipients = subscribers.map((s) => ({
        email: s.email,
        name: s.name || "Community Member",
      }));
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      );
    }

    const surveyLink = `${BASE_URL}/feedback/${surveyId}`;

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const recipient of recipients) {
      try {
        await resend.emails.send({
          from: "Evolution Impact Initiative <noreply@evolutionimpactinitiative.co.uk>",
          to: recipient.email,
          subject: `We'd love your feedback - ${survey.title}`,
          html: generateSurveyEmailHtml(recipient.name, survey.title, survey.description, surveyLink),
        });

        results.sent++;
      } catch (err) {
        results.failed++;
        results.errors.push(
          `Failed to send to ${recipient.email}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Survey sent to ${results.sent} recipients`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error("Send survey email error:", error);
    return NextResponse.json(
      { error: "Failed to send survey email" },
      { status: 500 }
    );
  }
}

function generateSurveyEmailHtml(
  recipientName: string,
  surveyTitle: string,
  surveyDescription: string | null,
  surveyLink: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f6f8;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 40px; text-align: center;">
      <h1 style="color: #1E1E1E; font-size: 24px; margin-bottom: 20px;">
        We'd Love Your Feedback!
      </h1>

      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Dear ${recipientName},
      </p>

      <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        ${surveyDescription || "Your feedback helps us improve our programmes and better serve our community. Please take a few minutes to share your thoughts."}
      </p>

      <div style="background-color: #DCECFF; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="color: #17559D; font-size: 18px; font-weight: bold; margin: 0;">
          ${surveyTitle}
        </p>
      </div>

      <a href="${surveyLink}" style="display: inline-block; background-color: #31B67D; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 4px; font-weight: bold; margin: 20px 0;">
        Give Feedback
      </a>

      <p style="color: #888888; font-size: 14px; margin-top: 30px;">
        This should only take 2-3 minutes. Thank you for helping us improve!
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

      <p style="color: #888888; font-size: 12px;">
        Evolution Impact Initiative CIC<br>
        86 King Street, Rochester, Kent, ME1 1YD
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
