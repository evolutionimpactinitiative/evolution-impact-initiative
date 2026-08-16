// Shared print styles for the 4×6" pick label (one per child).
// Sized for a standard thermal label printer (Zebra / Rollo / DYMO 4XL /
// Munbyn 4x6 all use this footprint). Portrait orientation.
//
// Sizes pushed hard — 4×6 is a big surface and the print driver often
// down-scales, so we oversize the source to keep the output readable.

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
    gap: 3mm;
  }
  .pl-eyebrow {
    font-size: 11pt; text-transform: uppercase; letter-spacing: 1.2px;
    color: #17559D; font-weight: 800; margin: 0;
  }
  .pl-child-name {
    font-size: 38pt; font-weight: 900; line-height: 1;
    margin: 1mm 0 1.5mm 0; word-break: break-word;
  }
  .pl-parent {
    font-size: 16pt; color: #222; margin: 0; line-height: 1.15;
  }
  .pl-parent strong { font-weight: 700; }
  .pl-meta {
    font-size: 14pt; color: #333; margin: 1.5mm 0 0 0; font-weight: 600;
  }
  .pl-meta strong { font-weight: 700; color: #111; }

  .pl-section-label {
    font-size: 12pt; text-transform: uppercase; letter-spacing: 1.8px;
    font-weight: 800; color: #17559D; margin: 1mm 0 1.5mm 0;
    border-top: 0.8mm solid #111; padding-top: 2mm;
  }

  .pl-items { list-style: none; padding: 0; margin: 0; }
  .pl-item {
    display: flex; align-items: baseline; gap: 2.5mm;
    font-size: 16pt; padding: 1.5mm 0;
    border-bottom: 0.25mm dotted #bbb;
    line-height: 1.15;
  }
  .pl-item-check { font-size: 22pt; line-height: 1; }
  .pl-item-label { flex: 1; font-weight: 600; }
  .pl-item-given {
    display: inline-flex; gap: 2mm; font-size: 12pt; color: #444;
    align-items: baseline;
  }
  .pl-item-given-label { flex-shrink: 0; font-weight: 700; }
  .pl-blank {
    display: inline-block; border-bottom: 0.4mm solid #555;
    height: 5mm; min-width: 30mm;
  }

  .pl-school {
    font-size: 12pt; color: #333; font-style: italic;
    margin: 2mm 0 0 0;
  }
  .pl-note {
    font-size: 12pt; background: #FEF3C7; padding: 2.5mm;
    border-radius: 2mm; margin: 2mm 0 0 0; line-height: 1.3;
  }
  .pl-note strong { font-weight: 700; }

  .pl-bottom {
    display: flex; gap: 4mm; align-items: center;
    border-top: 0.8mm solid #111; padding-top: 2.5mm; margin-top: auto;
  }
  .pl-qr-wrap { flex-shrink: 0; }
  .pl-qr { width: 45mm; height: 45mm; display: block; }
  .pl-qr-placeholder {
    width: 45mm; height: 45mm; border: 0.3mm dashed #999;
    display: flex; align-items: center; justify-content: center;
    font-size: 9pt; color: #999; text-align: center; padding: 2mm;
  }

  .pl-outcome {
    flex: 1; display: flex; flex-direction: column; gap: 2mm;
  }
  .pl-outcome-label {
    font-size: 11pt; text-transform: uppercase; letter-spacing: 1.5px;
    font-weight: 800; margin: 0;
  }
  .pl-outcome-check { font-size: 15pt; line-height: 1.2; font-weight: 500; }

  .pl-footer {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 12pt; color: #333; margin-top: 2mm; font-weight: 500;
  }
  .pl-ref {
    font-family: 'Courier New', monospace; font-weight: 700;
    letter-spacing: 0.5px; font-size: 13pt;
  }
  .pl-status {
    text-transform: uppercase; letter-spacing: 1.2px; font-weight: 800;
    font-size: 13pt;
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
