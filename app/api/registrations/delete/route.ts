import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  try {
    const { registrationId } = await request.json();

    if (!registrationId) {
      return NextResponse.json({ error: "Registration ID required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify the registration exists
    const { data: regData, error: regError } = await supabase
      .from("registrations")
      .select("id, event_id")
      .eq("id", registrationId)
      .single();

    if (regError || !regData) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Delete registration children first (foreign key constraint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("registration_children")
      .delete()
      .eq("registration_id", registrationId);

    // Delete the registration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("registrations")
      .delete()
      .eq("id", registrationId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (error) {
    console.error("Delete registration error:", error);
    return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 });
  }
}
