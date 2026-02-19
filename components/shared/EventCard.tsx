import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RegistrationStatus = "open" | "waitlist" | "full" | "closed";

interface EventCardProps {
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  image: string;
  slug: string;
  isPast?: boolean;
  stats?: string;
  testimonial?: string;
  className?: string;
  // Registration status props
  registrationStatus?: RegistrationStatus;
  spotsRemaining?: number;
  waitlistRemaining?: number;
}

export function EventCard({
  title,
  date,
  time,
  location,
  description,
  image,
  slug,
  isPast = false,
  stats,
  testimonial,
  className,
  registrationStatus = "open",
  spotsRemaining,
  waitlistRemaining,
}: EventCardProps) {
  // Determine badge and button state based on registration status
  const getStatusBadge = () => {
    if (isPast) return null; // Past event badge is handled separately

    switch (registrationStatus) {
      case "full":
        return (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium">
            Fully Booked
          </div>
        );
      case "waitlist":
        return (
          <div className="absolute top-4 left-4 bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            Waitlist Open
          </div>
        );
      case "closed":
        return (
          <div className="absolute top-4 left-4 bg-gray-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            Registration Closed
          </div>
        );
      case "open":
        if (spotsRemaining !== undefined && spotsRemaining <= 5 && spotsRemaining > 0) {
          return (
            <div className="absolute top-4 left-4 bg-brand-green text-white text-xs px-3 py-1 rounded-full font-medium">
              {spotsRemaining} {spotsRemaining === 1 ? "spot" : "spots"} left
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (isPast) return "View Details";
    switch (registrationStatus) {
      case "full":
        return "Fully Booked";
      case "waitlist":
        return "Join Waitlist";
      case "closed":
        return "Registration Closed";
      default:
        return "Register / Learn More";
    }
  };

  const isButtonDisabled = registrationStatus === "full" || registrationStatus === "closed";
  return (
    <div
      className={cn(
        "bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow",
        className
      )}
    >
      <div className="relative h-48 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover cinematic-filter hover:scale-105 transition-transform duration-300"
        />
        {isPast && (
          <div className="absolute top-4 right-4 bg-brand-dark/80 text-white text-xs px-3 py-1 rounded-full">
            Past Event
          </div>
        )}
        {getStatusBadge()}
      </div>
      <div className="p-6">
        <h3 className="font-heading font-bold text-xl mb-3">{title}</h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-brand-dark/70 text-sm">
            <Calendar className="h-4 w-4 text-brand-blue" />
            <span>{date}</span>
          </div>
          {time && (
            <div className="flex items-center gap-2 text-brand-dark/70 text-sm">
              <Clock className="h-4 w-4 text-brand-blue" />
              <span>{time}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-brand-dark/70 text-sm">
            <MapPin className="h-4 w-4 text-brand-blue" />
            <span>{location}</span>
          </div>
        </div>
        <p className="text-brand-dark/70 mb-4 leading-relaxed">{description}</p>
        {stats && (
          <p className="text-sm text-brand-green font-semibold mb-4">{stats}</p>
        )}
        {testimonial && (
          <blockquote className="border-l-4 border-brand-accent pl-4 mb-4 italic text-sm text-brand-dark/70">
            &ldquo;{testimonial}&rdquo;
          </blockquote>
        )}
        <Button
          asChild={!isButtonDisabled}
          variant={isButtonDisabled ? "secondary" : "outline"}
          size="sm"
          disabled={isButtonDisabled}
          className={cn(
            isButtonDisabled && "opacity-60 cursor-not-allowed"
          )}
        >
          {isButtonDisabled ? (
            <span>{getButtonText()}</span>
          ) : (
            <Link href={`/events/${slug}`}>{getButtonText()}</Link>
          )}
        </Button>
      </div>
    </div>
  );
}
