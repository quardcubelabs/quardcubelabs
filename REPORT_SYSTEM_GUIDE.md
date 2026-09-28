# QuardCube Labs — Report Management & Generation System Guide

This guide documents the enterprise-grade, configuration-driven **Report Management & Generation System** implemented for QuardCube Labs.

---

## 1. System Architecture

```
                                  QUARDCUBE LABS ARCHITECTURE
                                  
  Browser (Admin Dashboard)
             │
             │  1. Configure filters, date range, sections
             ▼
  Next.js Server Actions (`/lib/reports-actions.ts`)
             │
             │  2. Query authoritative tables (orders, invoices, products, etc.)
             │  3. Compute metrics, trend points, distributions, audit hashes
             ▼
  Report Payload (`PreparedReportPayload`)
             │
             ├──► Live Preview (Direct in browser, 0-file overhead)
             │
             └──► Document Generator (`/lib/report-engine/python-client.ts`)
                       │
                       ├── (Primary) Python FastAPI Service (`http://127.0.0.1:8000/generate`)
                       │         ├── PDF Engine: ReportLab + Matplotlib + Enterprise Cover & Seal
                       │         ├── DOCX Engine: python-docx + Tables + Embedded Charts
                       │         └── XLSX Engine: openpyxl + Multi-sheet + TZS Currency Styling
                       │
                       └── (Zero-Downtime Fallback) Node.js Generator
                                 ├── XLSX Engine: ExcelJS multi-sheet workbook
                                 └── Document Storage: Local / Supabase Storage
```

---

## 2. Directory Structure & Files Created

### TypeScript & Next.js Modules
- `lib/report-engine/types.ts`: Universal report configurations, section types, filter definitions, and prepared payloads.
- `lib/report-engine/data-fetcher.ts`: Server-side aggregation engine querying real Supabase tables (`orders`, `invoices`, `products`, `categories`, etc.).
- `lib/report-engine/python-client.ts`: Microservice HTTP client with automatic fallback for document rendering and file persistence.
- `lib/reports-actions.ts`: Server actions for `previewReportAction`, `generateReportAction`, `getGeneratedReports`, `saveReportTemplate`, `duplicateReportAction`, and `deleteReportAction`.

### Admin UI Pages
- `app/admin/(protected)/reports/page.tsx`: Main reporting dashboard with summary KPI cards, quick launchers, recent reports history table, preview modal, duplicate, download, and delete actions.
- `app/admin/(protected)/reports/create/page.tsx`: 6-step interactive report builder with real-time authoritative live preview and PDF / DOCX / XLSX export triggers.

### Python FastAPI Service
- `report_service/main.py`: FastAPI server exposing `/health` and `/generate` endpoints.
- `report_service/requirements.txt`: Dependencies (`fastapi`, `uvicorn`, `reportlab`, `python-docx`, `openpyxl`, `matplotlib`, `pandas`).
- `report_service/generators/pdf_generator.py`: ReportLab generator with custom headers, KPI callout blocks, Matplotlib trend charts, table styling, and cryptographic audit seal.
- `report_service/generators/docx_generator.py`: python-docx generator with formatted heading hierarchy, summary tables, and embedded chart figures.
- `report_service/generators/xlsx_generator.py`: openpyxl multi-sheet workbook (Executive Summary + Data Tables + TZS number formats + Freeze Panes).
- `report_service/run_service.bat` & `report_service/run_service.ps1`: One-click startup scripts.

### Database Migration
- `db/report-system.sql`: DDL for `report_templates`, `generated_reports`, and `report_jobs` with Row Level Security (RLS) policies.

---

## 3. Supported Report Categories

1. **Sales Report (`sales`)**:
   - Executive Summary, Gross Sales Revenue, Total Orders, Units Dispatched, Average Order Value (AOV).
   - Daily Revenue Velocity Line Chart & Category Distribution Doughnut Chart.
   - Top Selling Products & Order Fulfillment Ledger.
   - Period comparison with percentage variance deltas.

2. **Inventory Report (`inventory`)**:
   - Total SKUs, Aggregate Warehouse Stock Units, Total Valuation (TZS).
   - Category stock distribution bar charts.
   - Depleted & Low Stock alert tables (≤ 5 units).
   - Complete inventory manifest with retail valuations.

3. **Customer Report (`customers`)**:
   - Active purchasing client count, total client spend, and Customer Lifetime Value (LTV).
   - High-value client ranking chart and customer transaction directory.

4. **Purchase & Supplier Report (`purchases`)**:
   - Supplier procurement distribution, catalog lines under management, and vendor fulfillment ratings.

5. **Financial Report (`financial`)**:
   - Invoiced vs Collected Revenue, Outstanding Receivables aging, and Quotation Pipeline conversion metrics.

6. **IT & Asset Report (`it_assets`)**:
   - Enterprise hardware and software asset register, system health status, and compliance posture.

7. **Custom Multi-Source Report (`custom`)**:
   - Dynamic report querying cross-functional data sources with user-selected metrics, charts, and tables.

---

## 4. How to Start the Python Report Service

### Step 1: Install Python Dependencies
```bash
cd report_service
pip install -r requirements.txt
```

### Step 2: Launch the FastAPI Service
```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Or simply double-click `report_service/run_service.bat`.*

### Step 3: Verify Health
Visit `http://127.0.0.1:8000/health` in your browser. You should receive:
```json
{
  "status": "healthy",
  "service": "QuardCube Labs Report Engine",
  "version": "1.0.0",
  "supported_formats": ["pdf", "docx", "xlsx"]
}
```

> **Note on Zero-Downtime Fallback:** If the Python service is not running, the system will automatically utilize the built-in Node.js ExcelJS engine for instant report generation without blocking administrators.

---

## 5. How to Test Report Generation End-to-End

1. Navigate to **Admin Dashboard → Reports** (`/admin/reports`).
2. Click **"+ Create Report"** or select a **Quick Launcher** (e.g. Sales).
3. In **Step 1**, choose **Sales Report**.
4. In **Step 2**, pick a date range (e.g., past 30 days) and enable **Period Comparison**.
5. Observe the **Live Interactive Preview** panel on the right recalculating with real data from your Supabase database.
6. Click **"Export XLSX"**, **"Export DOCX"**, or **"Generate PDF"**.
7. The file downloads directly to your machine and is stored in the **Report History** table.
8. In the history table, test the **View**, **Download**, **Duplicate**, and **Delete** actions.

---

## 6. How to Add a Future Report Type

The architecture is configuration-driven. To add a new report type (e.g. `hr_payroll`):

1. **Add to `types.ts`**: Add `'hr_payroll'` to the `ReportType` union.
2. **Add default sections in `data-fetcher.ts`**: Define default sections in `getDefaultSections('hr_payroll')`.
3. **Add aggregator query in `data-fetcher.ts`**: Query the respective Supabase table (e.g. `supabase.from('payroll')`) and compute summary metrics, charts, and table rows.
4. **No document generator changes required**: The generic document generators automatically render all sections, charts, and tables into PDF, DOCX, and XLSX!
