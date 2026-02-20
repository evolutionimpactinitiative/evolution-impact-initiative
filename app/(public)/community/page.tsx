import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Calendar,
  HandHeart,
  Gift,
  Lightbulb,
  Share2,
  Users,
  Heart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Small Acts Community | Evolution Impact Initiative CIC",
  description:
    "Join Small Acts - our community movement for people who believe that positive change doesn't require grand gestures, only willingness, consistency and care.",
};

const benefits = [
  {
    icon: Calendar,
    title: "Stay Updated",
    description: "Get notified about upcoming events and initiatives",
  },
  {
    icon: HandHeart,
    title: "Volunteer",
    description: "Support and participate in community activities",
  },
  {
    icon: Gift,
    title: "Donate Resources",
    description: "Contribute to local projects and make a difference",
  },
  {
    icon: Lightbulb,
    title: "Share Ideas",
    description: "Provide feedback and suggest improvements",
  },
  {
    icon: Share2,
    title: "Spread Awareness",
    description: "Help us reach more families in need",
  },
  {
    icon: Users,
    title: "Connect",
    description: "Meet like-minded people in your community",
  },
];

export default function CommunityPage() {
  return (
    <>
      <PageHero
        title="Small Acts"
        subtitle="Our Community Movement"
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Introduction */}
            <div className="text-center mb-16">
              <SectionLabel text="Join Our Community" color="brand-accent" className="mb-6" />
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-6">
                Small Acts, Meaningful Impact
              </h2>
              <p className="text-lg text-brand-dark/70 leading-relaxed">
                Small Acts is the heart of Evolution Impact Initiative. It is our community space
                for people who believe that positive change does not require grand gestures, only
                willingness, consistency and care.
              </p>
            </div>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-16">
              <p className="text-brand-dark/80 leading-relaxed">
                This is where supporters, volunteers, parents, young people and local partners
                come together to stay connected, share ideas and take part in simple actions
                that create meaningful impact.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="mb-16">
              <h3 className="font-heading font-bold text-xl text-brand-dark mb-8 text-center">
                Through Small Acts, members can:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="bg-brand-pale/30 rounded-xl p-6 text-center hover:bg-brand-pale/50 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-accent/10 mb-4">
                      <benefit.icon className="w-6 h-6 text-brand-accent" />
                    </div>
                    <h4 className="font-heading font-bold text-brand-dark mb-2">
                      {benefit.title}
                    </h4>
                    <p className="text-sm text-brand-dark/70">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="bg-gradient-to-br from-brand-blue/5 to-brand-accent/5 rounded-2xl p-8 md:p-12 text-center mb-16">
              <Heart className="w-12 h-12 text-brand-accent mx-auto mb-6" />
              <p className="text-lg text-brand-dark/80 leading-relaxed mb-6">
                There is no pressure or obligation. Whether you give your time, share a post,
                offer a skill or simply stay informed, you are part of the impact.
              </p>
              <p className="font-heading font-bold text-xl text-brand-dark">
                Because when small acts are done collectively, they create something powerful.
              </p>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Button
                asChild
                size="lg"
                className="bg-brand-green hover:bg-brand-green/90 text-white gap-2"
              >
                <a
                  href="https://chat.whatsapp.com/Ezf3U5WdlqC74h00tvS3uB"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-5 h-5" />
                  Join the Small Acts Community
                </a>
              </Button>
              <p className="text-sm text-brand-dark/50 mt-4">
                Join our WhatsApp community group
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Other Ways to Get Involved */}
      <section className="bg-brand-pale/30 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading font-bold text-2xl text-brand-dark mb-6">
              Other Ways to Get Involved
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="outline">
                <Link href="/get-involved">Volunteer With Us</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/donate">Support Our Work</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/events">Upcoming Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
