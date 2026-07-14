import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Download,
  Check,
  Sparkles,
  Megaphone,
  ShieldCheck,
  Phone,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { SponsorNowSection } from "@/components/back-to-school/SponsorNowSection";
import { SponsorInquiryForm } from "@/components/back-to-school/SponsorInquiryForm";
import {
  B2S,
  COMMUNITY_TIERS,
  PREMIUM_TIERS,
  IMPACT_LADDER,
  SPONSOR_CONTACT,
} from "@/lib/back-to-school";
import { backToSchoolMetadata } from "@/lib/back-to-school/meta";
import { FESTIVAL, FIRST_YEAR_STATS } from "@/lib/festival";

export const metadata: Metadata = backToSchoolMetadata({
  title: `Sponsor the ${B2S.title}`,
  description: `Put your brand at the centre of the ${B2S.title}. Community tiers from £50 to £3,000+, with logo placement, named collection points and feature in the impact report. Every gift goes to the £10,000 goal.`,
});

// Live so tier cards and progress stay fresh
export const revalidate = 0;

const PACK_URL = "/back-to-school-2026-sponsorship-pack.pdf";

const BENEFIT_ROWS: Array<{
  key: keyof (typeof COMMUNITY_TIERS)[number]["benefits"];
  label: string;
}> = [
  { key: "socialThankYou", label: "Social media thank-you" },
  { key: "certificate", label: "Certificate of thanks" },
  { key: "logoWebsite", label: "Logo on our website" },
  { key: "logoCampaign", label: "Logo on campaign materials" },
  { key: "namedCollectionPoint", label: "Named on a collection point" },
  { key: "impactReportFeature", label: "Feature in impact report" },
];

