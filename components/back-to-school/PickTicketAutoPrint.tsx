"use client";

import * as React from "react";
import Link from "next/link";
import { Printer, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  // Where to return the volunteer once they're done with this ticket.
  scannerHref: string;
  // Short label for confirmation ("Test Family" etc)
  familyLabel: string;
}

export function PickTicketAutoPrint({ scannerHref, familyLabel }: Props) {
  const [triggered, setTriggered] = React.useState(false);

  // Auto-trigger the browser print dialog once, shortly after mount so the
  // ticket HTML has settled. Volunteer can always re-print via the button.
  React.useEffect(() => {
    const t = setTimeout(() => {
      window.print();
      setTriggered(true);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="print:hidden bg-white rounded-2xl border-2 border-brand-blue/25 p-4 md:p-5 space-y-3 max-w-lg mx-auto">
      <div className="flex items-center gap-2 text-emerald-800">
        <CheckCircle2 className="h-5 w-5" />
        <p className="font-heading font-bold text-brand-dark">
          Ticket loaded for <span className="text-brand-blue">{familyLabel}</span>
        </p>
      </div>
      <p className="text-sm text-gray-600">
        {triggered
          ? "Print dialog opened. If nothing happened, hit Print below."
          : "Opening print dialog…"}{" "}
        Stick the paper to the bag and pass to Station 3.
      </p>
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark"
        >
          <Printer className="h-4 w-4" />
          Print again
        </button>
        <Link
          href={scannerHref}
          className="inline-flex items-center gap-1.5 bg-brand-green text-white px-4 py-2 rounded-md text-sm font-heading font-bold uppercase tracking-widest hover:bg-brand-dark ml-auto"
        >
          Next family
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
