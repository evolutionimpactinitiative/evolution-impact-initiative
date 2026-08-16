// Shared print styles for the 4×6" pick label (one per child).
// Sized for a standard thermal label printer (Zebra / Rollo / DYMO 4XL /
// Munbyn 4x6 all use this footprint). Portrait orientation.

export const PICK_LABEL_PRINT_STYLES = `
  .pick-label {
    box-sizing: border-box;
    width: 101.6mm;                /* 4" */
    height: 152.4mm;               /* 6" */
    padding: 6mm 6mm;
    margin: 0 auto 6mm auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #111;
    background: white;
    border: 1px solid #ddd;        /* only visible in screen preview */
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 3mm;
  }
  .pl-eyebrow {
    font-size: 8pt; text-transform: uppercase; letter-spacing: 1.2px;
    color: #17559D; font-weight: 800; margin: 0;
  }
  .pl-child-name {
    font-size: 26pt; font-weight: 900; line-height: 1.05; margin: 0;
    word-break: break-word;
  }
  .pl-parent {
    font-size: 11pt; color: #333; margin: 0;
  }
  .pl-parent strong { font-weight: 700; }
  .pl-qr-wrap {
    display: flex; justify-content: center; align-items: center; flex: 1;
    padding: 2mm 0;
  }
  .pl-qr {
    width: 60mm; height: 60mm; display: block;
  }
  .pl-qr-placeholder {
    width: 60mm; height: 60mm; border: 1px dashed #999;
    display: flex; align-items: center; justify-content: center;
    font-size: 9pt; color: #999; text-align: center; padding: 2mm;
  }
  .pl-footer {
    display: flex; justify-content: space-between; align-items: flex-end;
    font-size: 8pt; color: #555; border-top: 1px solid #333;
    padding-top: 2mm; gap: 3mm;
  }
  .pl-ref {
    font-family: 'Courier New', monospace; font-weight: 700;
    letter-spacing: 0.5px;
  }
  .pl-status {
    text-transform: uppercase; letter-spacing: 1px; font-weight: 800;
  }
`;

// @media print rules for a 4×6 label printer. Isolates one label per
// sheet — printer driver handles the physical feed.
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
