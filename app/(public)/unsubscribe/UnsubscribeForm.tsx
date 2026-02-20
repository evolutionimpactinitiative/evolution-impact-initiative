"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function UnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setMessage("");

    if (!email) {
      setStatus("error");
      setMessage("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unsubscribe");
      }

      setStatus("success");
      setMessage(data.message || "You have been unsubscribed successfully.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green/10 mb-6">
          <CheckCircle className="h-8 w-8 text-brand-green" />
        </div>
        <h2 className="font-heading font-bold text-2xl text-brand-dark mb-4">
          Unsubscribed
        </h2>
        <p className="text-brand-dark/70 mb-6">{message}</p>
        <p className="text-sm text-brand-dark/50">
          Changed your mind?{" "}
          <button
            onClick={() => setStatus("idle")}
            className="text-brand-blue hover:underline"
          >
            Resubscribe
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-brand-pale/30 rounded-xl p-8">
      <h2 className="font-heading font-bold text-xl text-brand-dark mb-2">
        Unsubscribe from our mailing list
      </h2>
      <p className="text-brand-dark/70 text-sm mb-6">
        Enter the email address you want to unsubscribe.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            "Unsubscribe"
          )}
        </Button>
      </form>

      <p className="text-xs text-brand-dark/50 mt-6 text-center">
        You can always resubscribe via our website footer.
      </p>
    </div>
  );
}
