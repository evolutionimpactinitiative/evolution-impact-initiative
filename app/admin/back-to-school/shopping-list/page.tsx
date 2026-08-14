import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { QrShareCard } from "@/components/admin/QrShareCard";
import { B2S } from "@/lib/back-to-school";
import { ShoppingListAdminView } from "@/components/admin/back-to-school/ShoppingListAdminView";
import type {
  ShoppingPledger,
  ShoppingReservation,
} from "@/lib/back-to-school/shopping-list";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function B2SShoppingListAdminPage() {
  const supabase = createAdminClient();

  const [
    { data: pledgersRaw },
    { data: reservationsRaw },
  ] = await Promise.all([
    supabase
      .from("back_to_school_shopping_pledgers")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("back_to_school_shopping_reservations")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const pledgers = (pledgersRaw as ShoppingPledger[] | null) ?? [];
  const reservations =
    (reservationsRaw as ShoppingReservation[] | null) ?? [];

  const BASE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://evolutionimpactinitiative.co.uk";
  const shoppingKey = (process.env.B2S_SHOPPING_LIST_KEY ?? "").trim();
  const shoppingUrl = shoppingKey
    ? `${BASE_URL}/back-to-school/shopping-list?k=${encodeURIComponent(shoppingKey)}`
    : null;
  const qrSrc = shoppingUrl
    ? await QRCode.toDataURL(shoppingUrl, {
        width: 480,
        margin: 1,
        errorCorrectionLevel: "M",
        color: { dark: "#1E1E1E", light: "#FFFFFF" },
      })
    : null;

  const active = reservations.filter((r) => r.status === "reserved").length;
  const received = reservations.filter((r) => r.status === "received").length;
  const cancelled = reservations.filter((r) => r.status === "cancelled").length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/back-to-school"
          className="text-sm text-gray-600 hover:text-brand-dark inline-flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Back to School
        </Link>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-brand-dark">
          Shopping list
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Donors reserve items to buy for the drive via the shared link
          below. Mark items received when you collect them — that posts a
          positive stock movement so the shortfall on the Stock page
          updates automatically.
        </p>
      </div>

      {/* Shareable link + QR */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-brand-dark">
            Share this with donors
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            One link — send it out via WhatsApp / voice notes. Anyone with
            it can reserve items. Rotate the <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">B2S_SHOPPING_LIST_KEY</code> env var if it
            leaks.
          </p>
        </div>
        {shoppingUrl && qrSrc ? (
          <QrShareCard
            link={shoppingUrl}
            qrSrc={qrSrc}
            title={`${B2S.title} — Shopping list`}
            linkLabel="Shopping list URL:"
            posterSubtitle="Scan to grab items on the drive's shopping list"
            description="Also good for a WhatsApp broadcast — copy the link and paste with a short ask."
          />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
            <p className="font-heading font-bold uppercase tracking-widest text-xs mb-1">
              Shopping list not configured
            </p>
            <p>
              Set the <code className="bg-amber-100 px-1 py-0.5 rounded">B2S_SHOPPING_LIST_KEY</code> environment variable
              in Vercel and redeploy.
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <MiniStat label="Active reservations" value={active} tone="blue" />
        <MiniStat label="Received" value={received} tone="green" />
        <MiniStat label="Cancelled" value={cancelled} tone="gray" />
      </div>

      {/* Reservations grouped by pledger */}
      <ShoppingListAdminView
        pledgers={pledgers}
        reservations={reservations}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "green" | "gray";
}) {
  const cls: Record<string, string> = {
    blue: "text-brand-blue",
    green: "text-brand-green",
    gray: "text-gray-500",
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className="text-[10px] uppercase tracking-widest font-heading font-bold text-gray-500">
        {label}
      </p>
      <p
        className={`font-heading font-black text-3xl mt-1 ${cls[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}
