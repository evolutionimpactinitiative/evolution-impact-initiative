import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe | Evolution Impact Initiative CIC",
  description: "Manage your email subscription preferences.",
};

export default function UnsubscribePage() {
  return (
    <>
      <PageHero
        title="Unsubscribe"
        subtitle="We're sorry to see you go. Enter your email below to unsubscribe from our mailing list."
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <UnsubscribeForm />
          </div>
        </div>
      </section>
    </>
  );
}
