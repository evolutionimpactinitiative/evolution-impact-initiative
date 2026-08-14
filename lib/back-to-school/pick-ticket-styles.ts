// Shared print styles for the A5 pick ticket. Used by the bulk-print admin
// page and the on-demand single-ticket print route.

export const PICK_TICKET_PRINT_STYLES = `
  .pick-ticket {
    box-sizing: border-box;
    width: 148mm;
    min-height: 210mm;
    padding: 8mm 10mm;
    margin: 0 auto 8mm auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #111;
    background: white;
    border: 1px solid #ddd;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    gap: 4mm;
  }
  .pt-header {
    display: flex;
    gap: 4mm;
    align-items: flex-start;
    border-bottom: 1px solid #333;
    padding-bottom: 3mm;
  }
  .pt-title-block { flex: 1; min-width: 0; }
  .pt-eyebrow {
    font-size: 8pt; text-transform: uppercase; letter-spacing: 1px;
    color: #17559D; font-weight: 700; margin: 0 0 2px 0;
  }
  .pt-family-name {
    font-size: 20pt; font-weight: 900; line-height: 1.1; margin: 0 0 2mm 0;
    word-break: break-word;
  }
  .pt-meta { font-size: 9pt; color: #444; margin: 0; }
  .pt-qr-block { text-align: center; width: 32mm; flex-shrink: 0; }
  .pt-qr { width: 30mm; height: 30mm; display: block; }
  .pt-qr-placeholder {
    width: 30mm; height: 30mm; border: 1px dashed #999;
    display: flex; align-items: center; justify-content: center;
    font-size: 7pt; color: #999;
  }
  .pt-ref {
    font-family: 'Courier New', monospace; font-size: 9pt; font-weight: 700;
    margin: 1mm 0 0 0; letter-spacing: 0.5px;
  }
  .pt-status {
    font-size: 8pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 1px; margin: 1mm 0 0 0;
  }
  .pt-kids { display: flex; flex-direction: column; gap: 4mm; flex: 1; }
  .pt-child {
    border: 1px solid #ccc; border-radius: 3mm; padding: 3mm;
    page-break-inside: avoid;
  }
  .pt-child-head {
    display: flex; flex-wrap: wrap; gap: 2mm; align-items: baseline;
    margin-bottom: 2mm;
  }
  .pt-child-num {
    font-size: 7pt; text-transform: uppercase; letter-spacing: 1px;
    background: #17559D; color: white; padding: 1mm 2mm; border-radius: 2mm;
    font-weight: 700;
  }
  .pt-child-name { font-size: 12pt; font-weight: 800; }
  .pt-child-meta { font-size: 8pt; color: #666; }
  .pt-child-size {
    font-size: 10pt; margin-left: auto; padding: 1mm 2mm;
    background: #DCECFF; border-radius: 2mm;
  }
  .pt-child-size strong { font-size: 14pt; }
  .pt-school { font-size: 8pt; color: #444; margin: 0 0 2mm 0; font-style: italic; }
  .pt-items { list-style: none; padding: 0; margin: 0; }
  .pt-item {
    display: flex; align-items: baseline; gap: 2mm;
    font-size: 10pt; padding: 1.5mm 0; border-bottom: 1px dotted #ddd;
  }
  .pt-item-check { font-size: 14pt; line-height: 1; }
  .pt-item-label { flex: 1; }
  .pt-item-given { display: inline-flex; gap: 1mm; font-size: 8pt; color: #666; }
  .pt-item-given-label { flex-shrink: 0; }
  .pt-blank-line {
    display: inline-block; border-bottom: 1px solid #666; height: 4mm;
    min-width: 30mm;
  }
  .pt-inline-blank { min-width: 22mm; }
  .pt-child-notes {
    font-size: 8pt; background: #FEF3C7; padding: 2mm;
    border-radius: 2mm; margin: 2mm 0 0 0;
  }
  .pt-footer {
    border-top: 1px solid #333; padding-top: 3mm;
    display: flex; flex-direction: column; gap: 2mm;
  }
  .pt-outcome, .pt-notes {
    display: flex; flex-wrap: wrap; gap: 3mm; align-items: baseline;
    font-size: 9pt;
  }
  .pt-label { font-weight: 700; text-transform: uppercase; font-size: 8pt; }
  .pt-checkbox { font-size: 10pt; }
  .pt-notes { flex: 1; }
  .pt-notes .pt-blank-line { flex: 1; min-width: 60mm; }
  .pt-venue {
    font-size: 8pt; color: #666; text-align: center; margin: 2mm 0 0 0;
  }
`;

// Wraps @media print rules that hide admin chrome and force A5 landscape.
// Takes a print-area element id — everything else on the page is hidden.
export function pickTicketPrintMediaRules(printAreaId: string): string {
  return `
    @media print {
      @page { size: A5 portrait; margin: 4mm; }
      body * { visibility: hidden !important; }
      #${printAreaId}, #${printAreaId} * { visibility: visible !important; }
      #${printAreaId} {
        position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0;
      }
      .pick-ticket { border: none; margin: 0; page-break-after: always; }
      html, body { background: white !important; }
    }
  `;
}
