"use client";

import { useState } from "react";
import { Mail, Download, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ViewToggle } from "@/components/admin/ViewToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  source: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  created_at: string;
};

interface SubscribersViewProps {
  subscribers: Subscriber[];
}

export function SubscribersView({ subscribers }: SubscribersViewProps) {
  const isMobile = useIsMobile();
  const [view, setView] = useState<"cards" | "table">(isMobile ? "cards" : "table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("all");

  // Filter subscribers
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.name && sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Export to CSV
  const handleExport = () => {
    const activeSubscribers = subscribers.filter((s) => s.status === "active");
    const csvContent = [
      "Email,Name,Source,Subscribed Date",
      ...activeSubscribers.map(
        (s) =>
          `${s.email},"${s.name || ""}",${s.source},${new Date(s.subscribed_at).toISOString().split("T")[0]}`
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "footer":
        return "Website Footer";
      case "registration":
        return "Event Registration";
      case "event":
        return "Event Signup";
      case "manual":
        return "Manual Entry";
      default:
        return source;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        Showing {filteredSubscribers.length} of {subscribers.length} subscribers
      </p>

      {/* List */}
      {filteredSubscribers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="font-medium text-gray-900 mb-1">No subscribers found</p>
          <p className="text-sm text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your filters"
              : "Subscribers will appear here when people sign up"}
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="space-y-3">
          {filteredSubscribers.map((subscriber) => (
            <div
              key={subscriber.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {subscriber.name || "No name"}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{subscriber.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                        subscriber.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {subscriber.status === "active" ? "Active" : "Unsubscribed"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {getSourceLabel(subscriber.source)}
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {new Date(subscriber.subscribed_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-900">{subscriber.email}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {subscriber.name || "-"}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {getSourceLabel(subscriber.source)}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                      {new Date(subscriber.subscribed_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          subscriber.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {subscriber.status === "active" ? "Active" : "Unsubscribed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
