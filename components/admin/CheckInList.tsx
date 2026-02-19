"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Registration, RegistrationChild } from "@/lib/supabase/types";
import { Search, Check, Clock, Users } from "lucide-react";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

interface CheckInListProps {
  registrations: RegistrationWithChildren[];
  eventId: string;
}

export function CheckInList({ registrations, eventId }: CheckInListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.parent_name.toLowerCase().includes(search.toLowerCase()) ||
      reg.registration_children?.some((child) =>
        child.child_name.toLowerCase().includes(search.toLowerCase())
      );
    return matchesSearch;
  });

  // Sort: not checked in first, then checked in
  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    if (a.attended === "yes" && b.attended !== "yes") return 1;
    if (a.attended !== "yes" && b.attended === "yes") return -1;
    return 0;
  });

  const handleCheckIn = async (registrationId: string, currentStatus: string | null) => {
    setLoading(registrationId);

    const newStatus = currentStatus === "yes" ? null : "yes";
    const checkInTime = newStatus === "yes" ? new Date().toISOString() : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("registrations")
      .update({
        attended: newStatus,
        check_in_time: checkInTime,
      })
      .eq("id", registrationId);

    if (!error) {
      router.refresh();
    }

    setLoading(null);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          autoFocus
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {sortedRegistrations.length > 0 ? (
          sortedRegistrations.map((reg) => {
            const isCheckedIn = reg.attended === "yes";
            const isWaitlisted = reg.status === "waitlisted";

            return (
              <button
                key={reg.id}
                onClick={() => handleCheckIn(reg.id, reg.attended)}
                disabled={loading === reg.id}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isCheckedIn
                    ? "bg-green-50 border-green-500"
                    : isWaitlisted
                    ? "bg-yellow-50 border-yellow-300 hover:border-yellow-500"
                    : "bg-white border-gray-200 hover:border-brand-blue hover:shadow-md"
                } ${loading === reg.id ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  {/* Check indicator */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCheckedIn
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isCheckedIn ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{reg.parent_name}</h3>
                      {isWaitlisted && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                          Waitlist
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Users className="w-4 h-4" />
                      {reg.registration_children?.map((child, i) => (
                        <span key={child.id}>
                          {child.child_name} ({child.child_age}y)
                          {i < (reg.registration_children?.length || 0) - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-right flex-shrink-0">
                    {isCheckedIn ? (
                      <div>
                        <p className="text-green-600 font-semibold">Checked In</p>
                        <p className="text-xs text-gray-500">
                          {reg.check_in_time &&
                            new Date(reg.check_in_time).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400">Tap to check in</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500">
            {search ? "No matches found" : "No registrations"}
          </div>
        )}
      </div>
    </div>
  );
}
