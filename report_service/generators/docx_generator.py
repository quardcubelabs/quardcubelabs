import io
import os
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Set background color of a docx table cell."""
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tc_pr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding of a docx table cell in twentieths of a point (dxa)."""
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tc_pr.append(tc_mar)


def render_chart_image_bytes(chart_data, chart_type='bar', title=""):
    """Render a Matplotlib chart and return image bytes."""
    fig, ax = plt.subplots(figsize=(6.0, 2.8), dpi=180)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')

    primary_color = '#0F172A'
    secondary_color = '#0D9488'

    labels = [str(item.get('label') or item.get('name') or item.get('date') or '') for item in chart_data][:12]
    values = [float(item.get('value') or item.get('revenue') or item.get('total') or item.get('count') or 0) for item in chart_data][:12]

    if not labels or not values:
        plt.close(fig)
        return None

    if chart_type in ['line', 'area']:
        ax.plot(labels, values, color=secondary_color, marker='o', linewidth=2, markersize=4)
        if chart_type == 'area':
            ax.fill_between(range(len(labels)), values, color=secondary_color, alpha=0.15)
        ax.grid(True, linestyle='--', alpha=0.5, color='#CBD5E1')
        plt.xticks(rotation=25, ha='right', fontsize=8)
    elif chart_type in ['pie', 'doughnut']:
        colors_list = ['#0D9488', '#0F172A', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981']
        ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=140, colors=colors_list[:len(values)], textprops={'fontsize': 8})
    else:
        ax.bar(labels, values, color=secondary_color, edgecolor='#0F766E', width=0.5)
        ax.grid(axis='y', linestyle='--', alpha=0.5, color='#CBD5E1')
        plt.xticks(rotation=25, ha='right', fontsize=8)

    if title:
        ax.set_title(title, fontsize=10, fontweight='bold', color='#0F172A')

    plt.tight_layout()
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png', bbox_inches='tight')
    plt.close(fig)
    img_buf.seek(0)
    return img_buf


