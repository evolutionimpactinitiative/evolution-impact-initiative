import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

interface Props {
  section?: string;
  message?: string;
}

export function NotAuthorized({ section, message }: Props) {
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Lock className="h-7 w-7 text-gray-500" />
      </div>
      <h1 className="text-2xl font-heading font-black text-brand-dark mb-2">
        Not authorised
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        {message ??
          (section
            ? `You don't have access to ${section}. Ask the chair if this is a mistake.`
            : "You don't have access to this section. Ask the chair if this is a mistake.")}
      </p>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
