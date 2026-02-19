import { Metadata } from "next";
import Link from "next/link";
import { Building2, Lock, Users, FileCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "CIC Statement | Evolution Impact Initiative",
  description: "Our Community Interest Company commitment and governance structure.",
};

export default function CICStatementPage() {
  return (
    <main className="min-h-screen bg-brand-pale pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-green/10 rounded-full">
              <Building2 className="w-8 h-8 text-brand-green" />
            </div>
            <h1 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
              CIC Statement
            </h1>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Community Interest Company Commitment
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              What is a CIC?
            </h2>
            <p className="text-gray-700 mb-4">
              A Community Interest Company (CIC) is a special type of limited company designed
              for social enterprises that want to use their profits and assets for the public good.
              CICs are regulated by the CIC Regulator and must demonstrate that their activities
              benefit the community.
            </p>
            <p className="text-gray-700 mb-4">
              Evolution Impact Initiative CIC was incorporated in August 2025 and is registered
              with Companies House under company number <strong>16667870</strong>.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Our Community Purpose
            </h2>
            <p className="text-gray-700 mb-4">
              Evolution Impact Initiative CIC exists to benefit the community of Medway and
              surrounding areas in Kent through:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Delivering creative arts, sport and wellbeing programmes for children and young people</li>
              <li>Providing practical support to families experiencing hardship</li>
              <li>Creating inclusive community events that bring people together</li>
              <li>Building confidence, skills and positive outcomes for participants</li>
              <li>Supporting the mental health and wellbeing of our community</li>
            </ul>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
              <div className="bg-brand-pale/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-5 h-5 text-brand-green" />
                  <h3 className="font-heading font-bold text-brand-dark">Asset Lock</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  Our assets are permanently locked to community benefit and cannot be distributed
                  to shareholders or directors for private gain.
                </p>
              </div>

              <div className="bg-brand-pale/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-brand-blue" />
                  <h3 className="font-heading font-bold text-brand-dark">Community Benefit</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  All our activities must demonstrably benefit the community. We report on
                  our impact annually.
                </p>
              </div>

              <div className="bg-brand-pale/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FileCheck className="w-5 h-5 text-brand-dark" />
                  <h3 className="font-heading font-bold text-brand-dark">Regulated</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  We are regulated by the CIC Regulator and must file an annual Community
                  Interest Report alongside our accounts.
                </p>
              </div>

              <div className="bg-brand-pale/50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-brand-accent" />
                  <h3 className="font-heading font-bold text-brand-dark">Transparent</h3>
                </div>
                <p className="text-gray-700 text-sm">
                  Our accounts, reports and company information are publicly available through
                  Companies House.
                </p>
              </div>
            </div>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              The Asset Lock
            </h2>
            <p className="text-gray-700 mb-4">
              One of the most important features of a CIC is the statutory &quot;asset lock&quot;. This means:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <strong>Profits must be reinvested:</strong> Any surplus we generate is used to
                further our community objectives, not distributed to shareholders
              </li>
              <li>
                <strong>Assets are protected:</strong> If the company is wound up, assets must be
                transferred to another CIC, charity, or community organisation with similar purposes
              </li>
              <li>
                <strong>Directors cannot benefit:</strong> Directors receive no dividends or
                profit distribution - any payment must be for legitimate services rendered
              </li>
            </ul>
            <p className="text-gray-700 mb-4">
              This structure gives donors, funders and partners confidence that their support
              will directly benefit the community, not private interests.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Annual Reporting
            </h2>
            <p className="text-gray-700 mb-4">
              Each year, we submit:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <strong>Annual Accounts:</strong> Financial statements showing our income,
                expenditure and financial position
              </li>
              <li>
                <strong>Community Interest Report (CIC34):</strong> A description of how our
                activities have benefited the community, stakeholder engagement, and how we
                have met our community interest objectives
              </li>
              <li>
                <strong>Confirmation Statement:</strong> Confirming our company details are
                up to date
              </li>
            </ul>
            <p className="text-gray-700 mb-4">
              These documents are publicly available on the{" "}
              <a
                href="https://find-and-update.company-information.service.gov.uk/company/16667870"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:underline"
              >
                Companies House website
              </a>.
            </p>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Company Information
            </h2>
            <div className="bg-brand-dark text-white rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-white/60 text-sm mb-1">Company Name</p>
                  <p className="font-semibold">Evolution Impact Initiative CIC</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Company Number</p>
                  <p className="font-semibold">16667870</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Company Type</p>
                  <p className="font-semibold">Community Interest Company (Limited by Guarantee)</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Incorporated</p>
                  <p className="font-semibold">August 2025</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-white/60 text-sm mb-1">Registered Office</p>
                  <p className="font-semibold">86 King Street, Rochester, Kent, ME1 1YD</p>
                </div>
              </div>
            </div>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              SIC Codes
            </h2>
            <p className="text-gray-700 mb-4">
              Our registered Standard Industrial Classification (SIC) codes reflect the scope
              of our activities:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li><strong>85510:</strong> Sports and Recreation Education</li>
              <li><strong>85600:</strong> Educational Support Services</li>
              <li><strong>88990:</strong> Other Social Work Activities Without Accommodation</li>
              <li><strong>90030:</strong> Artistic Creation</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Our Commitment
            </h2>
            <p className="text-gray-700 mb-4">
              As a CIC, we are committed to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>Operating transparently and with integrity</li>
              <li>Putting community benefit at the heart of everything we do</li>
              <li>Engaging meaningfully with our stakeholders</li>
              <li>Measuring and reporting our social impact</li>
              <li>Continuously improving our programmes based on community feedback</li>
              <li>Using resources responsibly and efficiently</li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Learn More
            </h2>
            <p className="text-gray-700 mb-4">
              For more information about Community Interest Companies:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
              <li>
                <a
                  href="https://www.gov.uk/government/organisations/office-of-the-regulator-of-community-interest-companies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  Office of the Regulator of Community Interest Companies
                </a>
              </li>
              <li>
                <a
                  href="https://find-and-update.company-information.service.gov.uk/company/16667870"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-blue hover:underline"
                >
                  Our Companies House Page
                </a>
              </li>
            </ul>

            <h2 className="font-heading font-bold text-xl text-brand-dark mt-8 mb-4">
              Contact Us
            </h2>
            <p className="text-gray-700 mb-4">
              If you have questions about our CIC status or governance:
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
