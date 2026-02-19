import { Metadata } from "next";
import Link from "next/link";
import { Shield, Phone, Mail, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Safeguarding Policy | Evolution Impact Initiative",
  description: "Our commitment to protecting children, young people and vulnerable adults.",
};

export default function SafeguardingPage() {
  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-blue/10 rounded-full">
              <Shield className="w-8 h-8 text-brand-blue" />
            </div>
            <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
              Safeguarding Policy
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: February 2026
            </p>

            {/* Emergency Contact Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading font-bold text-lg text-red-800 mb-2">
                    If a Child is in Immediate Danger
                  </h3>
                  <p className="text-red-700 mb-3">
                    Call 999 immediately. Do not delay.
                  </p>
                  <p className="text-red-700 text-sm">
                    For non-emergency safeguarding concerns, contact Medway Council&apos;s
                    Children&apos;s Services: <strong>01634 334466</strong>
                  </p>
                </div>
              </div>
            </div>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-700 mb-4">
              Evolution Impact Initiative CIC is committed to safeguarding and promoting the
              welfare of all children, young people and vulnerable adults who engage with our
              programmes, events and services.
            </p>
            <p className="text-gray-700 mb-4">
              We believe that every person has the right to be safe from harm, abuse and neglect.
              Safeguarding is everyone&apos;s responsibility, and we take this duty seriously.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Policy Statement
            </h2>
            <p className="text-gray-700 mb-4">
              We recognise that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>The welfare of children and vulnerable adults is paramount</li>
              <li>All children and vulnerable adults have the right to protection from abuse</li>
              <li>All suspicions and allegations of abuse should be taken seriously and responded to swiftly and appropriately</li>
              <li>All staff and volunteers have a responsibility to report concerns</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Safer Recruitment
            </h2>
            <p className="text-gray-700 mb-4">
              All team members and volunteers who work with children or vulnerable adults:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Undergo enhanced DBS (Disclosure and Barring Service) checks</li>
              <li>Provide two references which are verified</li>
              <li>Complete safeguarding training before working with participants</li>
              <li>Receive regular safeguarding updates and refresher training</li>
              <li>Sign our Code of Conduct</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Designated Safeguarding Lead
            </h2>
            <p className="text-gray-700 mb-4">
              Our Designated Safeguarding Lead (DSL) is responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Receiving and recording safeguarding concerns</li>
              <li>Making referrals to statutory agencies when necessary</li>
              <li>Ensuring all staff receive appropriate training</li>
              <li>Maintaining safeguarding records securely</li>
              <li>Reviewing and updating safeguarding policies</li>
            </ul>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700">
                <strong>Safeguarding Contact:</strong><br />
                Email:{" "}
                <a href="mailto:safeguarding@evolutionimpactinitiative.co.uk" className="text-brand-blue hover:underline">
                  safeguarding@evolutionimpactinitiative.co.uk
                </a>
              </p>
            </div>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Types of Abuse
            </h2>
            <p className="text-gray-700 mb-4">
              We train our team to recognise signs of:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>Physical Abuse:</strong> Hitting, shaking, burning, or other physical harm</li>
              <li><strong>Emotional Abuse:</strong> Persistent emotional maltreatment causing severe effects on development</li>
              <li><strong>Sexual Abuse:</strong> Forcing or enticing a child to take part in sexual activities</li>
              <li><strong>Neglect:</strong> Persistent failure to meet a child&apos;s basic physical and/or psychological needs</li>
              <li><strong>Online Abuse:</strong> Cyberbullying, grooming, or exposure to harmful content</li>
              <li><strong>Child Criminal Exploitation:</strong> Including county lines and gang involvement</li>
              <li><strong>Child Sexual Exploitation:</strong> Manipulative or coercive sexual exploitation</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Reporting Concerns
            </h2>
            <p className="text-gray-700 mb-4">
              If you have a concern about a child or vulnerable adult:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 mb-4 space-y-2">
              <li>If there is immediate danger, call 999</li>
              <li>Record your concerns factually and as soon as possible</li>
              <li>Report to our Designated Safeguarding Lead</li>
              <li>Do not investigate yourself or promise confidentiality</li>
              <li>Do not discuss with others unless necessary for the child&apos;s safety</li>
            </ol>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Code of Conduct
            </h2>
            <p className="text-gray-700 mb-4">
              All staff and volunteers must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Treat all children and vulnerable adults with dignity and respect</li>
              <li>Avoid being alone with a child where possible</li>
              <li>Never use physical punishment or engage in inappropriate physical contact</li>
              <li>Not share personal contact details with participants</li>
              <li>Report any concerns or allegations immediately</li>
              <li>Follow our photography and social media policies</li>
              <li>Maintain appropriate boundaries at all times</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Photography & Social Media
            </h2>
            <p className="text-gray-700 mb-4">
              We obtain consent before photographing or filming children at events. Images are:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Only taken on organisation devices or by approved photographers</li>
              <li>Stored securely and deleted when no longer needed</li>
              <li>Never used to identify a child by their full name online</li>
              <li>Not shared if consent is withdrawn</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Event Safety
            </h2>
            <p className="text-gray-700 mb-4">
              At all events we:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Maintain appropriate adult-to-child ratios</li>
              <li>Conduct risk assessments for all activities</li>
              <li>Ensure at least one trained first aider is present</li>
              <li>Have clear registration and sign-out procedures</li>
              <li>Ensure all team members are identifiable (e.g., branded clothing, badges)</li>
              <li>Have emergency procedures in place</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Training & Review
            </h2>
            <p className="text-gray-700 mb-4">
              This policy is reviewed annually or sooner if legislation changes. All team members
              receive safeguarding training as part of their induction and refresher training
              at least every two years.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              External Resources
            </h2>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <a href="https://www.nspcc.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                  NSPCC
                </a>{" "}
                - Helpline: 0808 800 5000
              </li>
              <li>
                <a href="https://www.childline.org.uk" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                  Childline
                </a>{" "}
                - 0800 1111 (free for children)
              </li>
              <li>
                <a href="https://www.medway.gov.uk/childprotection" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">
                  Medway Council Children&apos;s Services
                </a>{" "}
                - 01634 334466
              </li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Contact Us
            </h2>
            <div className="bg-brand-blue/5 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                <strong>Evolution Impact Initiative CIC</strong>
              </p>
              <div className="flex items-center gap-2 text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-brand-blue" />
                <a href="mailto:safeguarding@evolutionimpactinitiative.co.uk" className="text-brand-blue hover:underline">
                  safeguarding@evolutionimpactinitiative.co.uk
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-brand-blue" />
                <span>General enquiries: info@evolutionimpactinitiative.co.uk</span>
              </div>
            </div>
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
