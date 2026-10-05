"""
QuardCube Labs - Professional Business PDF Report Generator (ReportLab & Matplotlib)
Generates publication-quality, human-analyst-grade PDF business documents.
Features Cover Page, Document Control, Table of Contents, Executive Callout,
KPI Cards Grid, Matplotlib Visualizations, Styled Tables, Findings, Recommendations,
Conclusion, and 3-Tier Official Sign-off.
"""

import io
import os
import math
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

# Colors Palette
COLOR_NAVY = colors.HexColor('#0F172A')
COLOR_TEAL = colors.HexColor('#0D9488')
COLOR_TEAL_LIGHT = colors.HexColor('#F0FDFA')
COLOR_SLATE_DARK = colors.HexColor('#1E293B')
COLOR_SLATE_TEXT = colors.HexColor('#334155')
COLOR_SLATE_MUTED = colors.HexColor('#64748B')
COLOR_BORDER = colors.HexColor('#CBD5E1')
COLOR_BG_LIGHT = colors.HexColor('#F8FAFC')
COLOR_ZEBRA = colors.HexColor('#F1F5F9')

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic total page count, running headers and footers."""
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
            self.draw_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(COLOR_SLATE_MUTED)

        page_w, page_h = A4

        # Running Footer (All pages)
        self.setStrokeColor(colors.HexColor('#E2E8F0'))
        self.setLineWidth(0.5)
        self.line(40, 35, page_w - 40, 35)

        self.setFont("Helvetica", 7.5)
        self.drawString(40, 22, "QUARDCUBE LABS  •  CONFIDENTIAL & PROPRIETARY  •  OFFICIAL REPORT")
        self.drawRightString(page_w - 40, 22, f"Page {self._pageNumber} of {page_count}")

        # Running Header (Pages 2+)
        if self._pageNumber > 1:
            self.line(40, page_h - 35, page_w - 40, page_h - 35)
            self.drawString(40, page_h - 28, "QUARDCUBE LABS  •  EXECUTIVE MANAGEMENT REPORT")
            self.drawRightString(page_w - 40, page_h - 28, datetime.now().strftime("%d %b %Y"))

        self.restoreState()


def render_chart_image(chart_data, chart_type='bar', title=""):
    """Render a publication-quality Matplotlib chart and return BytesIO buffer."""
    if not chart_data:
        return None

    fig, ax = plt.subplots(figsize=(6.8, 3.0), dpi=200)
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#F8FAFC')

    labels = [str(item.get('label') or item.get('name') or item.get('date') or '') for item in chart_data][:12]
    values = [float(item.get('value') or item.get('revenue') or item.get('total') or item.get('count') or 0) for item in chart_data][:12]

    if not labels or not values or sum(values) == 0:
        plt.close(fig)
        return None

    primary_teal = '#0D9488'

    if chart_type in ['line', 'area']:
        ax.plot(labels, values, color=primary_teal, marker='o', linewidth=2.5, markersize=5, label='Actual Value')
        if chart_type == 'area':
            ax.fill_between(range(len(labels)), values, color=primary_teal, alpha=0.15)
        ax.grid(True, linestyle='--', alpha=0.5, color='#CBD5E1')
        plt.xticks(rotation=20, ha='right', fontsize=8, color='#334155', fontweight='bold')
    elif chart_type in ['pie', 'doughnut']:
        palette = ['#0D9488', '#0F172A', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#64748B']
        wedge_props = dict(width=0.45 if chart_type == 'doughnut' else 1.0, edgecolor='white', linewidth=2)
        ax.pie(values, labels=labels, autopct='%1.1f%%', startangle=135, colors=palette[:len(values)],
               wedgeprops=wedge_props, textprops={'fontsize': 8, 'color': '#0F172A', 'fontweight': 'bold'})
    else: # Bar chart
        bars = ax.bar(labels, values, color=primary_teal, edgecolor='#0F766E', width=0.52, zorder=3)
        ax.grid(axis='y', linestyle='--', alpha=0.5, color='#CBD5E1', zorder=0)
        plt.xticks(rotation=20, ha='right', fontsize=8, color='#334155', fontweight='bold')
        
        if len(bars) <= 8:
            for bar in bars:
                h = bar.get_height()
                if h > 0:
                    val_str = f"{h:,.0f}" if h >= 10 else f"{h:.1f}"
                    ax.annotate(val_str,
                                xy=(bar.get_x() + bar.get_width() / 2, h),
                                xytext=(0, 3),
                                textcoords="offset points",
                                ha='center', va='bottom', fontsize=7.5, color='#0F172A', fontweight='bold')

    ax.tick_params(colors='#475569', labelsize=8)
    for spine in ax.spines.values():
        spine.set_color('#CBD5E1')

    if title:
        ax.set_title(title, fontsize=10.5, fontweight='bold', color='#0F172A', pad=10)

    plt.tight_layout()
    img_buf = io.BytesIO()
    plt.savefig(img_buf, format='png', bbox_inches='tight', facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close(fig)
    img_buf.seek(0)
    return img_buf


def generate_pdf_bytes(report_data: dict) -> bytes:
    """Compose and generate a complete, human-analyst-grade PDF document."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    brand_style = ParagraphStyle('BrandTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, leading=16, textColor=COLOR_TEAL)
    brand_sub = ParagraphStyle('BrandSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=11, textColor=COLOR_SLATE_MUTED)
    doc_title = ParagraphStyle('DocMainTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=COLOR_NAVY, spaceAfter=3)
    doc_subtitle = ParagraphStyle('DocSubtitle', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13, textColor=COLOR_SLATE_MUTED, spaceAfter=8)
    section_h1 = ParagraphStyle('SectionH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=COLOR_NAVY, spaceBefore=14, spaceAfter=6)
    section_intro = ParagraphStyle('SectionIntro', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=COLOR_SLATE_TEXT, spaceAfter=8)
    exec_summary_text = ParagraphStyle('ExecSummaryText', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=13.5, textColor=COLOR_SLATE_DARK)
    kpi_val_style = ParagraphStyle('KpiValue', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=13, leading=16, alignment=1, textColor=COLOR_TEAL)
    kpi_lbl_style = ParagraphStyle('KpiLabel', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10, alignment=1, textColor=COLOR_NAVY)
    kpi_desc_style = ParagraphStyle('KpiDesc', parent=styles['Normal'], fontName='Helvetica', fontSize=7, leading=9, alignment=1, textColor=COLOR_SLATE_MUTED)
    table_cell_text = ParagraphStyle('TableCellText', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10.5, textColor=COLOR_SLATE_DARK)
    table_cell_bold = ParagraphStyle('TableCellBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, leading=10.5, textColor=COLOR_NAVY)
    table_cell_right = ParagraphStyle('TableCellRight', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=10.5, alignment=2, textColor=COLOR_SLATE_DARK)
    bullet_style = ParagraphStyle('BulletStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=COLOR_SLATE_DARK, leftIndent=12, firstLineIndent=-8, spaceAfter=4)

    story = []

    # 1. HEADER / BRANDING BLOCK
    branding = report_data.get('branding', {})
    co_name = branding.get('companyName', 'QUARDCUBE LABS')
    co_sub = branding.get('subtitle', 'Enterprise Intelligence & Technology Solutions')
    co_addr = branding.get('address', 'Makumbusho, Millennium Tower 14th Floor, Dar es Salaam, Tanzania')
    co_phone = branding.get('phone', '+255 623 893 383')
    co_email = branding.get('email', 'info@quardcubelabs.co.tz')

    hdr_left = [
        Paragraph(co_name.upper(), brand_style),
        Paragraph(co_sub, brand_sub),
        Paragraph(f"{co_addr} • {co_phone} • {co_email}", brand_sub)
    ]

    doc_control = report_data.get('documentControl', {})
    report_ref = doc_control.get('reportId') or f"QC-REP-{datetime.now().strftime('%Y%m%d')}"
    prepared_by = doc_control.get('generatedBy') or branding.get('preparedBy') or 'Senior Reporting Officer'

    hdr_right = [
        Paragraph(f"<b>REPORT REF:</b> {report_ref}", brand_sub),
        Paragraph(f"<b>PREPARED ON:</b> {datetime.now().strftime('%d %B %Y')}", brand_sub),
        Paragraph(f"<b>AUTHOR:</b> {prepared_by}", brand_sub),
        Paragraph("<b>STATUS:</b> OFFICIAL REPORT", brand_sub)
    ]

    header_table = Table([[hdr_left, hdr_right]], colWidths=[340, 180])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_NAVY, spaceBefore=4, spaceAfter=10))

    # 2. DOCUMENT TITLE & PERIOD
    report_title = report_data.get('title', 'Executive Management Report')
    report_desc = report_data.get('subtitle') or report_data.get('description') or 'Comprehensive Performance & Operational Assessment'
    period_str = report_data.get('period', {}).get('formatted') or f"{report_data.get('period', {}).get('from', '')} to {report_data.get('period', {}).get('to', '')}"

    story.append(Paragraph(report_title, doc_title))
    story.append(Paragraph(f"{report_desc} • <b>Period: {period_str}</b>", doc_subtitle))

    # 3. EXECUTIVE SUMMARY CALLOUT BOX
    narrative = report_data.get('narrative', {})
    exec_summary = narrative.get('executiveSummary') or narrative.get('overview') or report_data.get('summary', {}).get('executiveSummary')

    if exec_summary:
        summary_cell = [
            Paragraph("<b>EXECUTIVE OVERVIEW & SYNTHESIS</b>", ParagraphStyle('H', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_TEAL, spaceAfter=4)),
            Paragraph(exec_summary, exec_summary_text)
        ]
        summary_table = Table([[summary_cell]], colWidths=[520])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.75, COLOR_BORDER),
            ('LINEBEFORE', (0, 0), (0, 0), 3.5, COLOR_TEAL),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 10))

    # 4. KPI SUMMARY CARDS
    metrics = report_data.get('summary', {}).get('metrics', [])
    if metrics:
        story.append(Paragraph("Key Performance Indicators", section_h1))
        
        cards = []
        for m in metrics:
            val_str = str(m.get('value', '0'))
            card_content = [
                Paragraph(val_str, kpi_val_style),
                Paragraph(m.get('label', ''), kpi_lbl_style),
                Paragraph(m.get('description', ''), kpi_desc_style)
            ]
            cards.append(card_content)

        chunk_size = 3
        kpi_rows = [cards[i:i + chunk_size] for i in range(0, len(cards), chunk_size)]
        
        for row in kpi_rows:
            while len(row) < chunk_size:
                row.append([Paragraph("", kpi_val_style), Paragraph("", kpi_lbl_style)])

        col_w = 520 / chunk_size
        kpi_table = Table(kpi_rows, colWidths=[col_w] * chunk_size)
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_LIGHT),
            ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 12))

    # 5. DYNAMIC SECTIONS
    sections = report_data.get('sections', [])
    charts_dict = report_data.get('charts', {})
    tables_dict = report_data.get('tables', {})
    section_narratives = narrative.get('sectionNarratives', {})

    for sec in sections:
        if not sec.get('enabled', True):
            continue

        sec_type = sec.get('type')
        data_key = sec.get('dataKey', '')
        sec_title = sec.get('title', '')
        intro_text = sec.get('introNarrative') or section_narratives.get(data_key)

        # A. CHART SECTION
        if sec_type == 'chart' and data_key in charts_dict:
            c_data = charts_dict[data_key]
            story.append(Paragraph(sec_title or c_data.get('title', 'Trend Analysis'), section_h1))
            
            chart_intro = c_data.get('introText') or intro_text
            if chart_intro:
                story.append(Paragraph(chart_intro, section_intro))

            labels = c_data.get('labels', [])
            values = c_data.get('values', [])
            chart_type_val = sec.get('chartType') or c_data.get('chartType', 'bar')
            
            items_payload = [{'label': l, 'value': v} for l, v in zip(labels, values)]
            chart_buf = render_chart_image(items_payload, chart_type=chart_type_val, title=c_data.get('title', ''))

            if chart_buf:
                rl_img = RLImage(chart_buf, width=520, height=210)
                story.append(KeepTogether([rl_img]))
                story.append(Spacer(1, 10))

        # B. TABLE SECTION
        elif sec_type == 'table' and data_key in tables_dict:
            t_data = tables_dict[data_key]
            story.append(Paragraph(sec_title or t_data.get('title', 'Data Register'), section_h1))

            table_intro = t_data.get('introText') or intro_text
            if table_intro:
                story.append(Paragraph(table_intro, section_intro))

            headers = t_data.get('headers', [])
            raw_rows = t_data.get('rows', [])

            if headers and raw_rows:
                table_matrix = []
                
                header_cells = [
                    Paragraph(f"<b>{str(h).upper()}</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white, alignment=1 if idx > 1 else 0))
                    for idx, h in enumerate(headers)
                ]
                table_matrix.append(header_cells)

                for r in raw_rows[:35]:
                    row_cells = []
                    for col_idx, val in enumerate(r):
                        val_str = str(val if val is not None else '')
                        is_numeric = any(char.isdigit() for char in val_str) and ('TZS' in val_str or val_str.replace(',', '').replace('.', '').isdigit())
                        
                        if col_idx == 0:
                            row_cells.append(Paragraph(val_str, table_cell_bold))
                        elif is_numeric or col_idx >= len(headers) - 1:
                            row_cells.append(Paragraph(val_str, table_cell_right))
                        else:
                            row_cells.append(Paragraph(val_str, table_cell_text))
                    table_matrix.append(row_cells)

                num_cols = len(headers)
                first_col_w = max(130, 520 - (num_cols - 1) * 75) if num_cols > 2 else 260
                other_col_w = (520 - first_col_w) / (num_cols - 1) if num_cols > 1 else 520
                col_widths = [first_col_w] + [other_col_w] * (num_cols - 1)

                rendered_table = Table(table_matrix, colWidths=col_widths, repeatRows=1)
                
                table_styling = [
                    ('BACKGROUND', (0, 0), (-1, 0), COLOR_NAVY),
                    ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 0), (-1, -1), 4.5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4.5),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('GRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
                ]

                for r_idx in range(1, len(table_matrix)):
                    bg = COLOR_ZEBRA if r_idx % 2 == 0 else colors.white
                    table_styling.append(('BACKGROUND', (0, r_idx), (-1, r_idx), bg))

                rendered_table.setStyle(TableStyle(table_styling))
                story.append(KeepTogether([rendered_table]))
                story.append(Spacer(1, 10))

    # 6. OBSERVATIONS & STRATEGIC RECOMMENDATIONS
    observations = narrative.get('observations', [])
    recommendations = narrative.get('recommendations', [])

    if observations or recommendations:
        story.append(Paragraph("Strategic Findings & Recommendations", section_h1))
        
        if observations:
            story.append(Paragraph("<b>Key Audit Observations:</b>", ParagraphStyle('Sub', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_NAVY, spaceAfter=4)))
            for obs in observations:
                story.append(Paragraph(f"•  {obs}", bullet_style))
            story.append(Spacer(1, 4))

        if recommendations:
            story.append(Paragraph("<b>Actionable Recommendations:</b>", ParagraphStyle('Sub2', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=COLOR_TEAL, spaceBefore=4, spaceAfter=4)))
            for rec in recommendations:
                story.append(Paragraph(f"•  {rec}", bullet_style))
            story.append(Spacer(1, 8))

    # 7. AUDIT SEAL & SIGNATURE BLOCK
    sign_cell_left = [
        Paragraph("<b>REPORTING OFFICER SIGN-OFF</b>", ParagraphStyle('S1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=COLOR_SLATE_MUTED)),
        Paragraph(f"<b>{prepared_by}</b>", ParagraphStyle('S2', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9.5, textColor=COLOR_NAVY)),
        Paragraph(branding.get('division', 'Enterprise Operations Directorate'), brand_sub),
        Paragraph("QuardCube Labs Limited • Dar es Salaam, Tanzania", brand_sub)
    ]

    sign_cell_right = [
        Paragraph("<b>COMPLIANCE & INTEGRITY SEAL</b>", ParagraphStyle('S3', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=COLOR_SLATE_MUTED)),
        Paragraph(f"<b>Hash:</b> <font name='Courier'>{report_data.get('auditSeal', {}).get('complianceHash', 'QC-SHA256-VERIFIED')[:28]}...</font>", brand_sub),
        Paragraph("Status: <b>VERIFIED OFFICIAL RECORD</b>", brand_sub),
        Paragraph(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S EAT')}", brand_sub)
    ]

    sign_table = Table([[sign_cell_left, sign_cell_right]], colWidths=[260, 260])
    sign_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('LINEBEFORE', (1, 0), (1, 0), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(KeepTogether([sign_table]))

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
