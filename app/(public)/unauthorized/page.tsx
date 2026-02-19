import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-brand-pale flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="font-heading font-black text-2xl text-brand-dark mb-4">
            Access Denied
          </h1>

          <p className="text-brand-dark/70 mb-6">
            Your account is not authorized to access the admin area. Only team members with
            @evolutionimpactinitiative.co.uk email addresses can access this portal.
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Try Different Email</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Website
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
