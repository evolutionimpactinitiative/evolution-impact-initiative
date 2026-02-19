"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Registration, RegistrationChild } from "@/lib/supabase/types";
import { Search, Check, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { checkInChild, checkInAllChildren } from "@/app/admin/actions";

type RegistrationWithChildren = Registration & {
  registration_children: RegistrationChild[];
};

interface CheckInListProps {
  registrations: RegistrationWithChildren[];
  eventId: string;
}

export function CheckInList({ registrations, eventId }: CheckInListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedRegistrations, setExpandedRegistrations] = useState<Set<string>>(new Set());

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      reg.parent_name.toLowerCase().includes(search.toLowerCase()) ||
      reg.registration_children?.some((child) =>
        child.child_name.toLowerCase().includes(search.toLowerCase())
      );
    return matchesSearch;
  });

  // Sort: registrations with unchecked children first
  const sortedRegistrations = [...filteredRegistrations].sort((a, b) => {
    const aAllCheckedIn = a.registration_children?.every((c) => c.attended === true) ?? false;
    const bAllCheckedIn = b.registration_children?.every((c) => c.attended === true) ?? false;

    if (aAllCheckedIn && !bAllCheckedIn) return 1;
    if (!aAllCheckedIn && bAllCheckedIn) return -1;
    return 0;
  });

  const toggleExpanded = (registrationId: string) => {
    setExpandedRegistrations((prev) => {
      const next = new Set(prev);
      if (next.has(registrationId)) {
        next.delete(registrationId);
      } else {
        next.add(registrationId);
      }
      return next;
    });
  };

  const handleChildCheckIn = async (childId: string, currentAttended: boolean | null) => {
    setLoading(childId);

    // Toggle: if currently checked in, set to false. Otherwise, set to true.
    const newAttended = currentAttended === true ? false : true;

    await checkInChild(childId, newAttended, eventId);

    router.refresh();
    setLoading(null);
  };

  const handleCheckInAll = async (registrationId: string, children: RegistrationChild[]) => {
    setLoading(registrationId);

    const childIds = children.map((c) => c.id);
    await checkInAllChildren(childIds, eventId);

    router.refresh();
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
          placeholder="Search by parent or child name..."
          className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          autoFocus
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {sortedRegistrations.length > 0 ? (
          sortedRegistrations.map((reg) => {
            const children = reg.registration_children || [];
            const checkedInChildren = children.filter((c) => c.attended === true);
            const allCheckedIn = children.length > 0 && checkedInChildren.length === children.length;
            const someCheckedIn = checkedInChildren.length > 0 && !allCheckedIn;
            const isWaitlisted = reg.status === "waitlisted";
            const isExpanded = expandedRegistrations.has(reg.id);
            const isLoading = loading === reg.id;

            return (
              <div
                key={reg.id}
                className={`rounded-xl border-2 transition-all overflow-hidden ${
                  allCheckedIn
                    ? "bg-green-50 border-green-500"
                    : someCheckedIn
                    ? "bg-yellow-50 border-yellow-400"
                    : isWaitlisted
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-white border-gray-200"
                } ${isLoading ? "opacity-50" : ""}`}
              >
                {/* Header - click to expand */}
                <button
                  onClick={() => toggleExpanded(reg.id)}
                  className="w-full text-left p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Check indicator */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        allCheckedIn
                          ? "bg-green-500 text-white"
                          : someCheckedIn
                          ? "bg-yellow-400 text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {allCheckedIn ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="font-bold text-lg">
                          {checkedInChildren.length}/{children.length}
                        </span>
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
                        <span>{children.length} {children.length === 1 ? "child" : "children"}</span>
                      </div>
                    </div>

                    {/* Status & expand */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {allCheckedIn ? (
                        <p className="text-green-600 font-semibold">All In</p>
                      ) : someCheckedIn ? (
                        <p className="text-yellow-600 font-semibold">Partial</p>
                      ) : (
                        <p className="text-gray-400">Tap to expand</p>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded children list */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-white/80">
                    {/* Quick check-in all button */}
                    {!allCheckedIn && children.length > 1 && (
                      <div className="px-4 py-3 border-b border-gray-100">
                        <button
                          onClick={() => handleCheckInAll(reg.id, children)}
                          disabled={isLoading}
                          className="w-full py-2 px-4 bg-brand-blue text-white rounded-lg font-medium hover:bg-brand-blue/90 transition-colors disabled:opacity-50"
                        >
                          Check In All Children
                        </button>
                      </div>
                    )}

                    {/* Individual children */}
                    <div className="divide-y divide-gray-100">
                      {children.map((child) => {
                        const isChildCheckedIn = child.attended === true;
                        const isChildLoading = loading === child.id;

                        return (
                          <div
                            key={child.id}
                            className={`flex items-center justify-between p-4 ${
                              isChildCheckedIn ? "bg-green-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isChildCheckedIn
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-200 text-gray-500"
                                }`}
                              >
                                {isChildCheckedIn ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Clock className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{child.child_name}</p>
                                <p className="text-sm text-gray-500">Age {child.child_age}</p>
                              </div>
                            </div>

                            <button
                              onClick={() => handleChildCheckIn(child.id, child.attended)}
                              disabled={isChildLoading}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                isChildCheckedIn
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-green-500 text-white hover:bg-green-600"
                              } ${isChildLoading ? "opacity-50" : ""}`}
                            >
                              {isChildLoading ? (
                                "..."
                              ) : isChildCheckedIn ? (
                                "Undo"
                              ) : (
                                "Check In"
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Check-in times */}
                    {checkedInChildren.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
                        Last check-in:{" "}
                        {new Date(
                          Math.max(
                            ...checkedInChildren
                              .filter((c) => c.check_in_time)
                              .map((c) => new Date(c.check_in_time!).getTime())
                          )
                        ).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
