// Unit test for the CSV parser in lib/accounting/csv.ts.
// Run with:  npx tsx scripts/test-csv-parser.ts

import {
  parseCsv,
  parseBankDate,
  parseBankAmount,
  guessMapping,
  mapCsvRows,
} from "../lib/accounting/csv";

let failed = 0;
function expect(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`  ${ok ? "✓" : "✗"} ${label}`);
  if (!ok) {
    console.log(`     got:  ${JSON.stringify(got)}`);
    console.log(`     want: ${JSON.stringify(want)}`);
    failed++;
  }
}

console.log("\n[parseCsv] basics");
{
  const r = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
  expect("headers", r.headers, ["a", "b", "c"]);
  expect("rows", r.rows, [
    ["1", "2", "3"],
    ["4", "5", "6"],
  ]);
}

console.log("\n[parseCsv] quoted fields with commas + escaped quotes");
{
  const r = parseCsv('a,b\n"hello, world","she said ""hi"""\n');
  expect("quoted comma", r.rows[0][0], "hello, world");
  expect("escaped quote", r.rows[0][1], 'she said "hi"');
}

console.log("\n[parseCsv] CRLF line endings + trailing newline");
{
  const r = parseCsv("a,b\r\n1,2\r\n3,4\r\n");
  expect("rows", r.rows, [
    ["1", "2"],
    ["3", "4"],
  ]);
}

console.log("\n[parseBankDate]");
expect("dmy 25/07/2026", parseBankDate("25/07/2026", "dmy"), "2026-07-25");
expect("dmy 25.07.2026", parseBankDate("25.07.2026", "dmy"), "2026-07-25");
expect("dmy 1/7/26", parseBankDate("1/7/26", "dmy"), "2026-07-01");
expect("ymd 2026-07-25", parseBankDate("2026-07-25", "ymd"), "2026-07-25");
expect("mdy 07/25/2026", parseBankDate("07/25/2026", "mdy"), "2026-07-25");
expect("garbage", parseBankDate("not a date", "dmy"), null);
expect("empty", parseBankDate("", "dmy"), null);

console.log("\n[parseBankAmount]");
expect("plain", parseBankAmount("450.00"), 45000);
expect("comma thousands", parseBankAmount("1,250.99"), 125099);
expect("negative", parseBankAmount("-450"), -45000);
expect("parens", parseBankAmount("(450.00)"), -45000);
expect("trailing minus", parseBankAmount("450-"), -45000);
expect("currency symbol", parseBankAmount("£450"), 45000);
expect("blank", Number.isNaN(parseBankAmount("")), true);
expect("garbage", Number.isNaN(parseBankAmount("xyz")), true);

console.log("\n[guessMapping] Virgin Money-shaped");
{
  const m = guessMapping([
    "Date",
    "Description",
    "Money In",
    "Money Out",
    "Balance",
  ]);
  expect("date_index=0", m.date_index, 0);
  expect("description_index=1", m.description_index, 1);
  expect("money_in_index=2", m.money_in_index, 2);
  expect("money_out_index=3", m.money_out_index, 3);
  expect("amount_index=null (split cols)", m.amount_index, null);
}

console.log("\n[guessMapping] Monzo-shaped");
{
  const m = guessMapping(["Date", "Description", "Amount", "Reference"]);
  expect("amount_index=2", m.amount_index, 2);
  expect("money_in_index=null", m.money_in_index, null);
  expect("reference_index=3", m.reference_index, 3);
}

console.log("\n[mapCsvRows] full pipeline — Virgin Money shape");
{
  const csv =
    "Date,Description,Money In,Money Out,Balance\n" +
    "25/07/2026,STRIPE DONATION,450.00,,1450.00\n" +
    "26/07/2026,FACILITATOR FEE - SARAH,,450.00,1000.00\n" +
    '23/07/2026,"COMPLEX, DESCRIPTION",100.00,,1000.00\n';
  const p = parseCsv(csv);
  const m = guessMapping(p.headers);
  const mapped = mapCsvRows(p, m);
  expect("3 rows mapped", mapped.length, 3);
  expect("row 0 date", mapped[0].transaction_date, "2026-07-25");
  expect("row 0 amount (inflow +450)", mapped[0].amount_pence, 45000);
  expect("row 0 errors", mapped[0].parse_errors, []);
  expect("row 1 amount (outflow -450)", mapped[1].amount_pence, -45000);
  expect("row 2 desc (quoted comma)", mapped[2].description, "COMPLEX, DESCRIPTION");
}

console.log("\n[mapCsvRows] full pipeline — Monzo single-column shape");
{
  const csv =
    "Date,Description,Amount,Reference\n" +
    "2026-07-25,Pay,450.00,REF-001\n" +
    "2026-07-26,Outflow,-200.00,REF-002\n";
  const p = parseCsv(csv);
  const m = { ...guessMapping(p.headers), date_format: "ymd" as const };
  const mapped = mapCsvRows(p, m);
  expect("row 0 amount", mapped[0].amount_pence, 45000);
  expect("row 1 amount (signed negative)", mapped[1].amount_pence, -20000);
  expect("row 0 reference", mapped[0].reference, "REF-001");
}

console.log("\n[mapCsvRows] flip_sign");
{
  const csv = "Date,Description,Amount\n2026-07-25,Test,450.00\n";
  const p = parseCsv(csv);
  const m = { ...guessMapping(p.headers), date_format: "ymd" as const, flip_sign: true };
  const mapped = mapCsvRows(p, m);
  expect("amount flipped", mapped[0].amount_pence, -45000);
}

console.log("\n[mapCsvRows] error rows");
{
  const csv =
    "Date,Description,Money In,Money Out\n" +
    "not-a-date,X,100,\n" +
    "25/07/2026,,100,\n" +
    "25/07/2026,Both,100,50\n";
  const p = parseCsv(csv);
  const m = guessMapping(p.headers);
  const mapped = mapCsvRows(p, m);
  expect("bad date flagged", mapped[0].parse_errors.length > 0, true);
  expect("empty desc flagged", mapped[1].parse_errors.includes("Empty description"), true);
  expect("both columns flagged", mapped[2].parse_errors.length > 0, true);
}

console.log(`\n${failed === 0 ? "All tests passed." : `${failed} test(s) FAILED.`}\n`);
process.exit(failed === 0 ? 0 : 1);
