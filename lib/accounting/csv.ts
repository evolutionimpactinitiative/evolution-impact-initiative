// CSV parsing + bank-row helpers for the accounting import wizard.
// Pure functions — no React, no Supabase. Safe to use client- or server-side.

export interface CsvParseResult {
  headers: string[];
  rows: string[][]; // each row is the same length as headers; short rows are right-padded
}

// RFC-4180-ish parser. Handles:
//   - quoted fields with embedded commas
//   - double-quote escape ("" → ")
//   - \r\n, \r, or \n line endings
//   - trailing empty lines (skipped)
// Doesn't pretend to handle every CSV-in-the-wild edge case, but covers
// Virgin Money, Barclays, HSBC, Monzo etc. exports.
export function parseCsv(input: string): CsvParseResult {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      // close out the row
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
      // skip the \n in a \r\n pair
      if (ch === "\r" && input[i + 1] === "\n") i++;
    } else {
      field += ch;
    }
  }
  // trailing field with no newline
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== "") rows.push(row);
  }

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map((h) => h.trim());
  const body = rows.slice(1).map((r) => {
    const out = r.slice(0, headers.length);
    while (out.length < headers.length) out.push("");
    return out.map((v) => v.trim());
  });
  return { headers, rows: body };
}

// ----------------------------------------------------------------------------
// Date parsing — supports common UK bank formats
// ----------------------------------------------------------------------------
export type DateFormat = "dmy" | "ymd" | "mdy";

export function parseBankDate(value: string, format: DateFormat): string | null {
  if (!value) return null;
  // Normalise separators to "-"
  const cleaned = value.replace(/[/.]/g, "-").trim();
  const parts = cleaned.split("-");
  if (parts.length !== 3) return null;
  let y: string, m: string, d: string;
  switch (format) {
    case "dmy":
      [d, m, y] = parts;
      break;
    case "ymd":
      [y, m, d] = parts;
      break;
    case "mdy":
      [m, d, y] = parts;
      break;
  }
  // Normalise 2-digit years to 20XX (banks rarely export pre-2000)
  if (y.length === 2) y = `20${y}`;
  if (y.length !== 4) return null;
  if (m.length === 1) m = `0${m}`;
  if (d.length === 1) d = `0${d}`;
  const iso = `${y}-${m}-${d}`;
  // Sanity-check it's a real date
  const probe = new Date(iso);
  if (Number.isNaN(probe.getTime())) return null;
  return iso;
}

// ----------------------------------------------------------------------------
// Amount parsing — turns a raw cell into signed pence
// ----------------------------------------------------------------------------
// Accepts "450.00", "1,250.99", "(450.00)", "-450", "450-", "£450.00", "".
// Returns NaN for blank / unparseable so the caller can branch cleanly.
export function parseBankAmount(raw: string): number {
  if (!raw) return NaN;
  let s = raw.trim();
  let negative = false;
  // Accounting-style parens: (123.45) = -123.45
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  // Trailing minus (some exports)
  if (s.endsWith("-")) {
    negative = true;
    s = s.slice(0, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  }
  // Strip currency symbols + thousands separators
  s = s.replace(/[£$,\s]/g, "");
  if (!s) return NaN;
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100) * (negative ? -1 : 1);
}

// ----------------------------------------------------------------------------
// Shape of a parsed row after column mapping is applied
// ----------------------------------------------------------------------------
export interface MappedCsvRow {
  source_index: number; // original row position
  transaction_date: string; // ISO YYYY-MM-DD
  description: string;
  reference: string | null;
  amount_pence: number; // SIGNED. Positive = inflow, negative = outflow.
  parse_errors: string[]; // any reasons this row can't be imported as-is
}

export interface CsvColumnMapping {
  date_index: number;
  description_index: number;
  // EITHER a single signed amount column…
  amount_index: number | null;
  // …OR separate money-in / money-out columns
  money_in_index: number | null;
  money_out_index: number | null;
  reference_index: number | null;
  date_format: DateFormat;
  // Flip the sign convention if the bank reports the opposite of what we expect.
  flip_sign: boolean;
}

export function mapCsvRows(
  parsed: CsvParseResult,
  mapping: CsvColumnMapping,
): MappedCsvRow[] {
  return parsed.rows.map((row, idx) => {
    const errors: string[] = [];

    const rawDate = row[mapping.date_index] ?? "";
    const transaction_date = parseBankDate(rawDate, mapping.date_format);
    if (!transaction_date) errors.push(`Bad date: "${rawDate}"`);

    const description = (row[mapping.description_index] ?? "").trim();
    if (!description) errors.push("Empty description");

    let amount_pence = 0;
    if (mapping.amount_index != null) {
      const a = parseBankAmount(row[mapping.amount_index] ?? "");
      if (Number.isNaN(a)) errors.push("Bad amount");
      else amount_pence = a;
    } else {
      const inAmt =
        mapping.money_in_index != null
          ? parseBankAmount(row[mapping.money_in_index] ?? "")
          : NaN;
      const outAmt =
        mapping.money_out_index != null
          ? parseBankAmount(row[mapping.money_out_index] ?? "")
          : NaN;
      const hasIn = !Number.isNaN(inAmt) && inAmt !== 0;
      const hasOut = !Number.isNaN(outAmt) && outAmt !== 0;
      if (hasIn && hasOut) errors.push("Both money in + money out populated");
      else if (hasIn) amount_pence = Math.abs(inAmt);
      else if (hasOut) amount_pence = -Math.abs(outAmt);
      else errors.push("No amount");
    }

    if (mapping.flip_sign) amount_pence = -amount_pence;

    const reference =
      mapping.reference_index != null
        ? (row[mapping.reference_index] ?? "").trim() || null
        : null;

    return {
      source_index: idx,
      transaction_date: transaction_date ?? "",
      description,
      reference,
      amount_pence,
      parse_errors: errors,
    };
  });
}

// ----------------------------------------------------------------------------
// Auto-guess column mapping from header names. Used as a starting point —
// the user can always override in the wizard.
// ----------------------------------------------------------------------------
function findHeader(headers: string[], patterns: RegExp[]): number | null {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase();
    if (patterns.some((p) => p.test(h))) return i;
  }
  return null;
}

export function guessMapping(headers: string[]): CsvColumnMapping {
  const date_index = findHeader(headers, [/date/]) ?? 0;
  const description_index =
    findHeader(headers, [/descr/, /narrative/, /detail/, /memo/, /reference/]) ??
    1;
  // Try split debit/credit columns first
  const money_in_index = findHeader(headers, [
    /money in/,
    /^credit$/,
    /^paid in/,
    /^in$/,
  ]);
  const money_out_index = findHeader(headers, [
    /money out/,
    /^debit$/,
    /^paid out/,
    /^out$/,
  ]);
  const amount_index =
    money_in_index == null && money_out_index == null
      ? findHeader(headers, [/^amount$/, /^value$/, /^transaction amount$/])
      : null;
  const reference_index = findHeader(headers, [
    /^reference$/,
    /transaction id/,
    /^ref$/,
  ]);
  return {
    date_index,
    description_index,
    amount_index,
    money_in_index,
    money_out_index,
    reference_index,
    date_format: "dmy",
    flip_sign: false,
  };
}
