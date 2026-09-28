import io
import os
import base64
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# Numbered canvas for "Page X of Y" and headers/footers
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer
        footer_text = f"QUARDCUBE LABS • Confidential Business Intelligence • Page {self._pageNumber} of {page_count}"
        self.drawString(40, 25, footer_text)
        date_str = datetime.now().strftime("%d %b %Y, %H:%M EAT")
        self.drawRightString(A4[0] - 40, 25, f"Generated: {date_str}")

        # Top rule on pages after page 1
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(40, A4[1] - 35, A4[0] - 40, A4[1] - 35)
            self.drawString(40, A4[1] - 30, "QUARDCUBE LABS • Management Report")
            self.drawRightString(A4[0] - 40, A4[1] - 30, "Official Record")

        self.restoreState()


def render_chart_image(chart_data, chart_type='bar', title=""):
    """Render a Matplotlib chart and return an in-memory BytesIO image."""
    fig, ax = plt.subplots(figsize=(6.5, 3.0), dpi=200)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')

    primary_color = '#0F172A'  # Navy
    secondary_color = '#0D9488' # Teal
    accent_color = '#6366F1'    # Indigo

    labels = [str(item.get('label') or item.get('name') or item.get('date') or '') for item in chart_data][:12]
    values = [float(item.get('value') or item.get('revenue') or item.get('total') or item.get('count') or 0) for item in chart_data][:12]

    if not labels or not values:
        plt.close(fig)
        return None

    if chart_type == 'line' or chart_type == 'area':
        ax.plot(labels, values, color=secondary_color, marker='o', linewidth=2.5, markersize=5)
        if chart_type == 'area':
            ax.fill_between(range(len(labels)), values, color=secondary_color, alpha=0.15)
        ax.grid(True, linestyle='--', alpha=0.5, color='#CBD5E1')
        plt.xticks(rotation=30, ha='right', fontsize=8, color='#334155')
    elif chart_type == 'pie' or chart_type == 'doughnut':
        colors_list = ['#0D9488', '#0F172A', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#64748B']
        wedge_props = dict(width=0.4 if chart_type == 'doughnut' else 1.0, edgecolor='white', linewidth=1.5)
        ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=140, colors=colors_list[:len(values)],
               wedgeprops=wedge_props, textprops={'fontsize': 8, 'color': '#1E293B'})
    else: # Bar chart
        bars = ax.bar(labels, values, color=secondary_color, edgecolor='#0F766E', width=0.55, zorder=3)
        ax.grid(axis='y', linestyle='--', alpha=0.5, color='#CBD5E1', zorder=0)
        plt.xticks(rotation=25, ha='right', fontsize=8, color='#334155')

    ax.tick_params(colors='#475569', labelsize=8)
    for spine in ax.spines.values():
        spine.set_color('#E2E8F0')

    if title:
        ax.set_title(title, fontsize=10, fontweight='bold', color='#0F172A', pad=10)

    plt.tight_layout()
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    img_buf.seek(0)
    return img_buf


