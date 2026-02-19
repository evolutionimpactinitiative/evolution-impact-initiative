import { createClient } from "@/lib/supabase/server";
import { Settings, Users, Bell, Shield } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get team members
  const { data: teamData } = await supabase
    .from("team_members")
    .select("*")
    .order("name", { ascending: true });

  const teamMembers = (teamData as TeamMember[] | null) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">Settings</h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">Manage your team and preferences</p>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-blue" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Team Members</h2>
              <p className="text-sm text-gray-500">
                Team members who can access the admin panel
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {teamMembers.map((member) => (
            <div key={member.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-dark rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate">{member.name}</p>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                        member.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {member.role === "admin" ? "Admin" : "Editor"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{member.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            To add or remove team members, please contact your administrator or update the
            database directly in Supabase.
          </p>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-green/10 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Email Notifications</h2>
            <p className="text-sm text-gray-500">Configure automatic email settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Registration confirmations</p>
              <p className="text-sm text-gray-500">
                Send confirmation emails when someone registers
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Enabled
            </span>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="font-medium text-gray-900">Event reminders</p>
              <p className="text-sm text-gray-500">Send reminders 24 hours before events</p>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Enabled
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Donation receipts</p>
              <p className="text-sm text-gray-500">
                Automatically send receipts for donations
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-brand-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Organization</h2>
            <p className="text-sm text-gray-500">Your organization details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Organization Name</p>
            <p className="font-medium text-gray-900">Evolution Impact Initiative CIC</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Company Number</p>
            <p className="font-medium text-gray-900">15820284</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">hello@evolutionimpactinitiative.co.uk</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium text-gray-900">Medway, Kent</p>
          </div>
        </div>
      </div>
    </div>
  );
}
