function handlePrint() {
  const content = printRef.current;
  if (!content) return;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <html>
      <head>
        <title>DISPATCH — ${activeReport?.title ?? "Report"}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Helvetica, Arial, sans-serif; background: #e8f2f3; color: #0d2d35; font-size: 12px; }
          
          .header { background: #0d4f5c; padding: 28px 36px 24px; margin-bottom: 20px; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
          .header-brand .title { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: 2px; }
          .header-brand .tagline { color: rgba(255,255,255,0.5); font-size: 10px; margin-top: 4px; letter-spacing: 0.5px; }
          .header-meta { text-align: right; }
          .header-meta p { color: rgba(255,255,255,0.5); font-size: 10px; margin-bottom: 2px; }
          .header-divider { border-bottom: 1px solid rgba(255,255,255,0.15); margin-bottom: 12px; }
          .header-report { color: #fff; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
          .header-desc { color: rgba(255,255,255,0.65); font-size: 11px; }

          .body { padding: 0 24px 32px; }

          .summary-row { display: grid; gap: 8px; margin-bottom: 16px; }
          .summary-row-3 { grid-template-columns: repeat(3, 1fr); }
          .summary-row-4 { grid-template-columns: repeat(4, 1fr); }
          .summary-card { background: #fff; border-radius: 10px; padding: 12px 10px; text-align: center; border: 1px solid #ddeef0; }
          .summary-label { font-size: 9px; color: #8fa8ae; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
          .summary-value { font-size: 16px; font-weight: 800; color: #0d2d35; }

          .section-title { font-size: 13px; font-weight: 800; color: #0d2d35; margin: 16px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #f97316; }

          table { width: 100%; border-collapse: collapse; border-radius: 10px; overflow: hidden; border: 1px solid #ddeef0; }
          thead tr { background: #0d4f5c; }
          th { padding: 9px 8px; color: rgba(255,255,255,0.85); font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; text-align: left; }
          td { padding: 8px 8px; font-size: 10px; color: #0d2d35; border-bottom: 1px solid #ddeef0; }
          tr:nth-child(even) td { background: #f4fafa; }
          tr:nth-child(odd) td { background: #fff; }

          .wallet-box { background: #fff; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; border: 1px solid #ddeef0; border-left: 4px solid #0d7a8a; }
          .wallet-title { font-size: 11px; font-weight: 700; color: #0d7a8a; margin-bottom: 10px; }
          .wallet-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 10px; }
          .wallet-label { color: #8fa8ae; }
          .wallet-value { font-weight: 700; color: #0d2d35; }
          .wallet-value-accent { font-weight: 700; color: #0d7a8a; }

          .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #ddeef0; display: flex; justify-content: space-between; font-size: 9px; color: #8fa8ae; }

          .report-actions { display: none !important; }
          .btn { display: none !important; }
          .card { background: #fff; border-radius: 10px; padding: 16px; border: 1px solid #ddeef0; margin-bottom: 16px; }
          .input-wrap, .input-label, select, input[type="date"], input[type="text"] { display: none !important; }

          @media print { body { background: #e8f2f3; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-top">
            <div class="header-brand">
              <div class="title">DISPATCH</div>
              <div class="tagline">Fast, safe, reliable rides across Lesotho</div>
            </div>
            <div class="header-meta">
              <p>Generated: ${new Date().toLocaleString("en-LS")}</p>
            </div>
          </div>
          <div class="header-divider"></div>
          <div class="header-report">${activeReport?.title ?? "Report"}</div>
          <div class="header-desc">${activeReport?.description ?? ""}</div>
        </div>
        <div class="body">
          ${content.innerHTML}
        </div>
        <div class="body">
          <div class="footer">
            <span>DISPATCH — Confidential Report</span>
            <span>${activeReport?.title} · ${new Date().toLocaleDateString("en-LS")}</span>
          </div>
        </div>
      </body>
    </html>
  `);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 400);
}
