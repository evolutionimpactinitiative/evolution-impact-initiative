"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Check } from "lucide-react";

const DONATION_AMOUNTS = [5, 10, 25, 50, 100];

export function DonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"one-time" | "monthly">("one-time");
  const [giftAid, setGiftAid] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const getAmount = () => {
    if (customAmount) {
      return parseFloat(customAmount);
    }
    return selectedAmount || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = getAmount();
    if (amount < 1) {
      setError("Please enter an amount of at least £1");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/donations/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          frequency,
          giftAid,
          donorEmail: email || undefined,
          donorName: name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Donation error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const amount = getAmount();
  const giftAidBonus = giftAid ? Math.round(amount * 0.25 * 100) / 100 : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Frequency Toggle */}
      <div className="bg-gray-100 rounded-lg p-1 flex">
        <button
          type="button"
          onClick={() => setFrequency("one-time")}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
            frequency === "one-time"
              ? "bg-white shadow text-brand-dark"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          One-time
        </button>
        <button
          type="button"
          onClick={() => setFrequency("monthly")}
          className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-all ${
            frequency === "monthly"
              ? "bg-white shadow text-brand-dark"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Amount Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Amount
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
          {DONATION_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => handleAmountSelect(amount)}
              className={`py-3 px-4 rounded-lg border-2 font-bold text-lg transition-all ${
                selectedAmount === amount
                  ? "border-brand-green bg-brand-green/10 text-brand-green"
                  : "border-gray-200 hover:border-brand-green text-gray-700"
              }`}
            >
              £{amount}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            £
          </span>
          <input
            type="number"
            min="1"
            step="1"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            placeholder="Other amount"
            className={`w-full pl-8 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent ${
              customAmount ? "border-brand-green" : "border-gray-200"
            }`}
          />
        </div>
      </div>

      {/* Gift Aid */}
      <div className="bg-brand-pale rounded-xl p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <div className="mt-1">
            <input
              type="checkbox"
              checked={giftAid}
              onChange={(e) => setGiftAid(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
          </div>
          <div className="flex-1">
            <span className="font-semibold text-brand-dark flex items-center gap-2">
              Add Gift Aid
              {giftAid && amount > 0 && (
                <span className="text-sm font-normal bg-brand-green text-white px-2 py-0.5 rounded-full">
                  +£{giftAidBonus.toFixed(2)} extra
                </span>
              )}
            </span>
            <p className="text-sm text-gray-600 mt-1">
              I am a UK taxpayer and understand that if I pay less Income Tax and/or Capital Gains Tax than the amount of Gift Aid claimed on all my donations in that tax year, it is my responsibility to pay any difference.
            </p>
          </div>
        </label>
      </div>

      {/* Optional Contact Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
            placeholder="For your receipt"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-green focus:border-transparent"
            placeholder="For your receipt and updates"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Summary & Submit */}
      <div className="bg-brand-dark rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/70">Your donation</span>
          <span className="text-2xl font-bold">
            £{amount.toFixed(2)}
            {frequency === "monthly" && (
              <span className="text-sm font-normal text-white/70">/month</span>
            )}
          </span>
        </div>
        {giftAid && amount > 0 && (
          <div className="flex items-center justify-between mb-4 text-brand-accent">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Gift Aid bonus
            </span>
            <span className="font-semibold">+£{giftAidBonus.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-white/20 pt-4 flex items-center justify-between mb-6">
          <span className="font-semibold">Total impact</span>
          <span className="text-2xl font-bold text-brand-accent">
            £{(amount + giftAidBonus).toFixed(2)}
            {frequency === "monthly" && (
              <span className="text-sm font-normal text-white/70">/month</span>
            )}
          </span>
        </div>

        <Button
          type="submit"
          className="w-full bg-brand-green hover:bg-brand-green/90 text-white"
          size="lg"
          disabled={isLoading || amount < 1}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 mr-2" />
              {frequency === "monthly" ? "Start Monthly Donation" : "Donate Now"}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-white/50 mt-4">
          Secure payment powered by Stripe
        </p>
      </div>
    </form>
  );
}
