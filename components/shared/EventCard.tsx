import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
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
  // Get status badge config
  const getStatusConfig = () => {
    if (isPast) {
      return {
        text: "Past Event",
        bgColor: "bg-gray-600",
      };
    }

    switch (registrationStatus) {
      case "full":
        return {
          text: "Fully Booked",
          bgColor: "bg-red-500",
        };
      case "waitlist":
        return {
          text: "Waitlist Open",
          bgColor: "bg-yellow-500",
        };
      case "closed":
        return {
          text: "Registration Closed",
          bgColor: "bg-gray-500",
        };
      case "open":
      default:
        if (spotsRemaining !== undefined && spotsRemaining <= 5 && spotsRemaining > 0) {
          return {
            text: `${spotsRemaining} ${spotsRemaining === 1 ? "spot" : "spots"} left!`,
            bgColor: "bg-orange-500",
          };
        }
        return {
          text: "Registration Open",
          bgColor: "bg-brand-green",
        };
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
        return "Register Now";
    }
  };

  const isButtonDisabled = registrationStatus === "full" || registrationStatus === "closed";
  const statusConfig = getStatusConfig();

  // Alternate rotation for visual interest
  const rotations = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2"];
  const randomRotation = rotations[Math.floor(title.length % rotations.length)];

  return (
    <div
      className={cn(
        "group relative",
        className
      )}
    >
      {/* Polaroid card */}
      <div
        className={cn(
          "bg-white p-3 pb-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
          randomRotation,
          "hover:rotate-0"
        )}
        style={{
          boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 8px 35px rgba(0,0,0,0.08)",
        }}
      >
        {/* Tape decoration at top */}
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-6 bg-amber-100/80 z-10"
          style={{
            transform: "translateX(-50%) rotate(-2deg)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        />

        {/* Image container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
          />

          {/* Status badge */}
          <div
            className={cn(
              "absolute top-2 left-2 text-xs px-2.5 py-1 rounded-full font-semibold text-white shadow-sm",
              statusConfig.bgColor
            )}
          >
            {statusConfig.text}
          </div>
        </div>

        {/* Caption area - polaroid style */}
        <div className="pt-3 pb-1">
          {/* Title */}
          <h3 className="font-heading font-bold text-lg text-brand-dark mb-2 line-clamp-1">
            {title}
          </h3>

          {/* Event details */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Calendar className="h-3.5 w-3.5 text-brand-blue flex-shrink-0" />
              <span className="truncate">{date}</span>
            </div>
            {time && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Clock className="h-3.5 w-3.5 text-brand-blue flex-shrink-0" />
                <span>{time}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin className="h-3.5 w-3.5 text-brand-blue flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-500 text-sm italic line-clamp-2 mb-3">
            {description}
          </p>

          {/* Stats if provided */}
          {stats && (
            <p className="text-sm text-brand-green font-semibold mb-2">{stats}</p>
          )}

          {/* Button */}
          <Button
            asChild={!isButtonDisabled}
            variant={isPast ? "outline" : isButtonDisabled ? "secondary" : "default"}
            size="sm"
            disabled={isButtonDisabled}
            className={cn(
              "w-full font-semibold",
              isButtonDisabled && "opacity-60 cursor-not-allowed",
              !isPast && !isButtonDisabled && "bg-brand-blue hover:bg-brand-dark"
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
    </div>
  );
}
