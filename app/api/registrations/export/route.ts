import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Event, Registration, RegistrationChild } from "@/lib/supabase/types";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "Event ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get event
    const { data: eventData } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    const event = eventData as Event | null;
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get registrations with children
    const { data: registrationsData } = await supabase
      .from("registrations")
      .select(`
        *,
        registration_children (*)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    const registrations = (registrationsData as RegistrationWithChildren[] | null) || [];

    // Generate CSV
    const headers = [
      "Registration ID",
      "Status",
      "Parent Name",
      "Parent Email",
      "Parent Phone",
      "Accessibility Requirements",
      "Registered At",
      "Checked In",
      "Child Name",
      "Child Age",
    ];

    const rows: string[][] = [];

    for (const reg of registrations) {
      const children = reg.registration_children || [];

      if (children.length === 0) {
        // Registration with no children
        rows.push([
          reg.id,
          reg.status,
          reg.parent_name,
          reg.parent_email,
          reg.parent_phone || "",
          reg.accessibility_requirements || "",
          new Date(reg.created_at).toLocaleDateString("en-GB"),
          reg.attended === "yes" ? "Yes" : "No",
          "",
          "",
        ]);
      } else {
        // One row per child
        for (const child of children) {
          rows.push([
            reg.id,
            reg.status,
            reg.parent_name,
            reg.parent_email,
            reg.parent_phone || "",
            reg.accessibility_requirements || "",
            new Date(reg.created_at).toLocaleDateString("en-GB"),
            reg.attended === "yes" ? "Yes" : "No",
            child.child_name,
            child.child_age?.toString() || "",
          ]);
        }
      }
    }

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Return CSV file
    const filename = `${event.title.replace(/[^a-z0-9]/gi, "-")}-registrations-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
