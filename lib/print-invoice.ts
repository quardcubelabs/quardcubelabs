import type { AdminInvoice } from "./invoice-actions"
import { notifyAdminInvoicePrintedAction } from "./email-service"
import QRCode from "qrcode"

export async function printInvoiceDocument(invoice: AdminInvoice) {
  if (typeof window === "undefined") return

  // Notify admin when invoice document is printed
  try {
    notifyAdminInvoicePrintedAction({
      invoiceNumber: invoice.invoice_number,
      orderId: invoice.id,
      customerName: invoice.customer_name,
      customerEmail: invoice.customer_email,
      customerPhone: invoice.customer_phone || undefined,
      total: Number(invoice.total),
      items: (invoice.items || []).map(i => ({ name: i.name, quantity: i.quantity, price: Number(i.price) })),
      source: "Admin Invoices Document Print",
    }).catch(err => console.error("Error sending admin invoice print notification:", err))
  } catch (err) {
    console.error("Error in printInvoiceDocument notification:", err)
  }

  // Generate QR Code pointing to public verification token URL
  const verificationUrl = invoice.verification_url || `https://quardcubelabs.co.tz/verify/${invoice.verification_token || invoice.invoice_number}`
  let qrDataUrl = ""
  try {
    qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 280,
      color: {
        dark: "#000080",
        light: "#ffffff"
      }
    })
  } catch (err) {
    console.warn("Error generating invoice print QR code:", err)
  }

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
      <td style="padding: 12px 12px; font-size: 18px; font-weight: 600; color: rgba(0, 0, 128, 0.9); background: transparent;">${item.name}</td>
      <td style="padding: 12px 12px; font-size: 18px; font-weight: bold; color: rgba(0, 0, 128, 0.9); text-align: right; width: 70px; background: transparent;">${item.quantity}</td>
      <td style="padding: 12px 12px; font-size: 18px; font-weight: bold; color: rgba(0, 0, 128, 0.9); text-align: right; width: 130px; white-space: nowrap; background: transparent;">
        TZS ${Number(item.price).toFixed(2)}
      </td>
      <td style="padding: 12px 12px; font-size: 18px; font-weight: 900; color: #000080; text-align: right; width: 130px; white-space: nowrap; background: transparent;">
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
        <title>Invoice - ${invoice.invoice_number}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 16mm 14mm 14mm 14mm;
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
            font-size: 18px;
            line-height: 1.45;
            height: auto !important;
            min-height: 0 !important;
          }
          .invoice-container {
            position: relative;
            width: 100%;
            max-width: 100%;
            min-height: calc(297mm - 30mm);
            margin: 0 auto;
            padding: 0;
            box-sizing: border-box;
            background: transparent;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .watermark {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 0;
          }
          .watermark img {
            width: 350px;
            height: 350px;
            object-fit: contain;
            opacity: 0.18;
          }
          .content-layer {
            position: relative;
            z-index: 1;
            background: transparent;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
          }
          .brand-title {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #000080;
            line-height: 1.1;
          }
          .brand-sub {
            font-size: 18px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            margin-top: 3px;
          }
          .meta {
            text-align: right;
          }
          .meta-title {
            font-size: 40px;
            font-weight: 900;
            color: #000080;
            letter-spacing: -0.5px;
            line-height: 1;
            margin-bottom: 6px;
          }
          .meta-line {
            font-size: 18px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            margin-top: 2px;
          }
          .meta-line strong {
            font-weight: 800;
            color: #000080;
          }
          hr {
            border: none;
            border-top: 2px solid rgba(0, 0, 128, 0.6);
            margin: 20px 0 24px 0;
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
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000080;
            margin-bottom: 6px;
          }
          .addr-text {
            font-size: 18px;
            font-weight: 500;
            color: rgba(0, 0, 128, 0.85);
            line-height: 1.45;
          }
          .addr-text.strong {
            font-size: 18px;
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
            font-size: 18px;
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
            padding-top: 16px;
            border-top: 1px solid rgba(0, 0, 128, 0.15);
          }
          .terms-col {
            width: 48%;
          }
          .totals-col {
            width: 48%;
            text-align: right;
          }
          .sec-title {
            font-size: 18px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #000080;
            margin-bottom: 8px;
          }
          .terms-list {
            list-style: decimal inside;
            font-size: 18px;
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
            font-size: 18px;
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
          .qr-box {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            margin-top: 20px;
          }
          .qr-wrap {
            position: relative;
            display: inline-block;
            width: 120px;
            height: 120px;
          }
          .qr-wrap img.qr-img {
            width: 120px;
            height: 120px;
            border: 2px solid rgba(0, 0, 128, 0.2);
            border-radius: 12px;
            padding: 4px;
            background: #ffffff;
            display: block;
          }
          .qr-center-logo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 28px;
            height: 28px;
            background: #ffffff;
            border-radius: 50%;
            padding: 2px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
          }
          .qr-center-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border-radius: 50%;
          }
          .qr-caption {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #000080;
            text-transform: uppercase;
            margin-top: 4px;
            text-align: right;
          }
          .qr-token {
            font-size: 10px;
            font-family: monospace;
            color: rgba(0, 0, 128, 0.6);
            margin-top: 1px;
            text-align: right;
          }
          .footer {
            margin-top: auto;
            padding-top: 32px;
            text-align: center;
            font-size: 18px;
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

                ${qrDataUrl ? `
                  <div class="qr-box">
                    <div class="qr-wrap">
                      <img class="qr-img" src="${qrDataUrl}" alt="Document Verification QR" />
                      <div class="qr-center-logo">
                        <img src="/turquoise.png" alt="QuardCube" />
                      </div>
                    </div>
                    <div class="qr-caption">SCAN TO VERIFY DOCUMENT</div>
                    ${invoice.verification_token ? `<div class="qr-token">ID: ${invoice.verification_token.slice(0, 12)}...</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="footer avoid-break">
              <p>&copy; ${new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
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
