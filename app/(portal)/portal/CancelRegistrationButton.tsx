"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelRegistrationAction } from "./actions";

interface Props {
  registrationId: string;
  label?: string;
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

export function CancelRegistrationButton({
  registrationId,
  label = "Cancel registration",
  variant = "ghost",
  className,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (!confirm("Cancel this registration? Your spot will be released for another family.")) {
            return;
          }
          setError(null);
          startTransition(async () => {
            try {
              await cancelRegistrationAction(registrationId);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not cancel");
            }
          });
        }}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 font-heading font-bold"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cancelling…
          </>
        ) : (
          label
        )}
      </Button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
