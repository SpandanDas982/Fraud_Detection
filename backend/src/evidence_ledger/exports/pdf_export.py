"""
ReportLab PDF export generator for Evidence Ledger.

Conforms to AGENTS.md, PROJECT.md, and DATA_CONTRACTS.md:
- Clear, readable, professional typography and layout.
- Strictly neutral language: "candidate observations", "source claims", "discrepancies".
- NO guilt language, NO verdicts, NO fraud risk probability calculation.
- Preserves both conflicting claims in discrepancy tables.
"""

from __future__ import annotations

import io
from datetime import UTC, datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from evidence_ledger.contracts.models import (
    CaseSummary,
    Flag,
    Observation,
    Source,
)
from evidence_ledger.privacy.masking import (
    CaseAliasRegistry,
)


def generate_pdf_report(
    case: CaseSummary,
    sources: list[Source],
    observations: list[Observation],
    flags: list[Flag],
    alias_registry: CaseAliasRegistry | None = None,
) -> bytes:
    """
    Generates a formal, neutral Evidence Ledger PDF document.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),  # Midnight Slate
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=12,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "DocBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    notice_style = ParagraphStyle(
        "NoticeBody",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
    )
    th_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.white,
    )
    td_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#1e293b"),
    )

    elements = []

    # Title & Subtitle
    elements.append(Paragraph("EVIDENCE LEDGER — EVIDENCE PACKET", title_style))
    elements.append(
        Paragraph(
            f"Case Reference: {case.safe_title} ({case.case_id}) | Generated: {datetime.now(UTC).strftime('%Y-%m-%d %H:%M UTC')}",
            subtitle_style,
        )
    )
    elements.append(Spacer(1, 8))

    # Neutrality Notice
    disclaimer_box = [
        [
            Paragraph(
                "<b>NEUTRAL SYSTEM NOTICE:</b> This document compiles candidate observations extracted from synthetic/submitted evidence records for human review. "
                "The system does not determine that fraud occurred, assign guilt or legal liability, score risk probability, or authenticate documents.",
                notice_style,
            )
        ]
    ]
    notice_table = Table(disclaimer_box, colWidths=[540])
    notice_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    elements.append(notice_table)
    elements.append(Spacer(1, 10))

    # SECTION 1: Case Summary
    elements.append(Paragraph("1. Case Overview", heading_style))
    summary_data = [
        [
            Paragraph("<b>Case ID:</b>", body_style),
            Paragraph(case.case_id, body_style),
            Paragraph("<b>Status:</b>", body_style),
            Paragraph(case.status.value.upper(), body_style),
        ],
        [
            Paragraph("<b>Total Sources:</b>", body_style),
            Paragraph(str(len(sources)), body_style),
            Paragraph("<b>Observations:</b>", body_style),
            Paragraph(str(len(observations)), body_style),
        ],
        [
            Paragraph("<b>Active Flags:</b>", body_style),
            Paragraph(str(len(flags)), body_style),
            Paragraph("<b>Mode:</b>", body_style),
            Paragraph(case.mode.value.upper(), body_style),
        ],
    ]
    summary_table = Table(summary_data, colWidths=[100, 170, 100, 170])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 12))

    # SECTION 2: Sources Inventory
    elements.append(Paragraph("2. Sources Inventory", heading_style))
    source_rows = [
        [
            Paragraph("Source ID", th_style),
            Paragraph("Media Type", th_style),
            Paragraph("Filename", th_style),
            Paragraph("SHA-256 Digest", th_style),
            Paragraph("Status", th_style),
        ]
    ]
    for s in sources:
        digest_display = (s.sha256[:12] + "…") if s.sha256 else "—"
        source_rows.append(
            [
                Paragraph(s.source_id, td_style),
                Paragraph(s.media_type.value, td_style),
                Paragraph(s.safe_filename, td_style),
                Paragraph(digest_display, td_style),
                Paragraph(s.status.value, td_style),
            ]
        )
    source_table = Table(source_rows, colWidths=[70, 65, 185, 130, 90])
    source_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(source_table)
    elements.append(Spacer(1, 12))

    # SECTION 3: Timeline & Chronology
    elements.append(Paragraph("3. Extracted Timeline & Observations", heading_style))
    timeline_rows = [
        [
            Paragraph("Obs ID", th_style),
            Paragraph("Claimed Time", th_style),
            Paragraph("Event Type", th_style),
            Paragraph("Amount / Currency", th_style),
            Paragraph("Review State", th_style),
        ]
    ]

    for o in observations:
        tc = o.time_claim
        time_display = "Undated"
        if tc and tc.earliest:
            time_display = tc.earliest.strftime("%Y-%m-%d %H:%M")
        elif tc and tc.raw:
            time_display = f"{tc.raw} (Uncertain)"

        amt_f = o.fields.get("amount")
        amt_str = (amt_f.reviewed_value or amt_f.normalized_candidate_value or "") if amt_f else "—"
        curr_f = o.fields.get("currency")
        curr_str = (
            (curr_f.reviewed_value or curr_f.normalized_candidate_value or "") if curr_f else ""
        )
        money_disp = f"{curr_str} {amt_str}".strip() or "—"

        timeline_rows.append(
            [
                Paragraph(o.observation_id, td_style),
                Paragraph(time_display, td_style),
                Paragraph(o.event_type, td_style),
                Paragraph(money_disp, td_style),
                Paragraph(o.review_status.value, td_style),
            ]
        )

    timeline_table = Table(timeline_rows, colWidths=[70, 120, 140, 110, 100])
    timeline_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(timeline_table)
    elements.append(Spacer(1, 12))

    # SECTION 4: Inconsistencies & Flags
    elements.append(Paragraph("4. Data Quality Flags & Discrepancies", heading_style))
    if flags:
        flag_rows = [
            [
                Paragraph("Flag ID", th_style),
                Paragraph("Category", th_style),
                Paragraph("Explanation / Discrepancy", th_style),
                Paragraph("State", th_style),
            ]
        ]
        for f in flags:
            flag_rows.append(
                [
                    Paragraph(f.flag_id, td_style),
                    Paragraph(f.category.value, td_style),
                    Paragraph(f.explanation, td_style),
                    Paragraph(f.state.value, td_style),
                ]
            )
        flag_table = Table(flag_rows, colWidths=[70, 95, 295, 80])
        flag_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#475569")),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.HexColor("#f8fafc")],
                    ),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(flag_table)
    else:
        elements.append(
            Paragraph("No open flags or discrepancies identified in this packet.", body_style)
        )

    doc.build(elements)
    return buffer.getvalue()
