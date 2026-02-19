import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Mail, ArrowRight } from "lucide-react";

type Props = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function ThankYouPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-brand-green rounded-full mx-auto mb-8 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="font-heading font-black text-4xl md:text-5xl text-brand-dark mb-4">
            Thank You!
          </h1>

          <p className="text-xl text-brand-dark/70 mb-8">
            Your generous donation will help us continue our work supporting young people and
            families in Medway.
          </p>

          {/* Impact Message */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
            <Heart className="w-12 h-12 text-brand-green mx-auto mb-4" />
            <h2 className="font-heading font-bold text-xl text-brand-dark mb-4">
              Your Impact Matters
            </h2>
            <p className="text-brand-dark/70 mb-6">
              Every donation, no matter the size, directly supports:
            </p>
            <ul className="text-left space-y-3 max-w-md mx-auto">
              <li className="flex items-start gap-3">
                <span className="text-brand-green font-bold mt-0.5">✓</span>
                <span className="text-brand-dark/70">
                  Free creative workshops for children and young people
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green font-bold mt-0.5">✓</span>
                <span className="text-brand-dark/70">
                  Youth sport and martial arts programmes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green font-bold mt-0.5">✓</span>
                <span className="text-brand-dark/70">
                  Community food drives and support initiatives
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-brand-green font-bold mt-0.5">✓</span>
                <span className="text-brand-dark/70">Family events and community gatherings</span>
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-brand-dark rounded-xl p-6 mb-8 text-left">
            <h3 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand-accent" />
              What happens next?
            </h3>
            <ul className="space-y-3 text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-brand-accent">1.</span>
                You&apos;ll receive a receipt via email shortly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-accent">2.</span>
                We&apos;ll send you updates on how your donation is making a difference
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-accent">3.</span>
                Your support will be acknowledged in our annual impact report
              </li>
            </ul>
          </div>

          {/* Share / Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/events">View Our Events</Link>
            </Button>
            <Button asChild>
              <Link href="/" className="flex items-center gap-2">
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Reference */}
          {session_id && (
            <p className="text-sm text-gray-400 mt-8">
              Reference: {session_id.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
