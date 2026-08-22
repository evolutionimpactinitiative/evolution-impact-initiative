// Shared print styles for the 4×6" pick label (one per child).
// Sized for a standard thermal label printer (Zebra / Rollo / DYMO 4XL /
// Munbyn 4x6 all use this footprint). Portrait orientation.
//
// Sizing tuned to fit the worst-case content:
//   4 pick items + school line + parent note + QR + outcome + footer.
// If a label ever overflows, `overflow: hidden` clips instead of letting
// blocks pile on top of one another.

export const PICK_LABEL_PRINT_STYLES = `
  .pick-label {
    box-sizing: border-box;
    width: 101.6mm;                /* 4" */
    height: 152.4mm;               /* 6" */
    padding: 3mm 4mm;
    margin: 0 auto 6mm auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #111;
    background: white;
    border: 1px solid #ddd;        /* screen preview only */
    page-break-after: always;
    display: flex;
    flex-direction: column;
    gap: 2mm;
    overflow: hidden;
  }
  .pl-eyebrow {
    font-size: 8pt; text-transform: uppercase; letter-spacing: 1.2px;
    color: #17559D; font-weight: 800; margin: 0;
  }
  .pl-child-name {
    font-size: 22pt; font-weight: 900; line-height: 1.05;
    margin: 1mm 0 0.5mm 0; word-break: break-word;
  }
  .pl-parent {
    font-size: 11pt; color: #222; margin: 0; line-height: 1.2;
  }
  .pl-parent strong { font-weight: 700; }
  .pl-meta {
    font-size: 10pt; color: #333; margin: 0.5mm 0 0 0; font-weight: 600;
  }
  .pl-meta strong { font-weight: 700; color: #111; }

  .pl-section-label {
    font-size: 9pt; text-transform: uppercase; letter-spacing: 1.4px;
    font-weight: 800; color: #17559D; margin: 1mm 0 1mm 0;
    border-top: 0.6mm solid #111; padding-top: 1.5mm;
  }

  .pl-items { list-style: none; padding: 0; margin: 0; }
  .pl-item {
    display: flex; align-items: baseline; gap: 2mm;
    font-size: 11pt; padding: 0.8mm 0;
    border-bottom: 0.2mm dotted #bbb;
    line-height: 1.15;
  }
  .pl-item-check { font-size: 14pt; line-height: 1; }
  .pl-item-label { flex: 1; font-weight: 600; }
  .pl-item-given {
    display: inline-flex; gap: 1.5mm; font-size: 8pt; color: #444;
    align-items: baseline;
  }
  .pl-item-given-label { flex-shrink: 0; font-weight: 700; }
  .pl-blank {
    display: inline-block; border-bottom: 0.3mm solid #555;
    height: 3.5mm; min-width: 22mm;
  }

  .pl-school {
    font-size: 8.5pt; color: #333; font-style: italic;
    margin: 1mm 0 0 0;
  }
  .pl-note {
    font-size: 8.5pt; background: #FEF3C7; padding: 1.5mm;
    border-radius: 1.5mm; margin: 1mm 0 0 0; line-height: 1.25;
  }
  .pl-note strong { font-weight: 700; }

  .pl-bottom {
    display: flex; gap: 3mm; align-items: center;
    border-top: 0.6mm solid #111; padding-top: 1.5mm;
  }
  .pl-qr-wrap { flex-shrink: 0; }
  .pl-qr { width: 34mm; height: 34mm; display: block; }
  .pl-qr-placeholder {
    width: 34mm; height: 34mm; border: 0.3mm dashed #999;
    display: flex; align-items: center; justify-content: center;
    font-size: 7pt; color: #999; text-align: center; padding: 1.5mm;
  }

  .pl-outcome {
    flex: 1; display: flex; flex-direction: column; gap: 1mm;
  }
  .pl-outcome-label {
    font-size: 8pt; text-transform: uppercase; letter-spacing: 1.4px;
    font-weight: 800; margin: 0;
  }
  .pl-outcome-check { font-size: 10pt; line-height: 1.2; font-weight: 500; }

  .pl-footer {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 8pt; color: #333; margin-top: 1mm; font-weight: 500;
    border-top: 0.3mm solid #ddd; padding-top: 1mm;
  }
  .pl-ref {
    font-family: 'Courier New', monospace; font-weight: 700;
    letter-spacing: 0.5px; font-size: 9pt;
  }
  .pl-status {
    text-transform: uppercase; letter-spacing: 1.2px; font-weight: 800;
    font-size: 9pt;
  }
`;

// @media print rules for a 4×6 label printer. One label per feed —
// driver handles physical advance. Sets @page size so the browser
// doesn't downscale to a default A4/Letter page.
export function pickLabelPrintMediaRules(printAreaId: string): string {
  return `
    @media print {
      @page { size: 101.6mm 152.4mm; margin: 0; }
      body * { visibility: hidden !important; }
      #${printAreaId}, #${printAreaId} * { visibility: visible !important; }
      #${printAreaId} {
        position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0;
      }
      .pick-label { border: none; margin: 0; page-break-after: always; }
      html, body { background: white !important; }
    }
  `;
}
