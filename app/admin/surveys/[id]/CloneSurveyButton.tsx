"use client";

import { useTransition } from "react";
import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cloneSurveyAction } from "./actions";

// Duplicates the current survey. The server action redirects to the
// new clone's edit page, so no success state to render here.
export function CloneSurveyButton({ surveyId }: { surveyId: string }) {
  const [isPending, startTransition] = useTransition();

  function go() {
    if (!confirm("Duplicate this survey? A copy will be created as a draft (inactive) so you can tweak before publishing.")) {
      return;
    }
    startTransition(async () => {
      try {
        await cloneSurveyAction(surveyId);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not clone");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={go} disabled={isPending}>
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
      ) : (
        <Copy className="w-4 h-4 mr-1" />
      )}
      Duplicate
    </Button>
  );
}
