import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Package,
  Sparkles,
  Users,
  ClipboardList,
  Check,
  QrCode,
  Backpack,
  Truck,
  Baby,
  Coins,
  type LucideIcon,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/shared/SectionLabel";
import { DonateSection } from "@/components/back-to-school/DonateSection";
import { WhySection } from "@/components/back-to-school/WhySection";
import { FestivalProgressBar } from "@/components/festival/FestivalProgressBar";
import { FESTIVAL, FIRST_YEAR_STATS } from "@/lib/festival";
import { B2S, B2S_SLUG, SUPPLY_PLEDGE_ITEMS } from "@/lib/back-to-school";
import { backToSchoolMetadata } from "@/lib/back-to-school/meta";

export const metadata: Metadata = backToSchoolMetadata({
  title: `${B2S.title} | Help ${B2S.goalChildren} children in Medway`,
  description: `Help ${B2S.goalChildren} children start school with confidence. Register your family, donate money, or pledge new supplies. Distribution ${B2S.dateLabel}, ${B2S.timeLabel} at ${B2S.venueName}, ${B2S.venueArea}.`,
});

// Live campaign progress on every request
export const revalidate = 0;

export default async function BackToSchoolPage() {
  const supabase = createAdminClient();

  // Live donation total (whole pounds; matches admin/donations convention)
  let raisedPounds = 0;
  const { data: donations } = await supabase
    .from("donations")
    .select("amount")
    .eq("campaign", FESTIVAL.campaignKey)
    .eq("status", "completed");
  if (donations) {
    raisedPounds = (donations as { amount: number }[]).reduce(
      (sum, d) => sum + (d.amount ?? 0),
      0,
    );
  }

  // Live drive event stats: families registered, children on the list, pledges received.
  let familiesRegistered = 0;
  let childrenOnTheList = 0;
  let supplyPledges = 0;

  const { data: eventRow } = await supabase
    .from("events")
    .select("id")
    .eq("slug", B2S_SLUG)
    .maybeSingle();

  if (eventRow) {
    const eventId = (eventRow as { id: string }).id;

    const { count: famCount } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .in("status", ["pending", "approved", "confirmed"]);
    familiesRegistered = famCount ?? 0;

    const { data: regs } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .in("status", ["pending", "approved", "confirmed"]);
    if (regs && regs.length > 0) {
      const ids = (regs as { id: string }[]).map((r) => r.id);
      const { count: childCount } = await supabase
        .from("registration_children")
        .select("id", { count: "exact", head: true })
        .in("registration_id", ids);
      childrenOnTheList = childCount ?? 0;
    }
  }

  const { count: pledgeCount } = await supabase
    .from("back_to_school_supply_pledges")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "confirmed", "received"]);
  supplyPledges = pledgeCount ?? 0;

  return (
    <>
      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative bg-gradient-to-br from-brand-blue via-brand-blue to-brand-dark text-white pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-brand-accent rounded-full opacity-10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-[28rem] h-[28rem] bg-white rounded-full opacity-10 blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7">
              <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-4">
                The drive · CIC · Medway
              </p>
              <h1 className="font-heading font-black text-4xl md:text-6xl lg:text-7xl leading-none mb-6">
                Help {B2S.goalChildren} children
                <br />
                start school
                <br />
                with confidence.
              </h1>
              <p className="text-lg md:text-xl text-white/75 max-w-2xl leading-relaxed mb-6">
                Last year we supported{" "}
                <span className="text-white font-semibold">
                  {FIRST_YEAR_STATS.uniformsGiven} children
                </span>{" "}
                across Medway with uniforms and essentials in two weeks. This
                year, we&rsquo;re aiming for{" "}
                <span className="text-brand-accent font-semibold">
                  {B2S.goalChildren}
                </span>
                .
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/70 mb-8">
                <span className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-accent" />
                  {B2S.dateLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-accent" />
                  {B2S.timeLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-accent" />
                  {B2S.venueName}, {B2S.venueArea}
                </span>
              </div>

              {/* Quick action CTAs */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Button
                  asChild
                  size="sm"
                  className="bg-brand-accent text-brand-dark hover:bg-brand-green hover:text-white"
                >
                  <Link href="/back-to-school/register">
                    Register a family
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-brand-green text-white hover:bg-white hover:text-brand-dark"
                >
                  <Link href="#donate-money">
                    Donate
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white hover:text-brand-dark"
                >
                  <Link href="/back-to-school/donate-supplies">
                    Pledge supplies
                  </Link>
                </Button>
              </div>
            </div>

            {/* Event flyer · polaroid */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-xs sm:max-w-sm -rotate-2 hover:rotate-0 transition-transform duration-500">
                {/* Tape decoration */}
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-amber-100/90 z-20"
                  style={{
                    transform: "translateX(-50%) rotate(-2deg)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
                <div
                  className="bg-white p-3 pb-4 shadow-2xl"
                  style={{
                    boxShadow:
                      "0 4px 20px rgba(0,0,0,0.25), 0 12px 40px rgba(0,0,0,0.2)",
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <Image
                      src="/back-to-school-2026.jpg"
                      alt="Back to School Drive 2026: free uniforms, bags and stationery, Sat 22 August 2026, Sunlight Centre Gillingham"
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 80vw, 400px"
                      priority
                    />
                  </div>
                  <p className="font-heading font-bold text-brand-dark text-sm text-center mt-3">
                    {B2S.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          LIVE STATS STRIP
          ============================================ */}
      <section className="bg-brand-blue text-white pb-12 md:pb-16 -mt-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard
              icon={Users}
              value={familiesRegistered}
              label="Families registered"
              accent="brand-accent"
            />
            <StatCard
              icon={Baby}
              value={childrenOnTheList}
              label="Children on the list"
              accent="brand-accent"
            />
            <StatCard
              icon={Coins}
              value={`£${raisedPounds.toLocaleString()}`}
              label="of £10,000 raised"
              accent="brand-green"
            />
            <StatCard
              icon={Package}
              value={supplyPledges}
              label="Supply pledges"
              accent="brand-green"
            />
          </div>
        </div>
      </section>

      {/* ============================================
          PROGRESS BAR
          ============================================ */}
      <section className="bg-brand-blue text-white pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <FestivalProgressBar raisedPounds={raisedPounds} />
        </div>
      </section>

      {/* ============================================
          WHY WE DO THIS: emotional context
          ============================================ */}
      <WhySection />

      {/* ============================================
          THREE ACTION CARDS
          ============================================ */}
      <section className="bg-brand-pale/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-12">
            <SectionLabel
              text="Three ways to help"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-brand-dark mb-4">
              Register your family. Donate. Pledge new supplies.
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              Registration closes{" "}
              <strong>{B2S.registrationDeadlineLabel}</strong>. Approval emails
              go out the same day with a QR code you&rsquo;ll show on arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* REGISTER */}
            <ActionCard
              id="register"
              accent="blue"
              badge="For families"
              badgeIcon={Users}
              title="Register your children"
              tagline={`Up to ${B2S.maxChildrenPerRegistration} kids per family, ages ${B2S.minChildAge}–${B2S.maxChildAge}.`}
              bullets={[
                { icon: ClipboardList, text: "Add your children + uniform sizes" },
                { icon: QrCode, text: "Get an approval email with a QR code" },
                { icon: Backpack, text: `Collect at ${B2S.venueName} on ${B2S.dateLabel.split(" ").slice(1).join(" ")}` },
              ]}
              cta={{
                href: "/back-to-school/register",
                label: "Register now",
                variant: "primary",
              }}
              footer={`Closes ${B2S.registrationDeadlineLabel}`}
            />

            {/* DONATE MONEY (teaser; form lives in the section below) */}
            <ActionCard
              accent="green"
              badge="Donate money"
              badgeIcon={Sparkles}
              title="Every £20 kits a child."
              tagline={`£${raisedPounds.toLocaleString()} of £10,000 raised so far.`}
              bullets={[
                { icon: Coins, text: "£20 → one full kit" },
                { icon: Users, text: "£200 → 10 children" },
                { icon: Sparkles, text: "100% goes to the campaign" },
              ]}
              cta={{
                href: "#donate-money",
                label: "Donate now",
                variant: "green",
              }}
              footer="One-time or monthly · Secure payment"
            />

            {/* PLEDGE SUPPLIES */}
            <ActionCard
              id="pledge-supplies"
              accent="accent"
              badge="Pledge supplies"
              badgeIcon={Package}
              title="Got brand new kit spare?"
              tagline="Uniforms, stationery and school bags. Brand new only."
              bullets={[
                { icon: Truck, text: "Free collection across Medway" },
                { icon: Package, text: "Or drop off at a time that suits you" },
                { icon: Check, text: "Every item goes to a real family" },
              ]}
              cta={{
                href: "/back-to-school/donate-supplies",
                label: "Pledge now",
                variant: "accent",
              }}
              footer="Brand new items only"
            />
          </div>

          {/* Distribution day details */}
          <div className="mt-10">
            <div className="bg-gradient-to-br from-brand-blue via-brand-blue to-brand-dark text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <p className="font-heading text-xs uppercase tracking-widest text-brand-accent mb-2">
                  Distribution day
                </p>
                <h3 className="font-heading font-black text-2xl md:text-3xl mb-3">
                  {B2S.dateLabel} · {B2S.timeLabel}
                </h3>
                <p className="text-white/75 mb-1">
                  <MapPin className="inline h-4 w-4 text-brand-accent mr-1" />
                  {B2S.venueName}
                </p>
                <p className="text-white/60 text-sm">{B2S.venueAddress}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 md:min-w-[220px]">
                <p className="text-xs uppercase tracking-widest text-brand-accent font-heading font-bold mb-2">
                  Any questions?
                </p>
                <a
                  href="tel:+447874059644"
                  className="flex items-center gap-2 text-white hover:text-brand-accent transition-colors mb-2"
                >
                  <Phone className="h-4 w-4 text-brand-accent shrink-0" />
                  <span className="font-heading font-bold">07874 059644</span>
                </a>
                <a
                  href="mailto:info@evolutionimpactinitiative.co.uk"
                  className="flex items-center gap-2 text-white hover:text-brand-accent transition-colors break-all"
                >
                  <Mail className="h-4 w-4 text-brand-accent shrink-0" />
                  <span className="text-sm">
                    info@evolutionimpactinitiative.co.uk
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          DONATE: dedicated section (target of #donate-money)
          ============================================ */}
      <section id="donate-money" className="bg-white py-16 md:py-24 scroll-mt-24">
        <div className="container mx-auto px-4">
          <DonateSection
            campaign={FESTIVAL.campaignKey}
            campaignTitle={B2S.title}
          />
        </div>
      </section>

      {/* ============================================
          WHAT WE ACCEPT (supplies)
          ============================================ */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <SectionLabel
              text="What we accept"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4">
              Brand new supplies only
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              We stock uniforms for ages {B2S.minChildAge}–{B2S.maxChildAge}.
              Not sure whether something fits?{" "}
              <a
                href="mailto:info@evolutionimpactinitiative.co.uk"
                className="text-brand-blue font-semibold underline"
              >
                Get in touch
              </a>{" "}
              and we&rsquo;ll let you know.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
            {SUPPLY_PLEDGE_ITEMS.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 text-brand-dark/85"
              >
                <Check className="h-5 w-5 text-brand-green shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          BREAKDOWN (£10k redistributed, no shoes)
          ============================================ */}
      <section className="bg-brand-pale/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-10">
            <SectionLabel
              text="Where your support goes"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-3xl md:text-4xl text-brand-dark mb-4">
              £10,000 target · every pound accounted for
            </h2>
            <p className="text-brand-dark/70 leading-relaxed">
              The majority goes directly to children. The rest keeps the
              campaign running and ready for emergencies.
            </p>
          </div>

          <div className="space-y-3">
            <BreakdownRow label="School uniforms" amount="£6,000" pct={60} />
            <BreakdownRow label="Backpacks" amount="£2,000" pct={20} />
            <BreakdownRow label="Stationery" amount="£1,500" pct={15} />
            <BreakdownRow
              label="Emergency support"
              amount="£500"
              pct={5}
              tone="green"
            />
          </div>

          <p className="text-xs text-brand-dark/50 mt-6">
            <span className="text-brand-blue font-semibold">£9,500</span>{" "}
            direct to children (95%) ·{" "}
            <span className="text-brand-green font-semibold">£500</span>{" "}
            emergency contingency (5%)
          </p>
        </div>
      </section>

      {/* ============================================
          IMPORTANT INFO
          ============================================ */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-3xl">
            <SectionLabel
              text="Important: please read"
              color="brand-blue"
              className="mb-6"
            />
            <h2 className="font-heading font-black text-2xl md:text-3xl text-brand-dark">
              How the day works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StepCard
              step="1"
              icon={ClipboardList}
              title="Register your children"
              body={`Up to ${B2S.maxChildrenPerRegistration} per family. Deadline ${B2S.registrationDeadlineLabel}.`}
            />
            <StepCard
              step="2"
              icon={Mail}
              title="Get your approval + QR code"
              body={`We'll email your approval on ${B2S.approvalEmailLabel}. Bring the QR (printed or on your phone).`}
            />
            <StepCard
              step="3"
              icon={Users}
              title="Come and collect"
              body={`${B2S.venueName} · ${B2S.dateLabel.split(" ").slice(1).join(" ")} · ${B2S.timeLabel}. Our team will scan you in.`}
            />
          </div>

          <div className="bg-brand-pale/50 border-2 border-brand-blue/20 rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 md:gap-6 items-start">
              <p className="font-heading font-bold text-brand-blue text-lg md:min-w-[140px]">
                Please note
              </p>
              <ul className="list-disc pl-5 space-y-1 text-brand-dark/80 text-sm">
                  <li>
                    Registration does not guarantee supplies. It&rsquo;s first
                    come, first served on the day.
                  </li>
                  <li>
                    Stock is limited and we may not have every size or item.
                  </li>
                  <li>Please arrive early.</li>
                </ul>
              </div>
            </div>
        </div>
      </section>
    </>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: LucideIcon;
  value: number | string;
  label: string;
  accent: "brand-accent" | "brand-green";
}) {
  const valueClass =
    accent === "brand-accent" ? "text-brand-accent" : "text-brand-green";
  const iconBgClass =
    accent === "brand-accent" ? "bg-brand-accent/15" : "bg-brand-green/15";
  const iconColorClass =
    accent === "brand-accent" ? "text-brand-accent" : "text-brand-green";
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/15 flex items-center gap-4 shadow-lg shadow-black/20">
      <div
        className={`shrink-0 h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center ${iconBgClass}`}
      >
        <Icon className={`h-6 w-6 md:h-7 md:w-7 ${iconColorClass}`} />
      </div>
      <div className="min-w-0">
        <p
          className={`font-heading font-black text-3xl md:text-4xl leading-none ${valueClass}`}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-white/70 mt-1.5 md:mt-2 leading-tight font-heading font-semibold">
          {label}
        </p>
      </div>
    </div>
  );
}

function StepCard({
  step,
  icon: Icon,
  title,
  body,
}: {
  step: string;
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-brand-pale/30 rounded-2xl p-6 border border-brand-blue/10 flex flex-col">
      <div className="flex items-center gap-3 mb-3">
        <span className="font-heading font-black text-3xl text-brand-blue leading-none">
          {step}
        </span>
        <div className="h-9 w-9 rounded-lg bg-brand-blue/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-brand-blue" />
        </div>
      </div>
      <h3 className="font-heading font-bold text-lg text-brand-dark mb-2">
        {title}
      </h3>
      <p className="text-sm text-brand-dark/70 leading-relaxed">{body}</p>
    </div>
  );
}

type ActionCardAccent = "blue" | "green" | "accent";

interface ActionCardCta {
  href: string;
  label: string;
  variant: "primary" | "green" | "accent";
}

interface ActionCardBullet {
  icon: LucideIcon;
  text: string;
}

function ActionCard({
  id,
  accent,
  badge,
  badgeIcon: BadgeIcon,
  title,
  tagline,
  bullets,
  cta,
  footer,
}: {
  id?: string;
  accent: ActionCardAccent;
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  tagline: string;
  bullets: ActionCardBullet[];
  cta: ActionCardCta;
  footer: string;
}) {
  const borderClass =
    accent === "blue"
      ? "border-brand-blue/20"
      : accent === "green"
        ? "border-brand-green/30"
        : "border-brand-accent/50";
  const badgeBgClass =
    accent === "blue"
      ? "bg-brand-blue/10 text-brand-blue"
      : accent === "green"
        ? "bg-brand-green/10 text-brand-green"
        : "bg-brand-accent/20 text-brand-blue";
  const bulletIconClass =
    accent === "blue"
      ? "text-brand-blue"
      : accent === "green"
        ? "text-brand-green"
        : "text-brand-blue";
  const buttonClass =
    cta.variant === "primary"
      ? "bg-brand-blue text-white hover:bg-brand-dark"
      : cta.variant === "green"
        ? "bg-brand-green text-white hover:bg-brand-dark"
        : "bg-brand-accent text-brand-dark hover:bg-brand-dark hover:text-white";

  return (
    <div
      id={id}
      className={`bg-white rounded-2xl p-6 md:p-7 border-2 flex flex-col ${borderClass}`}
    >
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-widest mb-4 self-start ${badgeBgClass}`}
      >
        <BadgeIcon className="h-3 w-3" />
        {badge}
      </div>
      <h3 className="font-heading font-semibold text-2xl text-brand-dark mb-2 leading-tight">
        {title}
      </h3>
      <p className="text-brand-dark/70 text-sm mb-5">{tagline}</p>

      <ul className="space-y-2.5 mb-6 flex-1">
        {bullets.map((b, i) => {
          const Icon = b.icon;
          return (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm text-brand-dark/85"
            >
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${bulletIconClass}`} />
              <span>{b.text}</span>
            </li>
          );
        })}
      </ul>

      <Button asChild size="lg" className={buttonClass}>
        <Link href={cta.href}>
          {cta.label}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
      <p className="text-xs text-brand-dark/50 mt-3 text-center">{footer}</p>
    </div>
  );
}

function BreakdownRow({
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
  const bgClass = "bg-brand-blue/10";

  return (
    <div className="flex items-center gap-4">
      <span className="font-heading font-semibold text-brand-dark text-sm md:text-base w-32 md:w-40 shrink-0">
        {label}
      </span>
      <div className={`flex-1 h-3 rounded-full overflow-hidden ${bgClass}`}>
        <div
          className={`h-full rounded-full ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-heading font-bold text-brand-dark text-sm md:text-base w-16 text-right shrink-0">
        {amount}
      </span>
    </div>
  );
}
