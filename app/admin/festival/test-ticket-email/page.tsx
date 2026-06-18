import { FestivalAdminTabs } from "@/components/admin/festival/FestivalAdminTabs";
import { TestTicketEmailForm } from "@/components/admin/festival/TestTicketEmailForm";

export const metadata = {
  title: "Test ticket email · Admin",
};

export default function TestTicketEmailPage() {
  return (
    <div className="space-y-6">
      <FestivalAdminTabs />

      <div>
        <h1 className="font-heading font-black text-xl lg:text-2xl text-gray-900">
          Test ticket email
        </h1>
        <p className="text-gray-600 text-sm lg:text-base mt-1">
          Send a real festival-ticket email to any address — uses real QR codes
          that resolve to live <code className="text-xs bg-gray-100 px-1 rounded">/ticket/[code]</code> pages.
          The test creates a registration row tagged in admin notes; delete it
          when you&rsquo;re done.
        </p>
      </div>

      <TestTicketEmailForm />
    </div>
  );
}
