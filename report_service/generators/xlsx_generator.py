"""
QuardCube Labs - Professional Business Excel (.xlsx) Workbook Generator
Generates publication-quality, multi-sheet structured business workbooks with executive briefing tabs and financial formatting.
"""

import io
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_xlsx_bytes(report_data: dict) -> bytes:
    """Generate a high-impact, professional, multi-sheet Excel workbook."""
    wb = openpyxl.Workbook()

    # Styling Palettes
    navy_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    teal_fill = PatternFill(start_color="0D9488", end_color="0D9488", fill_type="solid")
    bg_light_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    stripe_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
    total_fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")

    font_title = Font(name="Calibri", size=16, bold=True, color="0F172A")
    font_subtitle = Font(name="Calibri", size=9.5, italic=True, color="64748B")
    font_company = Font(name="Calibri", size=11, bold=True, color="0D9488")
    font_hdr = Font(name="Calibri", size=9.5, bold=True, color="FFFFFF")
    font_bold = Font(name="Calibri", size=9.5, bold=True, color="0F172A")
    font_regular = Font(name="Calibri", size=9.5, color="1E293B")
    font_kpi_val = Font(name="Calibri", size=13, bold=True, color="0D9488")
    font_kpi_lbl = Font(name="Calibri", size=9, bold=True, color="0F172A")
    font_kpi_desc = Font(name="Calibri", size=8, color="64748B")

    border_thin = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="thin", color="CBD5E1")
    )

    border_total = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="0F172A"),
        bottom=Side(style="double", color="0F172A")
    )

    branding = report_data.get('branding', {})
    company_name = branding.get('companyName', 'QUARDCUBE LABS')
    report_title = report_data.get('title', 'Executive Management Report')
    report_desc = report_data.get('subtitle') or report_data.get('description') or 'Comprehensive Performance Assessment'
    period_from = report_data.get('period', {}).get('from', '')
    period_to = report_data.get('period', {}).get('to', '')
    period_str = f"Period: {period_from} to {period_to}" if period_from and period_to else "Period: All Historical Activity"
    prepared_by = branding.get('preparedBy') or report_data.get('auditSeal', {}).get('officer') or 'Senior Reporting Officer'

    # =========================================================================
    # SHEET 1: EXECUTIVE BRIEFING DASHBOARD
    # =========================================================================
    ws_summary = wb.active
    ws_summary.title = "Executive Summary"
    ws_summary.views.sheetView[0].showGridLines = True

    # 1. Company Banner
    ws_summary['A1'] = company_name.upper()
    ws_summary['A1'].font = font_company
    ws_summary['A2'] = report_title
    ws_summary['A2'].font = font_title
    ws_summary['A3'] = f"{report_desc}  |  {period_str}  |  Prepared By: {prepared_by}  |  Issued: {datetime.now().strftime('%d %B %Y')}"
    ws_summary['A3'].font = font_subtitle

    # 2. Executive Narrative Block
    narrative = report_data.get('narrative', {})
    exec_summary = narrative.get('executiveSummary') or narrative.get('overview') or report_data.get('summary', {}).get('executiveSummary')

    curr_row = 5
    if exec_summary:
        ws_summary.cell(row=curr_row, column=1, value="EXECUTIVE NARRATIVE OVERVIEW").font = font_bold
        curr_row += 1
        
        # Merge A6:F7 for narrative text
        ws_summary.merge_cells(start_row=curr_row, start_column=1, end_row=curr_row + 2, end_column=6)
        n_cell = ws_summary.cell(row=curr_row, column=1, value=exec_summary)
        n_cell.font = font_regular
        n_cell.alignment = Alignment(wrap_text=True, vertical="top")
        
        for r in range(curr_row, curr_row + 3):
            for c in range(1, 7):
                ws_summary.cell(row=r, column=c).fill = bg_light_fill
                ws_summary.cell(row=r, column=c).border = border_thin

        curr_row += 4

    # 3. KPI Metrics Summary
    metrics = report_data.get('summary', {}).get('metrics', [])
    if metrics:
        ws_summary.cell(row=curr_row, column=1, value="KEY PERFORMANCE INDICATORS").font = font_bold
        curr_row += 1

        # Header for KPI table
        ws_summary.cell(row=curr_row, column=1, value="Metric Indicator").font = font_hdr
        ws_summary.cell(row=curr_row, column=1).fill = navy_fill
        ws_summary.cell(row=curr_row, column=2, value="Current Value").font = font_hdr
        ws_summary.cell(row=curr_row, column=2).fill = navy_fill
        ws_summary.cell(row=curr_row, column=3, value="Operational Context & Notes").font = font_hdr
        ws_summary.cell(row=curr_row, column=3).fill = navy_fill
        curr_row += 1

        for m in metrics:
            val = m.get('value', '0')
            ws_summary.cell(row=curr_row, column=1, value=m.get('label', '')).font = font_bold
            ws_summary.cell(row=curr_row, column=1).border = border_thin

            v_cell = ws_summary.cell(row=curr_row, column=2, value=val)
            v_cell.font = font_kpi_val
            v_cell.border = border_thin
            v_cell.alignment = Alignment(horizontal="right")
            if isinstance(val, (int, float)) and val > 1000:
                v_cell.number_format = '#,##0 "TZS"'

            ws_summary.cell(row=curr_row, column=3, value=m.get('description', '')).font = font_regular
            ws_summary.cell(row=curr_row, column=3).border = border_thin
            curr_row += 1

        curr_row += 2

    # 4. Strategic Observations
    observations = narrative.get('observations', [])
    if observations:
        ws_summary.cell(row=curr_row, column=1, value="STRATEGIC OBSERVATIONS & FINDINGS").font = font_bold
        curr_row += 1
        for obs in observations:
            ws_summary.cell(row=curr_row, column=1, value=f"•  {obs}").font = font_regular
            curr_row += 1

    ws_summary.column_dimensions['A'].width = 32
    ws_summary.column_dimensions['B'].width = 24
    ws_summary.column_dimensions['C'].width = 45
    ws_summary.column_dimensions['D'].width = 18
    ws_summary.column_dimensions['E'].width = 18
    ws_summary.column_dimensions['F'].width = 18

    # =========================================================================
    # SHEET 2+: DYNAMIC DATA REGISTERS & TABLES
    # =========================================================================
    sections = report_data.get('sections', [])
    tables_dict = report_data.get('tables', {})
    section_narratives = narrative.get('sectionNarratives', {})

    for sec in sections:
        sec_type = sec.get('type')
        data_key = sec.get('dataKey', '')
        
        if sec_type == 'table' and data_key in tables_dict:
            t_data = tables_dict[data_key]
            raw_rows = t_data.get('rows', [])
            headers = t_data.get('headers', [])
            table_title = t_data.get('title', sec.get('title', 'Data Register'))

            if headers and raw_rows:
                # Clean sheet title (max 30 chars for Excel)
                clean_name = "".join(c for c in table_title if c.isalnum() or c in (' ', '_', '-')).strip()[:28] or "Data Register"
                ws = wb.create_sheet(title=clean_name)
                ws.views.sheetView[0].showGridLines = True

                # Title block
                ws['A1'] = table_title
                ws['A1'].font = font_bold
                
                intro_note = t_data.get('introText') or section_narratives.get(data_key) or f"Authoritative ledger for {period_str}"
                ws['A2'] = intro_note
                ws['A2'].font = font_subtitle

                # Table Header Row at Row 4
                for col_idx, h in enumerate(headers, start=1):
                    cell = ws.cell(row=4, column=col_idx, value=str(h).upper())
                    cell.font = font_hdr
                    cell.fill = navy_fill
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                    cell.border = border_thin

                ws.row_dimensions[4].height = 24

                # Data rows
                for r_idx, r_data in enumerate(raw_rows, start=5):
                    row_fill = stripe_fill if r_idx % 2 == 0 else bg_light_fill
                    ws.row_dimensions[r_idx].height = 18
                    
                    for col_idx, val in enumerate(r_data, start=1):
                        cell = ws.cell(row=r_idx, column=col_idx, value=val)
                        cell.font = font_regular
                        cell.fill = row_fill
                        cell.border = border_thin

                        # Format currency or numbers
                        val_str = str(val if val is not None else '')
                        h_lower = str(headers[col_idx - 1]).lower()
                        
                        if isinstance(val, (int, float)):
                            if any(k in h_lower for k in ['price', 'revenue', 'total', 'amount', 'cost', 'spend', 'val']):
                                cell.number_format = '#,##0 "TZS"'
                                cell.alignment = Alignment(horizontal="right")
                            elif 'qty' in h_lower or 'quantity' in h_lower or 'count' in h_lower or 'units' in h_lower:
                                cell.number_format = '#,##0'
                                cell.alignment = Alignment(horizontal="center")
                        elif 'TZS' in val_str:
                            cell.alignment = Alignment(horizontal="right")

                # Auto-fit column widths with comfortable padding
                for col in ws.columns:
                    max_len = 0
                    col_letter = get_column_letter(col[0].column)
                    for cell in col:
                        if cell.row >= 4:
                            max_len = max(max_len, len(str(cell.value or '')))
                    ws.column_dimensions[col_letter].width = max(max_len + 5, 14)

    # Save to buffer
    xlsx_buffer = io.BytesIO()
    wb.save(xlsx_buffer)
    xlsx_buffer.seek(0)
    return xlsx_buffer.getvalue()
