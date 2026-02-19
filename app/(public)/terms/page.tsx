import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Evolution Impact Initiative",
  description: "Terms and conditions for Evolution Impact Initiative events and services.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-8">
            Terms & Conditions
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              1. Event Registration
            </h2>
            <p className="text-gray-700 mb-4">
              By registering for an Evolution Impact Initiative event, you agree to provide accurate
              and complete information. Registration is subject to availability and confirmation.
            </p>
            <p className="text-gray-700 mb-4">
              You must be at least 18 years old to register children for our events. By registering
              a child, you confirm that you are their parent or legal guardian.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              2. Photography & Video Consent
            </h2>
            <p className="text-gray-700 mb-4">
              By accepting these terms during registration, you grant Evolution Impact Initiative CIC
              permission to photograph and video record participants during events. These images and
              recordings may be used for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Our official website and social media channels</li>
              <li>Promotional materials and newsletters</li>
              <li>Funding applications and reports</li>
              <li>Press and media coverage</li>
            </ul>
            <p className="text-gray-700 mb-4">
              If you do not wish to be photographed or have your child photographed, please inform
              our staff upon arrival at the event.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              3. Cancellation Policy
            </h2>
            <p className="text-gray-700 mb-4">
              If you can no longer attend an event, please cancel your registration as soon as possible.
              This allows us to offer your space to families on our waiting list. You can cancel via
              the link provided in your confirmation email.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              4. Health & Safety
            </h2>
            <p className="text-gray-700 mb-4">
              Parents and guardians are responsible for the supervision of their children unless
              otherwise stated for specific events. Please inform us of any medical conditions,
              allergies, or accessibility requirements that may affect participation.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              5. Code of Conduct
            </h2>
            <p className="text-gray-700 mb-4">
              All participants are expected to behave respectfully towards staff, volunteers, and
              other attendees. Evolution Impact Initiative reserves the right to remove any
              participant whose behaviour is disruptive or inappropriate.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              6. Data Protection
            </h2>
            <p className="text-gray-700 mb-4">
              We collect and process personal data in accordance with UK GDPR and the Data Protection
              Act 2018. Your information will only be used for event administration, communication
              about our services, and improving our programmes. We will never sell your data to
              third parties.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              7. Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these terms, please contact us at:
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Evolution Impact Initiative CIC</strong><br />
              86 King Street, Rochester, Kent, ME1 1YD<br />
              Email: info@evolutionimpactinitiative.co.uk
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