def generate_docx_report(report_def: dict) -> bytes:
    """Generate a clean, structured Microsoft Word (.docx) document."""
    doc = Document()

    # Set page margins to 0.75 in
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # 1. Branding Header
    company_name = report_def.get('branding', {}).get('companyName', 'QUARDCUBE LABS')
    report_title = report_def.get('title', 'Executive Management Report')
    report_desc = report_def.get('description', '')
    period_from = report_def.get('period', {}).get('from', '')
    period_to = report_def.get('period', {}).get('to', '')
    period_str = f"Reporting Period: {period_from} to {period_to}" if period_from and period_to else "All Historical Data"

    # Header title
    co_p = doc.add_paragraph()
    co_run = co_p.add_run(company_name.upper())
    co_run.bold = True
    co_run.font.size = Pt(10)
    co_run.font.color.rgb = RGBColor(13, 148, 136) # Teal

    title_p = doc.add_paragraph()
    title_run = title_p.add_run(report_title)
    title_run.bold = True
    title_run.font.size = Pt(20)
    title_run.font.color.rgb = RGBColor(15, 23, 42) # Navy

    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run(f"{report_desc}\n{period_str} • Generated: {datetime.now().strftime('%d %B %Y, %H:%M')}")
    sub_run.font.size = Pt(9.5)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 2. Key Metrics Table / Summary
    summary = report_def.get('summary', {})
    key_metrics = summary.get('keyMetrics', {})

    if key_metrics:
        h1 = doc.add_heading('Executive KPI Summary', level=1)
        h1.runs[0].font.color.rgb = RGBColor(15, 23, 42)

        items = list(key_metrics.items())
        cols = 3
        rows_needed = (len(items) + cols - 1) // cols
        kpi_table = doc.add_table(rows=rows_needed, cols=cols)
        kpi_table.alignment = WD_TABLE_ALIGNMENT.CENTER

        for idx, (k, v) in enumerate(items):
            r = idx // cols
            c = idx % cols
            cell = kpi_table.cell(r, c)
            set_cell_background(cell, 'F8FAFC')
            set_cell_margins(cell, top=140, bottom=140, left=180, right=180)

            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            formatted_val = f"TZS {v:,.0f}" if isinstance(v, (int, float)) and v > 1000 and "count" not in k.lower() else str(v)
            val_run = p.add_run(f"{formatted_val}\n")
            val_run.bold = True
            val_run.font.size = Pt(13)
            val_run.font.color.rgb = RGBColor(13, 148, 136)

            lbl_run = p.add_run(k.replace('_', ' ').title())
            lbl_run.font.size = Pt(8.5)
            lbl_run.font.color.rgb = RGBColor(100, 116, 139)

        doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # 3. Dynamic Sections
    sections = report_def.get('sections', [])
    data_payload = report_def.get('data', {})

    for section in sections:
        sec_type = section.get('type')
        sec_title = section.get('title', 'Report Section')

        h = doc.add_heading(sec_title, level=1)
        h.runs[0].font.color.rgb = RGBColor(15, 23, 42)

        if sec_type == 'chart':
            chart_data = section.get('data') or data_payload.get(section.get('dataKey', '')) or []
            if chart_data:
                img_buf = render_chart_image_bytes(chart_data, chart_type=section.get('chartType', 'bar'))
                if img_buf:
                    doc.add_picture(img_buf, width=Inches(6.0))
                    doc.add_paragraph().paragraph_format.space_after = Pt(12)

        elif sec_type == 'table':
            table_rows = section.get('rows') or data_payload.get(section.get('dataKey', '')) or []
            headers = section.get('headers') or []
            
            if not headers and table_rows and len(table_rows) > 0 and isinstance(table_rows[0], dict):
                headers = list(table_rows[0].keys())[:6]

            if table_rows and headers:
                tbl = doc.add_table(rows=1, cols=len(headers))
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                hdr_cells = tbl.rows[0].cells
                for i, h_text in enumerate(headers):
                    hdr_cells[i].text = h_text.replace('_', ' ').title()
                    set_cell_background(hdr_cells[i], '0F172A')
                    set_cell_margins(hdr_cells[i], top=100, bottom=100, left=140, right=140)
                    hdr_p = hdr_cells[i].paragraphs[0]
                    hdr_p.runs[0].bold = True
                    hdr_p.runs[0].font.size = Pt(8.5)
                    hdr_p.runs[0].font.color.rgb = RGBColor(255, 255, 255)

                for item in table_rows[:40]:
                    row_cells = tbl.add_row().cells
                    for i, h_key in enumerate(headers):
                        val = item.get(h_key, '') if isinstance(item, dict) else str(item)
                        if isinstance(val, (int, float)) and ("price" in h_key.lower() or "revenue" in h_key.lower() or "total" in h_key.lower() or "amount" in h_key.lower()):
                            cell_text = f"TZS {val:,.0f}"
                        else:
                            cell_text = str(val)
                        row_cells[i].text = cell_text
                        set_cell_margins(row_cells[i], top=80, bottom=80, left=120, right=120)
                        cell_p = row_cells[i].paragraphs[0]
                        cell_p.runs[0].font.size = Pt(8.5)
                        cell_p.runs[0].font.color.rgb = RGBColor(30, 41, 59)

                doc.add_paragraph().paragraph_format.space_after = Pt(14)

        elif sec_type == 'text':
            content = section.get('content', '')
            if content:
                p = doc.add_paragraph(content)
                p.paragraph_format.space_after = Pt(10)

    # Footer note
    footer = doc.sections[0].footer
    f_p = footer.paragraphs[0]
    f_p.text = f"{company_name} Confidential Report • Generated automatically via QuardCube Reporting Engine."
    f_p.runs[0].font.size = Pt(7.5)
    f_p.runs[0].font.color.rgb = RGBColor(148, 163, 184)

    output_buf = io.BytesIO()
    doc.save(output_buf)
    docx_bytes = output_buf.getvalue()
    output_buf.close()
    return docx_bytes
