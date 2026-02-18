import Image from "next/image";
import { Mail } from "lucide-react";
import { PolaroidCard } from "./PolaroidCard";

interface TeamMemberCardProps {
  name: string;
  role: string;
  bio: string;
  email: string;
  image: string;
  rotation?: "rotate-1" | "-rotate-1" | "rotate-2" | "-rotate-2" | "none";
}

export function TeamMemberCard({
  name,
  role,
  bio,
  email,
  image,
  rotation = "none",
}: TeamMemberCardProps) {
  return (
    <PolaroidCard rotation={rotation} tapeStyle="top">
      <div className="relative h-64 overflow-hidden bg-brand-pale">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover object-top cinematic-filter"
        />
      </div>
      <div className="mt-4 text-center flex-grow flex flex-col">
        <h3 className="font-heading font-bold text-xl text-brand-dark">
          {name}
        </h3>
        <p className="text-brand-blue font-heading font-semibold text-sm mb-2">
          {role}
        </p>
        <p className="text-brand-dark/70 text-sm leading-relaxed mb-3 flex-grow">
          {bio}
        </p>
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center justify-center gap-2 text-sm text-brand-green hover:text-brand-blue transition-colors"
        >
          <Mail className="h-4 w-4" />
          <span>Contact</span>
        </a>
      </div>
    </PolaroidCard>
  );
}
