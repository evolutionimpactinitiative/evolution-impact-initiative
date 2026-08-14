import { B2S } from "@/lib/back-to-school";
import type { UniformChoices } from "@/lib/back-to-school";

// One printable A5-portrait ticket per family. Uses inline styles because
// print CSS behaves better with them than Tailwind classes on some browsers.

export type PickTicketChild = {
  id: string;
  child_name: string;
  child_age: number | null;
  uniform_size: string | null;
  sex: string | null;
  school: string | null;
  needs: string[] | null;
  uniform_choices: UniformChoices | null;
  notes: string | null;
  display_order: number;
};

export type PickTicketFamily = {
  id: string;
  parent_name: string;
  parent_phone: string;
  parent_postcode: string | null;
  parent_email: string;
  status: string;
  qr_token: string | null;
  registration_children: PickTicketChild[];
};

interface Props {
  family: PickTicketFamily;
  qrDataUrl: string | null;
}

const COLOUR_LABEL: Record<string, string> = {
  white: "White",
  blue: "Blue",
  grey: "Grey",
  black: "Black",
};

const BOTTOM_LABEL: Record<string, string> = {
  trousers: "Trousers",
  skirt: "Skirt",
  dress: "Dress",
  shorts: "Shorts",
};

const SEX_LABEL: Record<string, string> = {
  male: "Boy",
  female: "Girl",
  other: "Other",
  prefer_not_to_say: "—",
};

export function PickTicket({ family, qrDataUrl }: Props) {
  const ref = family.id.slice(0, 8).toUpperCase();
  const children = [...family.registration_children].sort(
    (a, b) => a.display_order - b.display_order,
  );
  const isWalkIn = family.status === "walk_in";

  return (
    <article className="pick-ticket">
      <header className="pt-header">
        <div className="pt-title-block">
          <p className="pt-eyebrow">Back to School Drive 2026</p>
          <h1 className="pt-family-name">{family.parent_name}</h1>
          <p className="pt-meta">
            {family.parent_phone} · {family.parent_postcode ?? "—"}
          </p>
        </div>
        <div className="pt-qr-block">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Family QR" className="pt-qr" />
          ) : (
            <div className="pt-qr-placeholder">no QR</div>
          )}
          <p className="pt-ref">Ref: {ref}</p>
          <p className="pt-status">
            {isWalkIn ? "WALK-IN" : "APPROVED"}
          </p>
        </div>
      </header>

      <section className="pt-kids">
        {children.map((c, i) => (
          <ChildBlock key={c.id} child={c} index={i} />
        ))}
      </section>

      <footer className="pt-footer">
        <div className="pt-outcome">
          <span className="pt-label">Outcome:</span>
          <span className="pt-checkbox">☐ Collected</span>
          <span className="pt-checkbox">☐ Partial</span>
          <span className="pt-checkbox">☐ No-show</span>
        </div>
        <div className="pt-notes">
          <span className="pt-label">Steward notes:</span>
          <span className="pt-blank-line" />
        </div>
        <p className="pt-venue">
          {B2S.venueName} · {B2S.dateLabel} · {B2S.timeLabel}
        </p>
      </footer>
    </article>
  );
}

function ChildBlock({
  child,
  index,
}: {
  child: PickTicketChild;
  index: number;
}) {
  const needs = child.needs ?? [];
  const uc = child.uniform_choices;
  const wantsUniform = needs.includes("uniform");
  const wantsStationery = needs.includes("stationery");
  const wantsBag = needs.includes("bag");
  const sexLabel = child.sex ? SEX_LABEL[child.sex] ?? child.sex : "—";

  return (
    <div className="pt-child">
      <div className="pt-child-head">
        <span className="pt-child-num">Child {index + 1}</span>
        <span className="pt-child-name">{child.child_name}</span>
        {child.child_age != null && (
          <span className="pt-child-meta">age {child.child_age}</span>
        )}
        <span className="pt-child-meta">· {sexLabel}</span>
        <span className="pt-child-size">
          Size <strong>{child.uniform_size ?? "—"}</strong>
        </span>
      </div>

      {child.school && (
        <p className="pt-school">School: {child.school}</p>
      )}

      <ul className="pt-items">
        {wantsUniform && uc && uc.bottom && (
          <PickItem
            label={`${COLOUR_LABEL[uc.bottom.colour] ?? uc.bottom.colour} ${
              BOTTOM_LABEL[uc.bottom.type]?.toLowerCase() ?? uc.bottom.type
            }`}
            withSubstitution
          />
        )}
        {wantsUniform && uc?.polo && (
          <PickItem
            label={`${COLOUR_LABEL[uc.polo.colour] ?? uc.polo.colour} polo (${uc.polo.sleeve} sleeve)`}
            withSubstitution
          />
        )}
        {wantsUniform && uc?.shirt && (
          <PickItem
            label={`White shirt (${uc.shirt.sleeve} sleeve)`}
            withSubstitution
          />
        )}
        {wantsStationery && <PickItem label="Stationery pack" />}
        {wantsBag && <PickItem label="School bag" />}
      </ul>

      {child.notes && (
        <p className="pt-child-notes">
          <strong>Note from parent:</strong> {child.notes}
        </p>
      )}
    </div>
  );
}

function PickItem({
  label,
  withSubstitution,
}: {
  label: string;
  withSubstitution?: boolean;
}) {
  return (
    <li className="pt-item">
      <span className="pt-item-check">☐</span>
      <span className="pt-item-label">{label}</span>
      {withSubstitution && (
        <span className="pt-item-given">
          <span className="pt-item-given-label">Given:</span>
          <span className="pt-blank-line pt-inline-blank" />
        </span>
      )}
    </li>
  );
}
