import io
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_xlsx_report(report_def: dict) -> bytes:
    """Generate a clean, multi-sheet formatted Excel workbook (.xlsx)."""
    wb = openpyxl.Workbook()
    # Default sheet
    ws_summary = wb.active
    ws_summary.title = "Executive Summary"
    ws_summary.views.sheetView[0].showGridLines = True

    # Styling Palettes
    navy_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    teal_fill = PatternFill(start_color="0D9488", end_color="0D9488", fill_type="solid")
    light_slate_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    stripe_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

    font_title = Font(name="Calibri", size=18, bold=True, color="0F172A")
    font_subtitle = Font(name="Calibri", size=10, italic=True, color="64748B")
    font_company = Font(name="Calibri", size=11, bold=True, color="0D9488")
    font_hdr = Font(name="Calibri", size=10, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=10, bold=True, color="0F172A")
    font_regular = Font(name="Calibri", size=10, color="1E293B")
    font_kpi_val = Font(name="Calibri", size=14, bold=True, color="0D9488")
    font_kpi_lbl = Font(name="Calibri", size=9, color="64748B")

    border_thin = Border(
        left=Side(style="thin", color="E2E8F0"),
        right=Side(style="thin", color="E2E8F0"),
        top=Side(style="thin", color="E2E8F0"),
        bottom=Side(style="thin", color="E2E8F0")
    )

    company_name = report_def.get('branding', {}).get('companyName', 'QUARDCUBE LABS')
    report_title = report_def.get('title', 'Executive Management Report')
    report_desc = report_def.get('description', '')
    period_from = report_def.get('period', {}).get('from', '')
    period_to = report_def.get('period', {}).get('to', '')
    period_str = f"Period: {period_from} to {period_to}" if period_from and period_to else "All Historical Data"

    # --- SHEET 1: EXECUTIVE SUMMARY ---
    ws_summary['A1'] = company_name.upper()
    ws_summary['A1'].font = font_company

    ws_summary['A2'] = report_title
    ws_summary['A2'].font = font_title

    ws_summary['A3'] = f"{report_desc} | {period_str} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    ws_summary['A3'].font = font_subtitle

    # Add KPIs in summary sheet
    summary = report_def.get('summary', {})
    key_metrics = summary.get('keyMetrics', {})

    if key_metrics:
        ws_summary['A5'] = "EXECUTIVE KPI OVERVIEW"
        ws_summary['A5'].font = font_bold

        row = 6
        for k, v in key_metrics.items():
            ws_summary.cell(row=row, column=1, value=k.replace('_', ' ').title()).font = font_bold
            val_cell = ws_summary.cell(row=row, column=2, value=v)
            val_cell.font = font_regular
            if isinstance(v, (int, float)) and v > 1000 and "count" not in k.lower():
                val_cell.number_format = '#,##0 "TZS"'
            row += 1

    ws_summary.column_dimensions['A'].width = 32
    ws_summary.column_dimensions['B'].width = 24

    # --- SHEET 2+: DYNAMIC DATA TABLES ---
    sections = report_def.get('sections', [])
    data_payload = report_def.get('data', {})

    for section in sections:
        sec_type = section.get('type')
        if sec_type == 'table':
            table_rows = section.get('rows') or data_payload.get(section.get('dataKey', '')) or []
            headers = section.get('headers') or []
            sec_title = section.get('title', 'Data')[:30] # Excel sheet name limit

            if not headers and table_rows and len(table_rows) > 0 and isinstance(table_rows[0], dict):
                headers = list(table_rows[0].keys())

            if table_rows and headers:
                # Clean sheet name
                clean_title = "".join(c for c in sec_title if c.isalnum() or c in (' ', '_', '-')).strip() or "Data"
                ws = wb.create_sheet(title=clean_title)
                ws.views.sheetView[0].showGridLines = True

                # Title row
                ws['A1'] = section.get('title', 'Data Table')
                ws['A1'].font = font_bold

                # Headers at row 3
                for col_idx, h in enumerate(headers, start=1):
                    cell = ws.cell(row=3, column=col_idx, value=h.replace('_', ' ').title())
                    cell.font = font_hdr
                    cell.fill = navy_fill
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                    cell.border = border_thin

                # Data rows
                for r_idx, item in enumerate(table_rows, start=4):
                    row_fill = stripe_fill if r_idx % 2 == 0 else light_slate_fill
                    for col_idx, h in enumerate(headers, start=1):
                        val = item.get(h, '') if isinstance(item, dict) else str(item)
                        cell = ws.cell(row=r_idx, column=col_idx, value=val)
                        cell.font = font_regular
                        cell.fill = row_fill
                        cell.border = border_thin

                        # Auto format numbers/currency
                        if isinstance(val, (int, float)):
                            if "price" in h.lower() or "revenue" in h.lower() or "total" in h.lower() or "amount" in h.lower():
                                cell.number_format = '#,##0 "TZS"'
                                cell.alignment = Alignment(horizontal="right")
                            elif "rate" in h.lower() or "percent" in h.lower():
                                cell.number_format = '0.0%'
                                cell.alignment = Alignment(horizontal="right")
                            else:
                                cell.number_format = '#,##0'
                                cell.alignment = Alignment(horizontal="right")
                        else:
                            cell.alignment = Alignment(horizontal="left")

                # Freeze panes below headers
                ws.freeze_panes = "A4"

                # Auto adjust column widths
                for col in ws.columns:
                    max_len = 0
                    col_letter = get_column_letter(col[0].column)
                    for cell in col:
                        if cell.value:
                            max_len = max(max_len, len(str(cell.value)))
                    ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    output_buf = io.BytesIO()
    wb.save(output_buf)
    xlsx_bytes = output_buf.getvalue()
    output_buf.close()
    return xlsx_bytes
