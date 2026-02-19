import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { values, teamMembers } from "@/lib/constants";
import { TeamMemberCard } from "@/components/shared/TeamMemberCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "About Us | Evolution Impact Initiative CIC",
  description:
    "Our mission, values and story. Empowering young people and families across Medway, Kent.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        title="About Evolution Impact Initiative CIC"
        subtitle="Building community, one connection at a time."
      />

      {/* Our Story */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <SectionLabel text="Our Story" color="brand-blue" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-8">
              How We Started
            </h2>
            <div className="prose prose-lg max-w-none text-brand-dark/70 space-y-4">
              <p>
                Evolution Impact Initiative was born out of a real desire to do more than talk about the issues facing our community. We wanted to take action.
              </p>
              <p>
                We saw young people who needed positive spaces and role models. We saw families who needed practical support, not just signposting. We saw a community with incredible talent and resilience that just needed the right platform.
              </p>
              <p className="font-heading font-bold text-brand-dark text-xl">
                So we built one.
              </p>
              <p>
                Since launching, we&apos;ve grown from a handful of workshops into a structured programme of creative sessions, sport initiatives, food support drives and community events. Every step has been guided by the people we serve, because the best programmes are the ones designed with the community, not just for them.
              </p>
              <p>
                We became a registered Community Interest Company because we wanted our commitment to community benefit to be legally protected. Our CIC structure means our assets, profits and resources are locked to the community by law.
              </p>
              <p className="font-heading font-semibold text-brand-blue">
                We&apos;re still growing. We&apos;re still learning. And we&apos;re just getting started.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="bg-brand-pale/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <SectionLabel text="Our People" color="brand-green" className="mb-6 mx-auto" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4">
              Meet the Team
            </h2>
            <p className="text-brand-dark/70 max-w-2xl mx-auto">
              The passionate individuals driving Evolution Impact Initiative forward.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => {
              const rotations: Array<"rotate-1" | "-rotate-1" | "rotate-2" | "-rotate-2"> = [
                "rotate-1", "-rotate-1", "rotate-2", "-rotate-2", "-rotate-1", "rotate-1"
              ];
              return (
                <TeamMemberCard
                  key={member.name}
                  name={member.name}
                  role={member.role}
                  bio={member.bio}
                  email={member.email}
                  image={member.image}
                  rotation={rotations[index % rotations.length]}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-brand-pale/50 p-8 rounded-lg shadow-sm border-t-4 border-brand-blue">
              <SectionLabel text="Our Mission" color="brand-blue" className="mb-4" />
              <p className="text-brand-dark/80 leading-relaxed text-lg">
                To create accessible, empowering and safe environments where young people and families can grow, connect and thrive through creative arts, sport, community outreach and hands-on support.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-brand-pale/50 p-8 rounded-lg shadow-sm border-t-4 border-brand-green">
              <SectionLabel text="Our Vision" color="brand-green" className="mb-4" />
              <p className="text-brand-dark/80 leading-relaxed text-lg">
                A connected, confident community where every individual, regardless of background or circumstance, has the opportunity, support and belief to reach their potential.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel text="Our Values" color="brand-green" className="mb-6 mx-auto" />
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark">
                What We Stand For
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {values.map((value, index) => (
                <AccordionItem key={value.title} value={`item-${index}`}>
                  <AccordionTrigger className="text-xl text-brand-dark">
                    {value.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-brand-dark/70 text-base leading-relaxed">
                    {value.description}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="bg-brand-dark py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel text="Our Approach" color="brand-accent" className="mb-6 mx-auto" />
              <h2 className="font-heading font-black text-3xl md:text-4xl text-white">
                What Makes Us Different
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "We listen first.",
                  description: "Every programme starts with a conversation, not an assumption.",
                },
                {
                  title: "We build relationships, not just events.",
                  description: "Ongoing pathways for development and support.",
                },
                {
                  title: "We measure what matters.",
                  description: "Tracking confidence, wellbeing, skills development and connection. Building toward formal SROI framework.",
                },
                {
                  title: "We invest in people.",
                  description: "Developing young people who can eventually lead, mentor and give back.",
                },
                {
                  title: "We're community-owned.",
                  description: "As a CIC, profits and assets are legally locked to community benefit.",
                },
              ].map((item) => (
                <div key={item.title} className="glass-card p-6">
                  <h3 className="font-heading font-bold text-lg text-brand-accent mb-2">
                    {item.title}
                  </h3>
                  <p className="text-white/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Safeguarding & Standards */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <SectionLabel text="Safeguarding" color="brand-blue" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-8">
              Safeguarding & Standards
            </h2>
            <div className="prose prose-lg max-w-none text-brand-dark/70 space-y-4">
              <p>
                The safety of every individual we work with, especially children and young people, is our highest priority.
              </p>
              <p>
                All team members and volunteers hold enhanced DBS checks and complete safeguarding training. We maintain robust safeguarding policies and procedures, and we create environments where everyone feels safe, respected and heard.
              </p>
              <p>
                Our policies are reviewed regularly and are available on request.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Governance & CIC Commitment */}
      <section className="bg-brand-pale/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <SectionLabel text="Governance" color="brand-green" className="mb-6" />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-8">
              Governance & CIC Commitment
            </h2>

            <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
              <h3 className="font-heading font-bold text-xl text-brand-dark mb-4">
                Our Asset Lock
              </h3>
              <p className="text-brand-dark/70 mb-4">
                Our assets and profits are legally protected for community benefit:
              </p>
              <ul className="space-y-2 text-brand-dark/70">
                <li className="flex items-start gap-2">
                  <span className="text-brand-green font-bold">✓</span>
                  They must be reinvested back into our programmes and community
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-green font-bold">✓</span>
                  They cannot be distributed for private gain
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-green font-bold">✓</span>
                  We report annually to the CIC Regulator on our community impact
                </li>
              </ul>
            </div>

            <div className="bg-brand-dark text-white p-8 rounded-lg">
              <h3 className="font-heading font-bold text-xl mb-4">Company Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
                <div>
                  <p className="text-white/60 text-sm">Company Number</p>
                  <p className="font-semibold">16667870</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Registered Office</p>
                  <p className="font-semibold">86 King Street, Rochester, Kent, ME1 1YD</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-white/60 text-sm mb-2">SIC Codes</p>
                <p className="text-sm text-white/80">
                  Sports & Recreation Education (85510) · Educational Support Services (85600) · Social Work Activities (88990) · Artistic Creation (90030)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
