"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DataCard,
  DataCardHeader,
  DataCardContent,
  DataCardRow,
  DataCardActions,
  DataCardBadge,
} from "@/components/admin/DataCard";
import {
  User,
  Calendar,
  Users,
  Mail,
  Phone,
  MoreVertical,
  CheckCircle,
  XCircle,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Registration, RegistrationChild } from "@/lib/supabase/types";

interface RegistrationCardProps {
  registration: Registration & {
    events?: { title: string; date: string } | null;
    registration_children?: RegistrationChild[] | null;
  };
  onCheckIn?: (id: string) => void;
  onCancel?: (id: string) => void;
  onSendEmail?: (id: string) => void;
}

export function RegistrationCard({
  registration,
  onCheckIn,
  onCancel,
  onSendEmail,
}: RegistrationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "success";
      case "waitlisted":
        return "warning";
      case "cancelled":
        return "error";
      case "checked_in":
        return "info";
      default:
        return "default";
    }
  };

  const getAttendanceVariant = (attendance: boolean | null) => {
    if (attendance === true) return "success";
    if (attendance === false) return "error";
    return "default";
  };

  const childrenCount = registration.registration_children?.length || 0;
  const childrenWithAges = registration.registration_children
    ?.map((c) => `${c.child_name} (${c.child_age}yr)`)
    .join(", ");

  return (
    <DataCard>
      <DataCardHeader>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-brand-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {registration.parent_name}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {registration.events?.title || "Unknown Event"}
            </p>
          </div>
        </div>
        <DataCardBadge variant={getStatusVariant(registration.status)}>
          {registration.status}
        </DataCardBadge>
      </DataCardHeader>

      <DataCardContent>
        <DataCardRow
          label="Children"
          value={
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {childrenCount} registered
            </span>
          }
        />
        <DataCardRow
          label="Event Date"
          value={
            registration.events?.date
              ? new Date(registration.events.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "N/A"
          }
        />
        {registration.attendance_confirmed !== null && (
          <DataCardRow
            label="Attendance"
            value={
              <DataCardBadge
                variant={getAttendanceVariant(registration.attendance_confirmed)}
              >
                {registration.attendance_confirmed === true
                  ? "Will attend"
                  : "Declined"}
              </DataCardBadge>
            }
          />
        )}

        {/* Expandable details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-brand-blue font-medium mt-2 w-full justify-center py-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Less details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              More details
            </>
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <DataCardRow
              label="Email"
              value={
                <a
                  href={`mailto:${registration.parent_email}`}
                  className="text-brand-blue flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">
                    {registration.parent_email}
                  </span>
                </a>
              }
            />
            <DataCardRow
              label="Phone"
              value={
                <a
                  href={`tel:${registration.parent_phone}`}
                  className="text-brand-blue flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {registration.parent_phone}
                </a>
              }
            />
            {childrenWithAges && (
              <DataCardRow label="Children" value={childrenWithAges} />
            )}
            <DataCardRow
              label="Registered"
              value={new Date(registration.created_at).toLocaleDateString(
                "en-GB",
                {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            />
          </div>
        )}
      </DataCardContent>

      <DataCardActions className="flex-wrap">
        {registration.status === "confirmed" && onCheckIn && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCheckIn(registration.id)}
            className="flex-1 min-w-[100px]"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Check In
          </Button>
        )}
        {onSendEmail && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSendEmail(registration.id)}
            className="flex-1 min-w-[100px]"
          >
            <Send className="w-4 h-4 mr-1" />
            Email
          </Button>
        )}
        {registration.status !== "cancelled" && onCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(registration.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        )}
      </DataCardActions>
    </DataCard>
  );
}
