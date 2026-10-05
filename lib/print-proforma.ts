import type { AdminProformaInvoice } from "./proforma-actions"
import QRCode from "qrcode"

export async function printProformaDocument(proforma: AdminProformaInvoice) {
  if (typeof window === "undefined") return

  // Generate QR Code pointing to public verification token URL
  let verificationUrl = proforma.verification_url || `https://quardcubelabs.co.tz/verify/${proforma.verification_token || proforma.proforma_number}`
  if (verificationUrl.includes("quardcube.vercel.app")) {
    verificationUrl = verificationUrl.replace(/https?:\/\/quardcube\.vercel\.app/g, "https://quardcubelabs.co.tz")
  }
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
    console.warn("Error generating proforma print QR code:", err)
  }

  const printWindow = window.open("", "_blank", "width=850,height=950")
  if (!printWindow) {
    window.print()
    return
  }

  const statusColor = 
    proforma.status === "converted" ? "#16a34a" :
    proforma.status === "accepted" ? "#0d9488" :
    proforma.status === "sent" ? "#2563eb" :
    proforma.status === "expired" ? "#dc2626" : "#f59e0b"

  const statusLabel = proforma.status.charAt(0).toUpperCase() + proforma.status.slice(1)

  const itemsHtml = (proforma.items || []).map(item => `
    <tr style="border-bottom: 1px solid rgba(0, 0, 128, 0.15); background: transparent;">
      <td style="padding: 12px 12px; font-size: 18px; font-weight: 600; color: rgba(0, 0, 128, 0.9); background: transparent;">
        ${item.name}
        ${item.description ? `<div style="font-size: 14px; font-weight: 500; color: rgba(0,0,128,0.65); margin-top: 2px;">${item.description}</div>` : ""}
      </td>
      <td style="padding: 12px 12px; font-size: 18px; font-weight: bold; color: rgba(0, 0, 128, 0.9); text-align: right; width: 70px; background: transparent;">${item.quantity}</td>
      <td style="padding: 12px 12px; font-size: 18px; font-weight: bold; color: rgba(0, 0, 128, 0.9); text-align: right; width: 130px; white-space: nowrap; background: transparent;">
        TZS ${Number(item.price).toFixed(2)}
      </td>
      <td style="padding: 12px 12px; font-size: 18px; font-weight: 900; color: #000080; text-align: right; width: 130px; white-space: nowrap; background: transparent;">
        TZS ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
      </td>
    </tr>
  `).join("")

  const formattedDate = proforma.created_at ? new Date(proforma.created_at).toLocaleDateString() : "N/A"
  const formattedValidUntil = proforma.valid_until ? new Date(proforma.valid_until).toLocaleDateString() : "30 Days from Issue"
  const subtotal = proforma.subtotal || proforma.total
  const discount = proforma.discount || 0
  const taxAmount = proforma.tax_amount || 0

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Proforma Invoice - ${proforma.proforma_number}</title>
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
            font-size: 36px;
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
          .qr-img {
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
                <div class="meta-title">PROFORMA INVOICE</div>
                <div class="meta-line">Proforma #<strong>${proforma.proforma_number}</strong></div>
                <div class="meta-line">Date: <strong>${formattedDate}</strong></div>
                <div class="meta-line">Valid Until: <strong>${formattedValidUntil}</strong></div>
                <div class="meta-line" style="margin-top: 6px;">
                  Status: <span style="font-weight: 800; color: ${statusColor};">${statusLabel}</span>
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
                <div class="addr-title">To / Client:</div>
                <div class="addr-text strong">${proforma.customer_name || "Valued Client"}</div>
                <div class="addr-text">${proforma.customer_email || ""}</div>
                ${proforma.customer_phone ? `<div class="addr-text">Phone: ${proforma.customer_phone}</div>` : ""}
                <div class="addr-text">${proforma.customer_address || "Tanzania, United Republic of"}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
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
                <div class="addr-text" style="margin-bottom: 14px;">
                  Payment Terms: ${proforma.payment_terms || "Bank Transfer / Mobile Money / Office Settlement"}
                </div>

                <div class="sec-title">Terms & Conditions:</div>
                <ol class="terms-list">
                  <li>This is an official Proforma Invoice quotation and estimate.</li>
                  <li>Official tax invoice and goods dispatch occur upon payment confirmation.</li>
                  <li>Scan the QR code to verify document authenticity online in real-time.</li>
                  ${proforma.notes ? `<li><strong>Instructions:</strong> ${proforma.notes}</li>` : ""}
                </ol>
              </div>

              <div class="totals-col">
                <div class="tot-line">
                  <span>Subtotal:</span>
                  <strong>TZS ${Number(subtotal).toFixed(2)}</strong>
                </div>
                ${discount > 0 ? `
                  <div class="tot-line">
                    <span>Discount:</span>
                    <strong style="color: #16a34a;">-TZS ${Number(discount).toFixed(2)}</strong>
                  </div>
                ` : ""}
                <div class="tot-line tax">
                  <span>Tax / VAT (${proforma.tax_rate || 0}%):</span>
                  <strong>TZS ${Number(taxAmount).toFixed(2)}</strong>
                </div>
                <div class="tot-grand">
                  <span>TOTAL DUE:</span>
                  <span>TZS ${Number(proforma.total).toFixed(2)}</span>
                </div>

                ${qrDataUrl ? `
                  <div class="qr-box">
                    <div class="qr-wrap">
                      <img class="qr-img" src="${qrDataUrl}" alt="Document Verification QR" />
                      <div class="qr-center-logo">
                        <img src="/turquoise.png" alt="QuardCube" />
                      </div>
                    </div>
                    <div class="qr-caption">SCAN TO VERIFY PROFORMA</div>
                    ${proforma.verification_token ? `<div class="qr-token">ID: ${proforma.verification_token.slice(0, 12)}...</div>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="footer avoid-break">
              <p>&copy; ${new Date().getFullYear()} QuardCubeLabs. All rights reserved.</p>
              <p style="margin-top: 2px;">Thank you for your business inquiries!</p>
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
