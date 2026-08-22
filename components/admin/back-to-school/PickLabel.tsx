import { B2S } from "@/lib/back-to-school";
import type { UniformChoices } from "@/lib/back-to-school";

// One printable 4×6" label per child, with the pick items for that
// child. Sticks on the bag → picker fills the bag from the label →
// steward scans the QR at handout to mark collected.

export interface PickLabelChild {
  id: string;
  child_name: string;
  child_age: number | null;
  uniform_size: string | null;
  sex: string | null;
  school: string | null;
  needs: string[] | null;
  uniform_choices: UniformChoices | null;
  notes: string | null;
}

export interface PickLabelFamily {
  id: string;
  parent_name: string;
  status: string;
  qr_token: string | null;
}

// Explicit pick items — when provided, overrides the items derived
// from uniform_choices. Used after the Station 2 prep flow so labels
// print the substituted SKUs instead of the originally-requested ones.
export interface PickLabelItem {
  label: string;                 // "Grey trousers · size 5"
  substitutingFor?: string;      // "size 5-6" — shown as small suffix
  needsSubstitutionBlank?: boolean; // renders the "Given: ___" line
}

interface Props {
  child: PickLabelChild;
  family: PickLabelFamily;
  qrDataUrl: string | null;
  overrideItems?: PickLabelItem[];
}

const COLOUR_LABEL: Record<string, string> = {
  white: "White",
  blue: "Blue",
  grey: "Grey",
  black: "Black",
};

const BOTTOM_LABEL: Record<string, string> = {
  trousers: "trousers",
  skirt: "skirt",
  dress: "dress",
  shorts: "shorts",
};

const SEX_LABEL: Record<string, string> = {
  male: "Boy",
  female: "Girl",
  other: "Other",
  prefer_not_to_say: "—",
};

export function PickLabel({ child, family, qrDataUrl, overrideItems }: Props) {
  const ref = family.id.slice(0, 8).toUpperCase();
  const isWalkIn = family.status === "walk_in";
  const sexLabel = child.sex ? SEX_LABEL[child.sex] ?? child.sex : null;

  const needs = child.needs ?? [];
  const uc = child.uniform_choices;
  const wantsUniform = needs.includes("uniform");
  const wantsStationery = needs.includes("stationery");
  const wantsBag = needs.includes("bag");
  const useOverride = Array.isArray(overrideItems);

  const metaBits: string[] = [];
  if (child.child_age != null) metaBits.push(`Age ${child.child_age}`);
  if (sexLabel) metaBits.push(sexLabel);
  if (child.uniform_size) metaBits.push(`Size ${child.uniform_size}`);

  return (
    <article className="pick-label">
      <div>
        <p className="pl-eyebrow">
          B2S Drive · {B2S.dateLabel}
        </p>
        <h1 className="pl-child-name">{child.child_name}</h1>
        <p className="pl-parent">
          For: <strong>{family.parent_name}</strong>
        </p>
        {metaBits.length > 0 && (
          <p className="pl-meta">{metaBits.join(" · ")}</p>
        )}
      </div>

      <div>
        <p className="pl-section-label">To pick</p>
        <ul className="pl-items">
          {useOverride ? (
            overrideItems!.map((it, i) => (
              <PickItem
                key={i}
                label={it.label}
                substitutingFor={it.substitutingFor}
                withSubstitution={it.needsSubstitutionBlank ?? false}
              />
            ))
          ) : (
            <>
              {wantsUniform && uc?.bottom && (
                <PickItem
                  label={`${COLOUR_LABEL[uc.bottom.colour] ?? uc.bottom.colour} ${
                    BOTTOM_LABEL[uc.bottom.type] ?? uc.bottom.type
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
            </>
          )}
        </ul>

        {child.school && (
          <p className="pl-school">School: {child.school}</p>
        )}
        {child.notes && (
          <p className="pl-note">
            <strong>Note:</strong> {child.notes}
          </p>
        )}
      </div>

      <div className="pl-bottom">
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
        <div className="pl-outcome">
          <p className="pl-outcome-label">Outcome</p>
          <p className="pl-outcome-check">☐ Collected</p>
          <p className="pl-outcome-check">☐ Partial</p>
          <p className="pl-outcome-check">☐ No-show</p>
        </div>
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

function PickItem({
  label,
  withSubstitution,
  substitutingFor,
}: {
  label: string;
  withSubstitution?: boolean;
  substitutingFor?: string;
}) {
  return (
    <li className="pl-item">
      <span className="pl-item-check">☐</span>
      <span className="pl-item-label">
        {label}
        {substitutingFor && (
          <span
            style={{
              display: "block",
              fontSize: "8pt",
              color: "#B45309",
              fontWeight: 600,
              marginTop: "0.5mm",
            }}
          >
            substituting for {substitutingFor}
          </span>
        )}
      </span>
      {withSubstitution && (
        <span className="pl-item-given">
          <span className="pl-item-given-label">Given:</span>
          <span className="pl-blank" />
        </span>
      )}
    </li>
  );
}
