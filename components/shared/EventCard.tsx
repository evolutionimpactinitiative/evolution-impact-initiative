import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventCardProps {
  title: string;
  date: string;
  time?: string;
  location: string;
  description: string;
  image: string;
  link?: string;
  isPast?: boolean;
  stats?: string;
  testimonial?: string;
  className?: string;
}

export function EventCard({
  title,
  date,
  time,
  location,
  description,
  image,
  link = "#",
  isPast = false,
  stats,
  testimonial,
  className,
}: EventCardProps) {
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
        {!isPast && (
          <Button asChild variant="outline" size="sm">
            <Link href={link}>Register / Learn More</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
