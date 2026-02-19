import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Evolution Impact Initiative",
  description: "How we collect, use and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-8">
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: February 2026
            </p>

            <p className="text-gray-700 mb-6">
              Evolution Impact Initiative CIC (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting
              your privacy and handling your personal data responsibly. This policy explains how we
              collect, use, store and protect your information.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              1. Who We Are
            </h2>
            <p className="text-gray-700 mb-4">
              Evolution Impact Initiative CIC is a Community Interest Company registered in England
              and Wales (Company No. 16667870). Our registered address is 86 King Street, Rochester,
              Kent, ME1 1YD.
            </p>
            <p className="text-gray-700 mb-4">
              For data protection purposes, we are the data controller. If you have any questions
              about this policy or how we handle your data, please contact us at{" "}
              <a href="mailto:info@evolutionimpactinitiative.co.uk" className="text-brand-blue hover:underline">
                info@evolutionimpactinitiative.co.uk
              </a>
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              2. What Data We Collect
            </h2>
            <p className="text-gray-700 mb-4">We may collect and process the following data:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Identity Data:</strong> Name, date of birth, gender</li>
              <li><strong>Contact Data:</strong> Email address, telephone number, postal address</li>
              <li><strong>Registration Data:</strong> Event registrations, dietary requirements, accessibility needs, emergency contact details</li>
              <li><strong>Child Data:</strong> Names and ages of children registered for our events (with parental consent)</li>
              <li><strong>Donation Data:</strong> Payment information processed securely through Stripe</li>
              <li><strong>Communication Data:</strong> Your preferences for receiving communications from us</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information when you visit our website</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              3. How We Use Your Data
            </h2>
            <p className="text-gray-700 mb-4">We use your personal data to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Process event registrations and manage attendance</li>
              <li>Communicate with you about events, updates and opportunities</li>
              <li>Process donations and send receipts</li>
              <li>Ensure the safety and wellbeing of participants at our events</li>
              <li>Improve our services and programmes</li>
              <li>Comply with legal obligations</li>
              <li>Apply for funding (using anonymised and aggregated data)</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              4. Legal Basis for Processing
            </h2>
            <p className="text-gray-700 mb-4">We process your data based on:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Consent:</strong> When you register for events or sign up for communications</li>
              <li><strong>Contract:</strong> To deliver services you have registered for</li>
              <li><strong>Legitimate Interests:</strong> To run our organisation effectively and improve our services</li>
              <li><strong>Legal Obligation:</strong> To comply with laws and regulations</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              5. Data Sharing
            </h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal data to third parties. We may share data with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Service Providers:</strong> Such as our email service (Resend) and payment processor (Stripe)</li>
              <li><strong>Partner Organisations:</strong> When delivering joint events (with your consent)</li>
              <li><strong>Authorities:</strong> If required by law or to protect safety</li>
              <li><strong>Funders:</strong> Anonymised data for reporting and evaluation purposes</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              6. Data Retention
            </h2>
            <p className="text-gray-700 mb-4">
              We retain your data only for as long as necessary:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Event registration data: 3 years after the event</li>
              <li>Donation records: 7 years for financial compliance</li>
              <li>Marketing preferences: Until you unsubscribe</li>
              <li>Safeguarding records: In line with statutory requirements</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              7. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Ask us to correct inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (where applicable)</li>
              <li><strong>Restriction:</strong> Ask us to limit how we use your data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Object:</strong> Object to certain types of processing</li>
              <li><strong>Withdraw Consent:</strong> Remove your consent at any time</li>
            </ul>
            <p className="text-gray-700 mb-4">
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:info@evolutionimpactinitiative.co.uk" className="text-brand-blue hover:underline">
                info@evolutionimpactinitiative.co.uk
              </a>
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              8. Data Security
            </h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Secure database storage</li>
              <li>Limited access to personal data on a need-to-know basis</li>
              <li>Regular security reviews</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              9. Cookies
            </h2>
            <p className="text-gray-700 mb-4">
              Our website uses essential cookies to ensure proper functionality. We do not use
              tracking or advertising cookies. For more information about how cookies work, visit{" "}
              <a href="https://www.aboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                aboutcookies.org
              </a>
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              10. Children&apos;s Data
            </h2>
            <p className="text-gray-700 mb-4">
              We collect children&apos;s data only with parental or guardian consent for event
              registration purposes. We take extra care to protect children&apos;s information
              and only collect what is necessary to deliver our programmes safely.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              11. Changes to This Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this policy from time to time. Any significant changes will be
              communicated via our website. We encourage you to review this policy periodically.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              12. Complaints
            </h2>
            <p className="text-gray-700 mb-4">
              If you have concerns about how we handle your data, please contact us first. You
              also have the right to lodge a complaint with the Information Commissioner&apos;s
              Office (ICO) at{" "}
              <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                ico.org.uk
              </a>
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              13. Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              For any questions about this privacy policy or your personal data:
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Evolution Impact Initiative CIC</strong><br />
              86 King Street, Rochester, Kent, ME1 1YD<br />
              Email:{" "}
              <a href="mailto:info@evolutionimpactinitiative.co.uk" className="text-brand-blue hover:underline">
                info@evolutionimpactinitiative.co.uk
              </a>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <Link
              href="/"
              className="text-brand-blue hover:underline"
            >
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
