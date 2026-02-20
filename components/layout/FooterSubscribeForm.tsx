"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle } from "lucide-react";

export function FooterSubscribeForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to subscribe");
      }

      setIsSuccess(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center gap-2 text-brand-accent">
        <CheckCircle className="h-5 w-5" />
        <span className="text-base">Thanks for subscribing!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-base sm:w-72"
          disabled={isLoading}
        />
        <Button
          type="submit"
          variant="secondary"
          disabled={isLoading}
          className="h-12 px-8"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Subscribe"}
        </Button>
      </div>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </form>
  );
}