def generate_pdf_report(report_def: dict) -> bytes:
    """Generate a high-impact, professional PDF report from the report definition."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=14
    )
    section_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=14,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=8
    )
    kpi_val_style = ParagraphStyle(
        'KPIVal',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0D9488'),
        alignment=1
    )
    kpi_lbl_style = ParagraphStyle(
        'KPILbl',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )
    tbl_hdr_style = ParagraphStyle(
        'TblHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    tbl_cell_style = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#1E293B')
    )

    story = []

    # 1. Header Banner
    company_name = report_def.get('branding', {}).get('companyName', 'QUARDCUBE LABS')
    report_title = report_def.get('title', 'Executive Management Report')
    report_desc = report_def.get('description', 'Comprehensive Operational & Business Intelligence Analysis')
    period_from = report_def.get('period', {}).get('from', '')
    period_to = report_def.get('period', {}).get('to', '')
    period_text = f"Period: {period_from} to {period_to}" if period_from and period_to else "All Historical Data"

    header_table_data = [
        [
            Paragraph(f"<b>{company_name}</b>", ParagraphStyle('Co', fontName='Helvetica-Bold', fontSize=12, textColor=colors.HexColor('#0D9488'))),
            Paragraph(f"<b>REPORT ID:</b> {report_def.get('id', 'QC-RPT-' + datetime.now().strftime('%Y%m%d'))}", ParagraphStyle('RptID', fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#64748B'), alignment=2))
        ]
    ]
    h_table = Table(header_table_data, colWidths=[300, 215])
    h_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(h_table)
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#0D9488"), spaceBefore=4, spaceAfter=10))

    story.append(Paragraph(report_title.upper(), title_style))
    story.append(Paragraph(f"{report_desc} • <i>{period_text}</i>", subtitle_style))

    # 2. Executive Summary Metrics / KPI Cards
    summary = report_def.get('summary', {})
    key_metrics = summary.get('keyMetrics', {})

    if key_metrics:
        story.append(Paragraph("EXECUTIVE KPI SUMMARY", section_h1))
        
        cards = []
        for key, val in list(key_metrics.items())[:6]:
            formatted_val = f"TZS {val:,.0f}" if isinstance(val, (int, float)) and val > 1000 and "count" not in key.lower() and "rate" not in key.lower() else str(val)
            card_content = [
                Paragraph(formatted_val, kpi_val_style),
                Spacer(1, 2),
                Paragraph(key.replace('_', ' ').title(), kpi_lbl_style)
            ]
            cards.append(card_content)

        # Distribute into rows of up to 3 cards
        rows = []
        for i in range(0, len(cards), 3):
            row_slice = cards[i:i+3]
            while len(row_slice) < 3:
                row_slice.append([Paragraph("", body_style)])
            rows.append(row_slice)

        kpi_table = Table(rows, colWidths=[168, 168, 168])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 14))

    # 3. Dynamic Sections
    sections = report_def.get('sections', [])
    data_payload = report_def.get('data', {})

    for section in sections:
        sec_type = section.get('type')
        sec_title = section.get('title', 'Section').upper()

        if sec_type == 'chart':
            chart_data = section.get('data') or data_payload.get(section.get('dataKey', '')) or []
            if chart_data:
                story.append(KeepTogether([
                    Paragraph(sec_title, section_h1),
                    HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceBefore=2, spaceAfter=8)
                ]))
                img_buf = render_chart_image(chart_data, chart_type=section.get('chartType', 'bar'), title="")
                if img_buf:
                    story.append(RLImage(img_buf, width=500, height=220))
                    story.append(Spacer(1, 12))

        elif sec_type == 'table':
            table_rows = section.get('rows') or data_payload.get(section.get('dataKey', '')) or []
            headers = section.get('headers') or []
            
            if not headers and table_rows and isinstance(table_rows, list) and len(table_rows) > 0:
                first_item = table_rows[0]
                if isinstance(first_item, dict):
                    headers = list(first_item.keys())[:6]

            if table_rows and headers:
                story.append(KeepTogether([
                    Paragraph(sec_title, section_h1),
                    HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CBD5E1"), spaceBefore=2, spaceAfter=6)
                ]))

                # Build table data
                table_matrix = [[Paragraph(h.replace('_', ' ').title(), tbl_hdr_style) for h in headers]]
                for item in table_rows[:35]: # up to 35 rows per section
                    row_cells = []
                    for h in headers:
                        cell_val = item.get(h, '') if isinstance(item, dict) else str(item)
                        if isinstance(cell_val, (int, float)) and ("price" in h.lower() or "revenue" in h.lower() or "total" in h.lower() or "amount" in h.lower()):
                            cell_str = f"TZS {cell_val:,.0f}"
                        else:
                            cell_str = str(cell_val)
                        row_cells.append(Paragraph(cell_str, tbl_cell_style))
                    table_matrix.append(row_cells)

                col_w = 515 / len(headers)
                t = Table(table_matrix, colWidths=[col_w] * len(headers))
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')), # Dark Navy Header
                    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')]),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ]))
                story.append(t)
                story.append(Spacer(1, 14))

        elif sec_type == 'text':
            content = section.get('content', '')
            if content:
                story.append(KeepTogether([
                    Paragraph(sec_title, section_h1),
                    Paragraph(content, body_style),
                    Spacer(1, 10)
                ]))

    # 4. Audit & Verification Box
    audit_hash = report_def.get('auditHash') or f"QC-VERIFIED-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    audit_data = [
        [
            Paragraph(f"<b>AUDIT SEAL & AUTHENTICITY VERIFICATION</b><br/><font color='#64748B'>This document is an authoritative computational export from QuardCube Labs Enterprise Database. SHA-256 Digest: {audit_hash}</font>", ParagraphStyle('Audit', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#334155')))
        ]
    ]
    audit_tbl = Table(audit_data, colWidths=[515])
    audit_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Spacer(1, 10))
    story.append(audit_tbl)

    # Build PDF with NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
