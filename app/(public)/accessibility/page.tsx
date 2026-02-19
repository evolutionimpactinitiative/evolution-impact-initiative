import { Metadata } from "next";
import Link from "next/link";
import { Accessibility, Monitor, MessageSquare, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility | Evolution Impact Initiative",
  description: "Our commitment to making our website and services accessible to everyone.",
};

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-accent/10 rounded-full">
              <Accessibility className="w-8 h-8 text-brand-accent" />
            </div>
            <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
              Accessibility Statement
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: February 2026
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-700 mb-4">
              Evolution Impact Initiative CIC is committed to ensuring digital accessibility for
              people of all abilities. We are continually improving the user experience for
              everyone and applying relevant accessibility standards.
            </p>
            <p className="text-gray-700 mb-4">
              Inclusion is one of our core values. We believe everyone should be able to access
              our website and services, regardless of ability or circumstance.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Accessibility Features
            </h2>
            <p className="text-gray-700 mb-4">
              Our website includes the following accessibility features:
            </p>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-heading font-bold text-brand-dark mb-2">Navigation</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>Keyboard navigation support</li>
                  <li>Skip to main content link</li>
                  <li>Consistent navigation structure</li>
                  <li>Clear focus indicators</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-heading font-bold text-brand-dark mb-2">Visual Design</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>High colour contrast</li>
                  <li>Resizable text without loss of functionality</li>
                  <li>No content that flashes more than 3 times per second</li>
                  <li>Readable fonts and spacing</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-heading font-bold text-brand-dark mb-2">Content</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>Alternative text for images</li>
                  <li>Descriptive link text</li>
                  <li>Clear headings and structure</li>
                  <li>Plain language where possible</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-heading font-bold text-brand-dark mb-2">Forms</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>Clear labels for all inputs</li>
                  <li>Error messages that identify the problem</li>
                  <li>Suggestions for correction</li>
                  <li>Logical tab order</li>
                </ul>
              </div>
            </div>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Standards We Follow
            </h2>
            <p className="text-gray-700 mb-4">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA.
              These guidelines explain how to make web content more accessible for people with
              disabilities.
            </p>
            <p className="text-gray-700 mb-4">
              The guidelines have three levels of accessibility (A, AA and AAA). We have chosen
              Level AA as our target as it provides a good balance between accessibility and
              practical implementation.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Assistive Technology Compatibility
            </h2>
            <p className="text-gray-700 mb-4">
              Our website is designed to be compatible with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Screen readers (such as JAWS, NVDA, VoiceOver)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
              <li>Browser accessibility extensions</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Browser Support
            </h2>
            <p className="text-gray-700 mb-4">
              For the best experience, we recommend using the latest version of:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Google Chrome</li>
              <li>Mozilla Firefox</li>
              <li>Apple Safari</li>
              <li>Microsoft Edge</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Tips for Using Our Website
            </h2>
            <div className="bg-brand-blue/5 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <Monitor className="w-5 h-5 text-brand-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading font-bold text-brand-dark mb-1">Adjusting Text Size</h3>
                  <p className="text-gray-700 text-sm">
                    You can increase or decrease text size using your browser&apos;s zoom function.
                    On most browsers, press Ctrl + (or Cmd + on Mac) to zoom in, and Ctrl - (or Cmd -)
                    to zoom out.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-brand-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading font-bold text-brand-dark mb-1">Screen Reader Users</h3>
                  <p className="text-gray-700 text-sm">
                    Our pages use proper heading structure and ARIA labels where appropriate.
                    Use your screen reader&apos;s heading navigation to quickly find content.
                  </p>
                </div>
              </div>
            </div>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Event Accessibility
            </h2>
            <p className="text-gray-700 mb-4">
              We strive to make our physical events as accessible as possible:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>We choose venues with step-free access where possible</li>
              <li>Accessible toilet facilities are available at our events</li>
              <li>We can provide information in alternative formats on request</li>
              <li>We welcome assistance dogs at all our events</li>
              <li>We can arrange support for participants with additional needs - please let us know when registering</li>
            </ul>
            <p className="text-gray-700 mb-4">
              If you have specific accessibility requirements for an event, please contact us in
              advance and we will do our best to accommodate your needs.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Known Limitations
            </h2>
            <p className="text-gray-700 mb-4">
              While we strive for full accessibility, we acknowledge that some areas may still
              need improvement:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Some older PDF documents may not be fully accessible - we are working to update these</li>
              <li>Some third-party content (such as embedded videos) may not meet all accessibility standards</li>
              <li>Complex interactive features may present challenges for some assistive technologies</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We are actively working to address these issues.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Feedback and Contact
            </h2>
            <p className="text-gray-700 mb-4">
              We welcome your feedback on the accessibility of our website and services.
              If you encounter any accessibility barriers or have suggestions for improvement,
              please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-2 text-gray-700 mb-3">
                <Mail className="w-5 h-5 text-brand-blue" />
                <a href="mailto:info@evolutionimpactinitiative.co.uk" className="text-brand-blue hover:underline">
                  info@evolutionimpactinitiative.co.uk
                </a>
              </div>
              <p className="text-gray-700 text-sm">
                Please include &quot;Accessibility&quot; in the subject line so we can direct your
                message appropriately.
              </p>
            </div>
            <p className="text-gray-700 mb-4">
              When contacting us about accessibility issues, please include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>The web address (URL) of the page</li>
              <li>A description of the problem</li>
              <li>The device and browser you were using</li>
              <li>Any assistive technology you use</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Enforcement
            </h2>
            <p className="text-gray-700 mb-4">
              If you are not satisfied with our response to your accessibility concern, you can
              contact the Equality Advisory Support Service (EASS) at{" "}
              <a
                href="https://www.equalityadvisoryservice.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:underline"
              >
                www.equalityadvisoryservice.com
              </a>
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Continuous Improvement
            </h2>
            <p className="text-gray-700 mb-4">
              We regularly review our website and services to identify and fix accessibility
              issues. This statement will be updated as we make improvements.
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
