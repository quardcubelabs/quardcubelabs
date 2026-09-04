import type { AdminInvoice } from "./invoice-actions"

export function printInvoiceDocument(invoice: AdminInvoice) {
  if (typeof window === "undefined") return

  const printWindow = window.open("", "_blank", "width=850,height=950")
  if (!printWindow) {
    window.print()
    return
  }

  const statusColor = 
    invoice.status === "paid" ? "#16a34a" :
    invoice.status === "sent" ? "#2563eb" :
    invoice.status === "cancelled" ? "#dc2626" : "#f59e0b"

  const statusLabel = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)

  const itemsHtml = (invoice.items || []).map(item => `
    <tr style="border-bottom: 1px solid rgba(0, 0, 128, 0.15); background: transparent;">
      <td style="padding: 12px 12px; font-size: 15px; font-weight: 600; color: rgba(0, 0, 128, 0.9); background: transparent;">${item.name}</td>
      <td style="padding: 12px 12px; font-size: 15px; font-weight: bold; color: rgba(0, 0, 128, 0.9); text-align: right; width: 70px; background: transparent;">${item.quantity}</td>
      <td style="padding: 12px 12px; font-size: 15px; font-weight: bold; color: rgba(0, 0, 128, 0.9); text-align: right; width: 130px; white-space: nowrap; background: transparent;">
        TZS ${Number(item.price).toFixed(2)}
      </td>
      <td style="padding: 12px 12px; font-size: 15px; font-weight: 900; color: #000080; text-align: right; width: 130px; white-space: nowrap; background: transparent;">
        TZS ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
      </td>
    </tr>
  `).join("")

  const formattedDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "N/A"

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title></title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #000080;
            background: #ffffff !important;
            font-size: 15px;
            line-height: 1.45;
            height: auto !important;
            min-height: 0 !important;
          }
          .invoice-container {
            position: relative;
            width: 210mm;
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm 10mm;
            box-sizing: border-box;
            background: #ffffff;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            height: 500px;
            opacity: 0.22;
            z-index: 0;
            pointer-events: none;
          }
          .watermark img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .content-layer {
            position: relative;
            z-index: 10;
            background: transparent !important;
          }
          .content-layer * {
            background-color: transparent !important;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .brand img {
            width: 150px;
            height: 150px;
            object-fit: contain;
            flex-shrink: 0;
          }
          .brand-title {
            font-size: 30px;
            font-weight: 900;
            color: #000080;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 15px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            margin-top: 3px;
          }
          .meta {
            text-align: right;
          }
          .meta-title {
            font-size: 38px;
            font-weight: 900;
            color: #000080;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
          }
          .meta-line {
            font-size: 15px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            margin-top: 2px;
          }
          .meta-line strong {
            font-weight: 700;
            color: #000080;
          }
          hr {
            border: 0;
            border-top: 1px solid rgba(0, 0, 128, 0.3);
            margin-bottom: 24px;
          }
          .addresses {
            display: flex;
            justify-content: space-between;
            margin-bottom: 28px;
          }
          .addr-col {
            width: 48%;
          }
          .addr-col.right {
            text-align: right;
          }
          .addr-title {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000080;
            margin-bottom: 6px;
          }
          .addr-text {
            font-size: 15px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            line-height: 1.45;
          }
          .addr-text.strong {
            font-size: 17px;
            font-weight: 800;
            color: #000080;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
          }
          th {
            border-bottom: 2px solid rgba(0, 0, 128, 0.6);
            background: transparent;
            font-size: 15px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000080;
            padding: 12px 12px;
            text-align: left;
          }
          th.right {
            text-align: right;
          }
          .bottom-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
          }
          .terms-col {
            width: 48%;
          }
          .totals-col {
            width: 48%;
            text-align: right;
          }
          .sec-title {
            font-size: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000080;
            margin-bottom: 6px;
          }
          .terms-list {
            list-style: decimal inside;
            font-size: 15px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            line-height: 1.55;
          }
          .terms-list li {
            margin-bottom: 4px;
          }
          .tot-line {
            display: flex;
            justify-content: space-between;
            font-size: 15px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            margin-bottom: 8px;
          }
          .tot-line strong {
            font-weight: 700;
            color: #000080;
          }
          .tot-line.tax {
            border-bottom: 1px solid rgba(0, 0, 128, 0.25);
            padding-bottom: 8px;
            margin-bottom: 8px;
          }
          .tot-grand {
            display: flex;
            justify-content: space-between;
            font-size: 24px;
            font-weight: 900;
            color: #000080;
            padding-top: 8px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 15px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.7);
          }
          .avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="watermark">
            <img src="/turquoise.png" alt="" />
          </div>

          <div class="content-layer">
            <div class="header">
              <div class="brand">
                <img src="/turquoise.png" alt="QuardCubeLabs Logo" />
                <div>
                  <div class="brand-title">QuardCubeLabs</div>
                  <div class="brand-sub">Your trusted partner in digital solutions</div>
                  <div class="brand-sub">Email: info@quardcubelabs.co.tz</div>
                  <div class="brand-sub">Website: www.quardcubelabs.co.tz</div>
                </div>
              </div>
              <div class="meta">
                <div class="meta-title">INVOICE</div>
                <div class="meta-line">Invoice #<strong>${invoice.invoice_number}</strong></div>
                <div class="meta-line">Date: <strong>${formattedDate}</strong></div>
                <div class="meta-line" style="margin-top: 6px;">
                  Order Status: <span style="font-weight: 800; color: ${statusColor};">${statusLabel}</span>
                </div>
              </div>
            </div>

            <hr />

            <div class="addresses">
              <div class="addr-col">
                <div class="addr-title">From:</div>
                <div class="addr-text strong">QuardCubeLabs</div>
                <div class="addr-text">24 Ferry, Kigamboni</div>
                <div class="addr-text">Dar es Salaam 17101</div>
                <div class="addr-text">Tanzania</div>
                <div class="addr-text" style="margin-top: 2px;">Phone: +255 652 540 496</div>
              </div>
              <div class="addr-col right">
                <div class="addr-title">To:</div>
                <div class="addr-text strong">${invoice.customer_name || "Customer"}</div>
                <div class="addr-text">${invoice.customer_email || ""}</div>
                ${invoice.customer_phone ? `<div class="addr-text">Phone: ${invoice.customer_phone}</div>` : ""}
                <div class="addr-text">${invoice.customer_address || "Tanzania, United Republic of"}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="right" style="width: 70px;">Qty</th>
                  <th class="right" style="width: 130px;">Unit Price</th>
                  <th class="right" style="width: 130px;">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || `<tr><td colspan="4" style="text-align: center; padding: 18px; color: rgba(0,0,128,0.5);">No items found</td></tr>`}
              </tbody>
            </table>

            <div class="bottom-section avoid-break">
              <div class="terms-col">
                <div class="sec-title">Payment Information:</div>
                <div class="addr-text" style="margin-bottom: 14px;">Payment Method: Office Pickup</div>

                <div class="sec-title">Terms & Conditions:</div>
                <ol class="terms-list">
                  <li>Goods are shipped upon confirmation of 100% payment.</li>
                  <li>Terms & conditions shall apply in handling, processing and shipping of the purchased goods.</li>
                  <li>All payments should be made through the designated payment methods of QuardCubeLabs Company Limited.</li>
                </ol>
              </div>

              <div class="totals-col">
                <div class="tot-line">
                  <span>Subtotal:</span>
                  <strong>TZS ${Number(invoice.total).toFixed(2)}</strong>
                </div>
                <div class="tot-line">
                  <span>Shipping Cost:</span>
                  <strong style="color: #16a34a;">TZS 0.00</strong>
                </div>
                <div class="tot-line tax">
                  <span>Tax:</span>
                  <strong>TZS 0.00</strong>
                </div>
                <div class="tot-grand">
                  <span>TOTAL DUE:</span>
                  <span>TZS ${Number(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="footer avoid-break">
              <p>&copy; {new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
              <p style="margin-top: 2px;">Thank you for your business!</p>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
