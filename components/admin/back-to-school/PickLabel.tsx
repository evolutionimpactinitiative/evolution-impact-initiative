import { B2S } from "@/lib/back-to-school";

// One printable 4×6" label per child. Sticks to the bag → picker scans
// the QR to see what to grab (that's the /b2s/verify/[token] page).

export interface PickLabelChild {
  id: string;
  child_name: string;
}

export interface PickLabelFamily {
  id: string;
  parent_name: string;
  status: string;
  qr_token: string | null;
}

interface Props {
  child: PickLabelChild;
  family: PickLabelFamily;
  qrDataUrl: string | null;
}

export function PickLabel({ child, family, qrDataUrl }: Props) {
  const ref = family.id.slice(0, 8).toUpperCase();
  const isWalkIn = family.status === "walk_in";

  return (
    <article className="pick-label">
      <div>
        <p className="pl-eyebrow">Back to School Drive · {B2S.dateLabel}</p>
        <h1 className="pl-child-name">{child.child_name}</h1>
        <p className="pl-parent">
          For: <strong>{family.parent_name}</strong>
        </p>
      </div>

      <div className="pl-qr-wrap">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="Family QR" className="pl-qr" />
        ) : (
          <div className="pl-qr-placeholder">
            No QR — send approval email first
          </div>
        )}
      </div>

      <div className="pl-footer">
        <span className="pl-ref">Ref {ref}</span>
        <span className="pl-status">
          {isWalkIn ? "Walk-in" : "Approved"}
        </span>
      </div>
    </article>
  );
}
