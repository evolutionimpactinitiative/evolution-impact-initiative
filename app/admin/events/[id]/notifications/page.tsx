import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Event, EventNotification } from "@/lib/supabase/types";
import { ArrowLeft, Bell, Mail, CheckCircle, Clock, Users } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventNotificationsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get event
  const { data: eventData } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  const event = eventData as Event | null;

  if (!event) {
    notFound();
  }

  // Get notification signups
  const { data: notificationsData } = await supabase
    .from("event_notifications")
    .select("*")
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  const notifications = (notificationsData as EventNotification[] | null) || [];

  // Count stats
  const total = notifications.length;
  const notified = notifications.filter((n) => n.notified_at !== null).length;
  const pending = notifications.filter((n) => n.notified_at === null).length;
  const subscribedToNewsletter = notifications.filter((n) => n.subscribe_to_newsletter).length;

  // Check if registration is still scheduled
  const isScheduled = event.publish_at && new Date(event.publish_at) > new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-blue" />
              <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
                Notification Signups
              </h1>
            </div>
            <p className="text-gray-600 mt-1">{event.title}</p>
            <p className="text-sm text-gray-500">
              {new Date(event.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {isScheduled && event.publish_at && (
            <div className="bg-brand-blue/10 border border-brand-blue/20 rounded-lg px-4 py-3">
              <p className="text-sm text-brand-blue font-medium">
                Registration opens:
              </p>
              <p className="text-brand-dark font-semibold">
                {new Date(event.publish_at).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Signups</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{pending}</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Notified</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{notified}</p>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Mail className="w-4 h-4" />
            <span className="text-sm">Joined Newsletter</span>
          </div>
          <p className="text-2xl font-bold text-brand-blue">{subscribedToNewsletter}</p>
        </div>
      </div>

      {/* Signups Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">People waiting to be notified</h2>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No one has signed up for notifications yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Signed Up</th>
                  <th className="px-4 py-3 font-medium">Newsletter</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {notification.name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${notification.email}`}
                        className="text-brand-blue hover:underline"
                      >
                        {notification.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(notification.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {notification.subscribe_to_newsletter ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {notification.notified_at ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Notified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How notifications work</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• When someone signs up, they receive a confirmation email immediately</li>
          <li>• A daily job runs at 6 AM UTC to check for events where registration has just opened</li>
          <li>• All pending signups are then sent the "Registration is Open" email</li>
          <li>• Once notified, they are marked as "Notified" and won't receive duplicate emails</li>
        </ul>
      </div>
    </div>
  );
}
