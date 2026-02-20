import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { surveyId, eventId, respondentEmail, respondentName, answers } =
      await request.json();

    if (!surveyId) {
      return NextResponse.json({ error: "Survey ID required" }, { status: 400 });
    }

    if (!respondentEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(respondentEmail)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify survey exists and is active
    const { data: surveyData } = await supabase
      .from("surveys" as "profiles")
      .select("id, is_active")
      .eq("id", surveyId)
      .single();

    const survey = surveyData as { id: string; is_active: boolean } | null;

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    if (!survey.is_active) {
      return NextResponse.json(
        { error: "This survey is no longer accepting responses" },
        { status: 400 }
      );
    }

    // Insert response
    const { error: insertError } = await supabase
      .from("survey_responses" as "profiles")
      .insert({
        survey_id: surveyId,
        event_id: eventId || null,
        respondent_email: respondentEmail.toLowerCase(),
        respondent_name: respondentName || null,
        answers: answers || {},
        status: "completed",
      } as never);

    if (insertError) {
      console.error("Survey response insert error:", insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: "Response submitted successfully",
    });
  } catch (error) {
    console.error("Survey response error:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
