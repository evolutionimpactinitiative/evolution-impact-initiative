"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, Printer } from "lucide-react";

interface QrShareCardProps {
  link: string;
  qrSrc: string;
  title: string;
  linkLabel?: string;
  posterSubtitle?: string;
  description?: string;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function QrShareCard({
  link,
  qrSrc,
  title,
  linkLabel = "Share this link:",
  posterSubtitle = "Scan to open",
  description = "Print or display this so people can scan and open the page on their phone.",
}: QrShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = qrSrc;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const safeTitle = escapeHtml(title);
    const safeSubtitle = escapeHtml(posterSubtitle);
    const safeLink = escapeHtml(link);
    w.document.write(`<!doctype html>
<html>
<head>
<title>${safeTitle} — QR</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; color: #1E1E1E; }
  h1 { font-size: 32px; margin-bottom: 8px; }
  p { font-size: 18px; margin: 0 0 32px; color: #555; }
  img { width: 480px; max-width: 90vw; height: auto; }
  .link { margin-top: 24px; font-size: 14px; color: #666; word-break: break-all; }
  @media print { .noprint { display: none; } }
</style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeSubtitle}</p>
  <img src="${qrSrc}" alt="QR code" />
  <div class="link">${safeLink}</div>
  <div class="noprint" style="margin-top:32px;">
    <button onclick="window.print()" style="padding:12px 24px;font-size:16px;cursor:pointer;">Print</button>
  </div>
</body>
</html>`);
    w.document.close();
  };

  return (
    <div className="bg-brand-pale/30 rounded-lg p-4 space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">{linkLabel}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white px-3 py-2 rounded border text-sm text-gray-600 truncate">
            {link}
          </code>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-brand-green" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2 border-t border-gray-200">
        <div className="bg-white p-2 rounded border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR code" className="w-40 h-40 block" />
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-gray-700">QR code</p>
          <p className="text-xs text-gray-500">{description}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" />
              Download PNG
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" />
              Print / poster view
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