export default function SponsorPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-brand-blue via-brand-blue to-brand-dark text-white pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white rounded-full opacity-10 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Link
              href="/back-to-school"
              className="flex w-fit items-center gap-1.5 text-sm text-white/70 hover:text-brand-accent transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the campaign
            </Link>
            <SectionLabel
              text="Sponsor the drive"
              color="brand-accent"
              className="mb-4"
            />
            <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl leading-none mb-6">
              Lead the campaign
              <br />
              that&rsquo;s kitting
              <br />
              500 kids for school.
            </h1>
            <p className="text-lg text-white/75 max-w-2xl leading-relaxed mb-6">
              Put your brand at the centre of the {B2S.title} with measurable
              impact attached. Every pound goes to the £10,000 goal on the
              live progress bar. £20 puts a full uniform on a child&rsquo;s
              back.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                size="sm"
                className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
              >
                <Link href="#sponsor-now">
                  Sponsor now
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-brand-green text-white hover:bg-white hover:text-brand-dark"
              >
                <Link href="#inquire">
                  Get in touch
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white hover:text-brand-dark"
              >
                <a href={PACK_URL} target="_blank" rel="noreferrer">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download sponsorship pack
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* WHY PARTNER WITH US */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <SectionLabel
              text="Why partner with us"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4 leading-tight">
              A cause your community will see and remember.
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              Sponsoring the Back to School Drive reaches the families on
              your doorstep, not a distant cause. Your name lands in
              parents&rsquo; hands, on collection points and in follow-up
              coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PillarCard
              icon={Sparkles}
              title="Local impact"
              body="Reaches children on your doorstep, not a distant cause. Every gift is measurable in uniforms handed out."
            />
            <PillarCard
              icon={Megaphone}
              title="Brand visibility"
              body="Logo across materials, collection points, website and social channels, plus a certificate for your wall."
            />
            <PillarCard
              icon={ShieldCheck}
              title="Real CSR"
              body="A tangible story to share with staff, customers and stakeholders. Featured in our impact report."
            />
          </div>
        </div>
      </section>

      {/* THE 2026 CAMPAIGN — where every pound goes */}
      <section className="bg-brand-pale/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-start">
            <div>
              <SectionLabel
                text="The 2026 campaign"
                color="brand-blue"
                className="mb-6"
              />
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4 leading-tight">
                {FIRST_YEAR_STATS.uniformsGiven} last year.
                <br />
                <span className="text-brand-green">
                  {B2S.goalChildren}
                </span>{" "}
                this year.
              </h2>
              <p className="text-brand-dark/70 leading-relaxed mb-6">
                Last summer we reached{" "}
                <strong>{FIRST_YEAR_STATS.uniformsGiven} children</strong>{" "}
                with uniforms and essentials in just two weeks. This year
                we&rsquo;re scaling to <strong>{B2S.goalChildren}</strong>.
              </p>
              <div className="bg-white rounded-2xl p-5 border border-brand-blue/10 mb-6">
                <p className="text-sm text-brand-dark">
                  <strong>Every £20 puts a full uniform on a child&rsquo;s
                  back.</strong>{" "}
                  £10,000 reaches all 500.
                </p>
              </div>
            </div>

            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-brand-blue mb-4 font-bold">
                Where every pound goes · £20 × 500 = £10,000
              </p>
              <div className="space-y-3">
                <BudgetRow label="School uniforms" amount="£6,000" pct={60} />
                <BudgetRow label="Backpacks" amount="£2,000" pct={20} />
                <BudgetRow label="Stationery & supplies" amount="£1,500" pct={15} />
                <BudgetRow
                  label="Emergency support"
                  amount="£500"
                  pct={5}
                  tone="green"
                />
              </div>
              <p className="text-xs text-brand-dark/60 mt-4">
                £9,500 direct to children (95%) · £500 emergency contingency (5%)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IMPACT LADDER */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-8">
            <SectionLabel
              text="Sponsorship impact ladder"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4 leading-tight">
              What your gift achieves
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              However much you give, it climbs straight into a child&rsquo;s
              first day.
            </p>
          </div>

          <div className="space-y-2 max-w-4xl">
            {IMPACT_LADDER.map((row) => {
              const numeric = Number.parseInt(
                row.amount.replace(/[^0-9]/g, ""),
                10,
              );
              const pct = Math.min(100, (numeric / 3000) * 100);
              const isBig = numeric >= 500;
              return (
                <div
                  key={row.amount}
                  className="flex items-center gap-4 py-1"
                >
                  <span className="font-heading font-bold text-brand-dark text-sm md:text-base w-16 shrink-0">
                    {row.amount}
                  </span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden bg-brand-blue/10">
                    <div
                      className={`h-full rounded-full ${isBig ? "bg-brand-green" : "bg-brand-blue"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm md:text-base text-brand-dark/85 w-40 md:w-48 text-left shrink-0">
                    {row.body}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-brand-dark/60 mt-6 max-w-2xl">
            <strong>No gift is too small.</strong> £20 puts a full uniform on
            a child&rsquo;s back. Combined, your community can reach all 500.
          </p>
        </div>
      </section>

      {/* COMMUNITY PARTNERSHIP TIERS TABLE */}
      <section className="bg-brand-pale/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <SectionLabel
              text="Community partnerships"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4 leading-tight">
              A level for every local business
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              Pick your level, pick your visibility. Every tier stacks on top
              of the last.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-brand-blue/10 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-brand-dark text-white">
                  <th className="text-left px-4 py-4 font-heading font-bold text-xs uppercase tracking-widest">
                    Benefit
                  </th>
                  {COMMUNITY_TIERS.map((t) => (
                    <th
                      key={t.value}
                      className="text-center px-3 py-4 font-heading text-xs"
                    >
                      <div className="font-bold uppercase tracking-widest">
                        {t.label}
                      </div>
                      <div className="text-brand-accent font-semibold text-sm mt-1">
                        £{t.amount}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENEFIT_ROWS.map((row, i) => (
                  <tr
                    key={row.key}
                    className={
                      i % 2 === 0 ? "bg-white" : "bg-brand-pale/30"
                    }
                  >
                    <td className="px-4 py-3 text-brand-dark font-medium">
                      {row.label}
                    </td>
                    {COMMUNITY_TIERS.map((t) => (
                      <td key={t.value} className="text-center px-3 py-3">
                        {t.benefits[row.key] ? (
                          <Check className="h-4 w-4 text-brand-green inline-block" />
                        ) : (
                          <span className="text-brand-dark/25">-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* PREMIUM PARTNERSHIPS */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <SectionLabel
              text="Premium partnerships"
              color="brand-green"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4 leading-tight">
              Lead the campaign
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              Premium partnerships are inquiry-only — we&rsquo;ll invoice,
              arrange logo files and confirm placement together. Fill in the
              form below and Luke will be in touch within 2 working days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PREMIUM_TIERS.map((t) => (
              <div
                key={t.value}
                className={
                  t.featured
                    ? "bg-brand-dark text-white rounded-2xl p-6 md:p-7 border-2 border-brand-accent relative"
                    : "bg-white rounded-2xl p-6 md:p-7 border-2 border-brand-blue/15"
                }
              >
                {t.featured && (
                  <span className="absolute -top-3 left-6 bg-brand-accent text-brand-dark text-[10px] font-heading font-bold uppercase tracking-widest px-2 py-1 rounded">
                    {t.eyebrow}
                  </span>
                )}
                {!t.featured && (
                  <p
                    className={`font-heading text-[10px] uppercase tracking-widest mb-3 font-bold ${
                      t.value === "major"
                        ? "text-brand-green"
                        : "text-brand-blue"
                    }`}
                  >
                    {t.eyebrow}
                  </p>
                )}
                <h3
                  className={`font-heading font-semibold text-xl mb-2 ${t.featured ? "text-white" : "text-brand-dark"}`}
                >
                  {t.label}
                </h3>
                <p
                  className={`font-heading font-black text-3xl md:text-4xl mb-3 ${t.featured ? "text-brand-accent" : "text-brand-dark"}`}
                >
                  {t.priceLabel}
                </p>
                <p
                  className={`text-xs uppercase tracking-widest mb-4 font-heading font-semibold ${t.featured ? "text-brand-accent" : "text-brand-green"}`}
                >
                  Kits ~{t.childrenReached} children
                </p>
                <ul className="space-y-2">
                  {t.benefits.map((b) => (
                    <li
                      key={b}
                      className={`flex items-start gap-2 text-sm ${t.featured ? "text-white/85" : "text-brand-dark/85"}`}
                    >
                      <Check
                        className={`h-4 w-4 shrink-0 mt-0.5 ${t.featured ? "text-brand-accent" : "text-brand-green"}`}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SPONSOR NOW — pay online */}
      <section id="sponsor-now" className="bg-brand-pale/40 py-16 md:py-24 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <SectionLabel
              text="Sponsor now"
              color="brand-green"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4 leading-tight">
              Pay online, tag your business
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              Pick a community tier below and pay by card. Every pound flows
              straight into the £10,000 campaign total. For premium levels
              (£1,000+) please use the inquiry form below.
            </p>
          </div>
          <SponsorNowSection campaign={FESTIVAL.campaignKey} />
        </div>
      </section>

      {/* INQUIRE — form */}
      <section id="inquire" className="bg-white py-16 md:py-24 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-16 items-start">
            <div>
              <SectionLabel
                text="Or get in touch"
                color="brand-blue"
                className="mb-6"
              />
              <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4 leading-tight">
                Prefer to talk it through?
              </h2>
              <p className="text-brand-dark/70 leading-relaxed mb-6">
                Fill in the form and Luke will come back within 2 working days
                to arrange the details. Best for premium partnerships,
                invoicing, or if you want to shape a custom package.
              </p>

              <div className="bg-brand-pale/40 rounded-2xl p-5 border border-brand-blue/10 mb-4">
                <p className="font-heading text-[10px] uppercase tracking-widest text-brand-blue mb-2 font-bold">
                  Direct contact
                </p>
                <p className="font-heading font-bold text-brand-dark mb-0.5">
                  {SPONSOR_CONTACT.name}
                </p>
                <p className="text-xs text-brand-dark/60 mb-3">
                  {SPONSOR_CONTACT.role}
                </p>
                <div className="space-y-1.5 text-sm">
                  <a
                    href={`tel:${SPONSOR_CONTACT.mobile.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-brand-dark hover:text-brand-blue"
                  >
                    <Phone className="h-4 w-4 text-brand-blue" />
                    <span className="font-heading font-semibold">
                      {SPONSOR_CONTACT.mobile}
                    </span>
                    <span className="text-xs text-brand-dark/50">
                      (mobile)
                    </span>
                  </a>
                  <a
                    href={`tel:${SPONSOR_CONTACT.landline.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-brand-dark hover:text-brand-blue"
                  >
                    <Phone className="h-4 w-4 text-brand-blue" />
                    <span className="font-heading font-semibold">
                      {SPONSOR_CONTACT.landline}
                    </span>
                    <span className="text-xs text-brand-dark/50">
                      (landline)
                    </span>
                  </a>
                  <a
                    href={`mailto:${SPONSOR_CONTACT.email}`}
                    className="flex items-center gap-2 text-brand-dark hover:text-brand-blue break-all"
                  >
                    <Mail className="h-4 w-4 text-brand-blue" />
                    <span className="text-sm">{SPONSOR_CONTACT.email}</span>
                  </a>
                </div>
              </div>

              <a
                href={PACK_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-heading font-semibold text-brand-blue hover:text-brand-dark"
              >
                <FileText className="h-4 w-4" />
                Download the sponsorship pack (PDF)
                <Download className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="bg-brand-pale/30 rounded-2xl p-6 md:p-8 border border-brand-blue/10">
              <SponsorInquiryForm />
            </div>
          </div>
        </div>
      </section>

      {/* Event footer */}
      <section className="bg-gradient-to-br from-brand-blue via-brand-blue to-brand-dark text-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl">
            <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-2">
              Distribution day
            </p>
            <h3 className="font-heading font-black text-2xl md:text-3xl mb-3">
              {B2S.dateLabel} · {B2S.timeLabel}
            </h3>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-accent" />
                {B2S.dateLabel}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {B2S.venueName}, {B2S.venueAddress}
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PillarCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-brand-pale/40 rounded-2xl p-6 border border-brand-blue/10 flex flex-col">
      <div className="h-11 w-11 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-brand-blue" />
      </div>
      <h3 className="font-heading font-semibold text-lg text-brand-dark mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-sm text-brand-dark/70 leading-relaxed">{body}</p>
    </div>
  );
}

function BudgetRow({
  label,
  amount,
  pct,
  tone = "blue",
}: {
  label: string;
  amount: string;
  pct: number;
  tone?: "blue" | "green";
}) {
  const fillClass = tone === "green" ? "bg-brand-green" : "bg-brand-blue";
  return (
    <div className="flex items-center gap-4">
      <span className="font-heading font-semibold text-brand-dark text-sm w-40 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-3 rounded-full overflow-hidden bg-brand-blue/10">
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-heading font-bold text-brand-dark text-sm w-16 text-right shrink-0">
        {amount}
      </span>
    </div>
  );
}
