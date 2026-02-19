import type { Metadata } from "next";
import { PageHero } from "@/components/shared/PageHero";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { ContactForm } from "@/components/shared/ContactForm";
import { Mail, MapPin, Instagram, Facebook, Linkedin } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Evolution Impact Initiative CIC",
  description:
    "Get in touch. Based at 86 King Street, Rochester, Kent ME1 1YD.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Get In Touch"
        subtitle="We'd love to hear from you. Whether you have a question, want to get involved, or just want to say hello."
      />

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Form */}
            <div>
              <SectionLabel text="Send a Message" color="brand-blue" className="mb-6" />
              <h2 className="font-heading font-black text-3xl text-brand-dark mb-8">
                Contact Form
              </h2>

              <ContactForm />

              <p className="text-sm text-brand-dark/60 mt-4">
                We aim to respond to all enquiries within 48 hours.
              </p>
            </div>

            {/* Contact Info */}
            <div>
              <SectionLabel text="Other Ways to Reach Us" color="brand-green" className="mb-6" />
              <h2 className="font-heading font-black text-3xl text-brand-dark mb-8">
                Contact Information
              </h2>

              <div className="space-y-8">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="bg-brand-pale p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
                      Email
                    </h3>
                    <a
                      href="mailto:info@evolutionimpactinitiative.co.uk"
                      className="text-brand-blue hover:text-brand-green transition-colors"
                    >
                      info@evolutionimpactinitiative.co.uk
                    </a>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="bg-brand-pale p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-brand-dark mb-1">
                      Address
                    </h3>
                    <p className="text-brand-dark/70">
                      86 King Street<br />
                      Rochester, Kent<br />
                      ME1 1YD
                    </p>
                  </div>
                </div>

                {/* Social Media */}
                <div>
                  <h3 className="font-heading font-bold text-lg text-brand-dark mb-4">
                    Follow Us
                  </h3>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      aria-label="Instagram"
                      className="bg-brand-pale p-3 rounded-lg text-brand-dark hover:bg-brand-blue hover:text-white transition-colors"
                    >
                      <Instagram className="h-6 w-6" />
                    </a>
                    <a
                      href="#"
                      aria-label="Facebook"
                      className="bg-brand-pale p-3 rounded-lg text-brand-dark hover:bg-brand-blue hover:text-white transition-colors"
                    >
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a
                      href="#"
                      aria-label="LinkedIn"
                      className="bg-brand-pale p-3 rounded-lg text-brand-dark hover:bg-brand-blue hover:text-white transition-colors"
                    >
                      <Linkedin className="h-6 w-6" />
                    </a>
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="bg-brand-pale/50 rounded-lg p-8 text-center">
                  <p className="text-brand-dark/60 text-sm">
                    Based in the heart of Rochester, Medway
                  </p>
                  <p className="font-heading font-bold text-brand-dark mt-2">
                    Serving our local community
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
