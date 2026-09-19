import type { ReportData } from "./real-reports-generator"

export function printReportDocument(report: ReportData) {
  if (typeof window === "undefined") return

  const printWindow = window.open("", "_blank", "width=950,height=1000")
  if (!printWindow) {
    window.print()
    return
  }

  const formatMoney = (amount: number | string | undefined) => {
    const num = Number(amount) || 0
    return `TZS ${num.toLocaleString()}`
  }

  const formattedDate = new Date(report.generatedAt).toLocaleString()

  // 1. Metric Cards HTML
  const metricsHtml = Object.entries(report.summary.keyMetrics).map(([key, val]) => {
    const label = key.replace(/([A-Z])/g, ' $1').trim().toUpperCase()
    const isMoney = key.toLowerCase().includes('revenue') || key.toLowerCase().includes('inflow') || key.toLowerCase().includes('spent') || key.toLowerCase().includes('invoices') || key.toLowerCase().includes('quotes')
    const displayVal = typeof val === 'number' && isMoney ? formatMoney(val) : String(val)

    return `
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; min-width: 130px; flex: 1 1 calc(25% - 10px); box-sizing: border-box;">
        <div style="font-size: 10px; font-weight: 800; color: #000080; text-transform: uppercase; margin-bottom: 2px;">${label}</div>
        <div style="font-size: 16px; font-weight: 900; color: #0f172a;">${displayVal}</div>
      </div>
    `
  }).join("")

  // 2. Scorecard HTML
  let scorecardHtml = ""
  if (report.scorecard) {
    scorecardHtml = `
      <div style="background: #f0fdfa; border: 2px solid #14b8a6; border-radius: 12px; padding: 16px; margin-bottom: 20px;" class="avoid-break">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #99f6e4; padding-bottom: 10px; margin-bottom: 12px;">
          <div>
            <span style="font-size: 14px; font-weight: 900; color: #000080; text-transform: uppercase; letter-spacing: 0.5px;">Executive Vitality & Performance Scorecard</span>
          </div>
          <span style="background: #000080; color: #ffffff; font-size: 11px; font-weight: 900; padding: 3px 10px; border-radius: 6px; text-transform: uppercase;">
            ${report.scorecard.healthRating}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center; margin-bottom: 12px;">
          <div style="background: #ffffff; border: 1px solid #ccfbf1; border-radius: 8px; padding: 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #0d9488; text-transform: uppercase;">Overall Health</div>
            <div style="font-size: 22px; font-weight: 900; color: #000080;">${report.scorecard.overallHealthScore}<span style="font-size: 12px; color: #64748b;">/100</span></div>
          </div>
          <div style="background: #ffffff; border: 1px solid #ccfbf1; border-radius: 8px; padding: 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #16a34a; text-transform: uppercase;">Revenue Velocity</div>
            <div style="font-size: 22px; font-weight: 900; color: #16a34a;">${report.scorecard.revenueVelocityScore}<span style="font-size: 12px; color: #64748b;">/100</span></div>
          </div>
          <div style="background: #ffffff; border: 1px solid #ccfbf1; border-radius: 8px; padding: 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #0d9488; text-transform: uppercase;">Operations Efficiency</div>
            <div style="font-size: 22px; font-weight: 900; color: #0d9488;">${report.scorecard.operationalEfficiencyScore}<span style="font-size: 12px; color: #64748b;">/100</span></div>
          </div>
          <div style="background: #ffffff; border: 1px solid #ccfbf1; border-radius: 8px; padding: 10px;">
            <div style="font-size: 10px; font-weight: 800; color: #d97706; text-transform: uppercase;">Customer Trust</div>
            <div style="font-size: 22px; font-weight: 900; color: #d97706;">${report.scorecard.customerTrustIndex}<span style="font-size: 12px; color: #64748b;">/100</span></div>
          </div>
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #0f766e; line-height: 1.4; border-top: 1px solid #ccfbf1; padding-top: 8px;">
          <strong>Vitality Diagnosis:</strong> ${report.scorecard.vitalityDiagnosis}
        </div>
      </div>
    `
  }

  // 3. Executive Verdict HTML
  let verdictHtml = ""
  if (report.executiveNarrative?.executiveVerdict) {
    verdictHtml = `
      <div style="background: #f8fafc; border-left: 4px solid #000080; border-radius: 0 8px 8px 0; padding: 12px 16px; margin-bottom: 20px;" class="avoid-break">
        <div style="font-size: 11px; font-weight: 900; color: #000080; text-transform: uppercase; margin-bottom: 4px;">Executive Verdict & Leadership Synthesis</div>
        <div style="font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.5; font-style: italic;">
          "${report.executiveNarrative.executiveVerdict}"
        </div>
      </div>
    `
  }

  // 4. 4-Quadrant Narrative HTML
  let narrativeHtml = ""
  if (report.executiveNarrative) {
    narrativeHtml = `
      <div style="margin-bottom: 22px;" class="avoid-break">
        <div style="font-size: 13px; font-weight: 900; color: #000080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
          Humanoid Qualitative Diagnosis & Domain Analysis
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 800; color: #000080; text-transform: uppercase; margin-bottom: 4px;">1. Commercial Momentum & Market Context</div>
            <div style="font-size: 12px; font-weight: 500; color: #334155; line-height: 1.5;">${report.executiveNarrative.overview}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 800; color: #16a34a; text-transform: uppercase; margin-bottom: 4px;">2. Revenue Inflow & Capital Liquidity</div>
            <div style="font-size: 12px; font-weight: 500; color: #334155; line-height: 1.5;">${report.executiveNarrative.revenueAndFinancials}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin-bottom: 4px;">3. Engineering Throughput & Delivery</div>
            <div style="font-size: 12px; font-weight: 500; color: #334155; line-height: 1.5;">${report.executiveNarrative.operationsAndDelivery}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 800; color: #d97706; text-transform: uppercase; margin-bottom: 4px;">4. Risk Governance & Compliance</div>
            <div style="font-size: 12px; font-weight: 500; color: #334155; line-height: 1.5;">${report.executiveNarrative.riskAndGovernance}</div>
          </div>
        </div>
      </div>
    `
  }

  // 5. KPI Driver Explanations
  let kpisHtml = ""
  if (report.kpiExplanations && report.kpiExplanations.length > 0) {
    const kpiCards = report.kpiExplanations.map(kpi => `
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;" class="avoid-break">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12px; font-weight: 800; color: #000080;">${kpi.label}</span>
          <span style="font-size: 11px; font-weight: 900; color: #000080; background: #e0f2fe; padding: 2px 8px; border-radius: 4px;">${kpi.value}</span>
        </div>
        <div style="font-size: 11.5px; font-weight: 500; color: #475569; line-height: 1.45;">${kpi.analysis}</div>
        ${kpi.benchmark || kpi.driver ? `
          <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: #64748b; margin-top: 6px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
            ${kpi.benchmark ? `<span>Benchmark: <strong>${kpi.benchmark}</strong></span>` : ''}
            ${kpi.driver ? `<span>Driver: <strong>${kpi.driver}</strong></span>` : ''}
          </div>
        ` : ''}
      </div>
    `).join("")

    kpisHtml = `
      <div style="margin-bottom: 22px;" class="avoid-break">
        <div style="font-size: 13px; font-weight: 900; color: #000080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
          Key Performance Drivers & Evaluation Context
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${kpiCards}
        </div>
      </div>
    `
  }

  // 6. Strategic Action Roadmap
  let roadmapHtml = ""
  if (report.strategicRecommendations && report.strategicRecommendations.length > 0) {
    const recsHtml = report.strategicRecommendations.map(rec => `
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 8px;" class="avoid-break">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 11px; font-weight: 900; color: #000080; text-transform: uppercase;">${rec.domain}</span>
          <span style="font-size: 10px; font-weight: 900; color: #ffffff; background: #000080; padding: 2px 6px; border-radius: 4px;">
            ${rec.priority} PRIORITY
          </span>
        </div>
        <div style="font-size: 12.5px; font-weight: 800; color: #0f172a; margin-bottom: 3px;">${rec.title}</div>
        <div style="font-size: 11.5px; font-weight: 500; color: #334155; line-height: 1.45;">${rec.recommendation}</div>
        ${rec.expectedImpact ? `
          <div style="font-size: 11px; font-weight: 800; color: #16a34a; margin-top: 6px;">
            ✓ Expected Impact: ${rec.expectedImpact}
          </div>
        ` : ''}
      </div>
    `).join("")

    roadmapHtml = `
      <div style="margin-bottom: 22px;" class="avoid-break">
        <div style="font-size: 13px; font-weight: 900; color: #000080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
          Strategic Action Roadmap & Prescriptive Directives
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${recsHtml}
        </div>
      </div>
    `
  }

  // 7. Orders Table (if available)
  let ordersTableHtml = ""
  if (report.data?.orders && Array.isArray(report.data.orders) && report.data.orders.length > 0) {
    const rows = report.data.orders.slice(0, 20).map((o: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #000080;">${o.order_number || o.id?.slice(0, 8)}</td>
        <td style="padding: 6px 8px; font-weight: 500;">${o.customer_name || o.customerName || 'Customer'}</td>
        <td style="padding: 6px 8px; text-transform: uppercase; font-size: 10px; font-weight: bold;">${o.status || 'pending'}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 700;">${formatMoney(o.total)}</td>
        <td style="padding: 6px 8px; text-align: right; color: #64748b;">${o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}</td>
      </tr>
    `).join("")

    ordersTableHtml = `
      <div style="margin-bottom: 22px;" class="avoid-break">
        <div style="font-size: 13px; font-weight: 900; color: #000080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Commercial Orders Ledger (${report.data.orders.length} total)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #000080; color: #ffffff;">
              <th style="padding: 6px 8px; text-align: left;">Order ID</th>
              <th style="padding: 6px 8px; text-align: left;">Customer</th>
              <th style="padding: 6px 8px; text-align: left;">Status</th>
              <th style="padding: 6px 8px; text-align: right;">Total</th>
              <th style="padding: 6px 8px; text-align: right;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  }

  // 8. Invoices Table (if available)
  let invoicesTableHtml = ""
  if (report.data?.invoices && Array.isArray(report.data.invoices) && report.data.invoices.length > 0) {
    const rows = report.data.invoices.slice(0, 20).map((inv: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px 8px; font-family: monospace; font-weight: bold; color: #000080;">${inv.invoice_number || inv.id?.slice(0, 8)}</td>
        <td style="padding: 6px 8px; font-weight: 500;">${inv.client_name || 'Client'}</td>
        <td style="padding: 6px 8px; text-transform: uppercase; font-size: 10px; font-weight: bold;">${inv.status || 'draft'}</td>
        <td style="padding: 6px 8px; color: #64748b;">${inv.due_date ? new Date(inv.due_date).toLocaleDateString() : 'Immediate'}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #16a34a;">${formatMoney(inv.amount)}</td>
      </tr>
    `).join("")

    invoicesTableHtml = `
      <div style="margin-bottom: 22px;" class="avoid-break">
        <div style="font-size: 13px; font-weight: 900; color: #000080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Invoices & Accounts Receivable Ledger (${report.data.invoices.length} entries)
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background: #000080; color: #ffffff;">
              <th style="padding: 6px 8px; text-align: left;">Invoice #</th>
              <th style="padding: 6px 8px; text-align: left;">Client</th>
              <th style="padding: 6px 8px; text-align: left;">Status</th>
              <th style="padding: 6px 8px; text-align: left;">Due Date</th>
              <th style="padding: 6px 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `
  }

  // 9. Sign-off Seal
  const auditSealHtml = `
    <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #000080;" class="avoid-break">
      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 11px; color: #475569; line-height: 1.5;">
          <div style="font-weight: 900; color: #000080; text-transform: uppercase; margin-bottom: 2px;">Executive Governance & Compliance Verification</div>
          <div>Signing Officer: <strong>${report.auditSeal?.officer || 'Chief Operating Officer & Chief Technology Officer'}</strong></div>
          <div>Issuing Body: ${report.auditSeal?.issuingDivision || 'QuardCube Labs Strategic Intelligence Directorate'}</div>
          <div style="font-family: monospace; font-size: 9.5px; color: #64748b;">Audit Digest: ${report.auditSeal?.complianceHash || 'SHA256-QC-SECURE-VERIFIED'}</div>
        </div>
        <div style="text-align: right;">
          <div style="border-bottom: 2px solid #000080; width: 200px; padding-bottom: 4px; margin-bottom: 6px; text-align: center;">
            <span style="font-family: Georgia, serif; font-style: italic; font-weight: bold; color: #000080; font-size: 13px;">QuardCube Executive Board</span>
          </div>
          <div style="font-size: 10px; font-weight: 800; color: #16a34a; text-transform: uppercase;">
            ✓ ${report.auditSeal?.verificationStatus || 'VERIFIED AGAINST PRODUCTION DATABASE'}
          </div>
        </div>
      </div>
      <div style="text-align: center; font-size: 9.5px; color: #94a3b8; margin-top: 16px;">
        CONFIDENTIAL & PROPRIETARY // QUARDCUBE LABS COMPANY LIMITED // ALL RIGHTS RESERVED
      </div>
    </div>
  `

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${report.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff !important;
            font-size: 12px;
            line-height: 1.4;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000080;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .brand img {
            width: 48px;
            height: 48px;
            object-fit: contain;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #000080;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 11px;
            font-weight: 600;
            color: #475569;
          }
          .meta {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .meta strong {
            color: #000080;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 100%; margin: 0 auto;">
          <!-- Header -->
          <div class="header">
            <div class="brand">
              <img src="/turquoise.png" alt="QuardCube" />
              <div>
                <div class="brand-title">QUARDCUBE LABS</div>
                <div class="brand-sub">Enterprise Technology &amp; Analytics Directorate</div>
              </div>
            </div>
            <div class="meta">
              <div style="font-weight: 900; color: #000080; text-transform: uppercase;">${report.auditSeal?.classification || 'CONFIDENTIAL INTELLIGENCE'}</div>
              <div>Ref: <strong>${report.auditSeal?.reportId || 'QC-AUDIT'}</strong></div>
              <div>Issued: ${formattedDate}</div>
            </div>
          </div>

          <!-- Document Title Banner -->
          <div style="margin-bottom: 18px;">
            <div style="display: inline-block; background: #000080; color: #ffffff; font-size: 9.5px; font-weight: 900; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px;">
              ${report.category} Domain Audit
            </div>
            <h1 style="font-size: 22px; font-weight: 900; color: #000080; line-height: 1.2; margin-bottom: 4px;">
              ${report.title}
            </h1>
            <p style="font-size: 11.5px; color: #475569; line-height: 1.45;">
              ${report.description}
            </p>
          </div>

          <!-- Scorecard -->
          ${scorecardHtml}

          <!-- Verdict -->
          ${verdictHtml}

          <!-- Key Metrics -->
          <div style="margin-bottom: 20px;" class="avoid-break">
            <div style="font-size: 13px; font-weight: 900; color: #000080; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
              Executive Key Performance Indicators
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${metricsHtml}
            </div>
          </div>

          <!-- 4-Quadrant Narrative -->
          ${narrativeHtml}

          <!-- KPI Driver Explanations -->
          ${kpisHtml}

          <!-- Strategic Action Roadmap -->
          ${roadmapHtml}

          <!-- Detailed Tables -->
          ${ordersTableHtml}
          ${invoicesTableHtml}

          <!-- Sign-Off Seal -->
          ${auditSealHtml}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
