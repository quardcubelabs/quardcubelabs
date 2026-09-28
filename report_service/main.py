"""
QuardCube Labs - Report Generation Service (FastAPI)
Authoritative, configuration-driven rendering engine for PDF, DOCX, and XLSX business reports.
"""

import base64
import logging
import os
import sys
from typing import Any, Dict, Optional
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root report_service directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from generators.pdf_generator import generate_pdf_bytes
from generators.docx_generator import generate_docx_bytes
from generators.xlsx_generator import generate_xlsx_bytes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("report_service")

app = FastAPI(
    title="QuardCube Labs Report Service",
    description="Microservice responsible for document rendering (PDF, DOCX, XLSX) from structured JSON report payloads.",
    version="1.0.0"
)

# Enable CORS for Next.js app communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateReportRequest(BaseModel):
    report: Dict[str, Any] = Field(..., description="Prepared report structure containing branding, summary, charts, and tables.")
    format: str = Field(default="pdf", description="Requested export format: 'pdf', 'docx', or 'xlsx'")


class GenerateReportResponse(BaseModel):
    success: bool
    filename: str
    format: str
    mime_type: str
    file_base64: str
    file_size_bytes: int
    message: Optional[str] = None


@app.get("/health")
def health_check():
    """Health check endpoint for Next.js service discovery and readiness probes."""
    return {
        "status": "healthy",
        "service": "QuardCube Labs Report Engine",
        "version": "1.0.0",
        "supported_formats": ["pdf", "docx", "xlsx"]
    }


@app.post("/generate", response_model=GenerateReportResponse)
def generate_report(req: GenerateReportRequest):
    """
    Renders the provided report definition into the requested format (PDF, DOCX, XLSX).
    Returns Base64-encoded document bytes.
    """
    format_lower = req.format.lower().strip()
    report_data = req.report

    title = report_data.get("title", "QuardCube_Report").replace(" ", "_").replace("/", "-")
    period_from = report_data.get("period", {}).get("from", "")
    period_to = report_data.get("period", {}).get("to", "")
    date_str = f"_{period_from}_to_{period_to}" if period_from and period_to else ""

    logger.info(f"Generating {format_lower.upper()} report: '{report_data.get('title')}'")

    try:
        if format_lower == "pdf":
            file_bytes = generate_pdf_bytes(report_data)
            filename = f"{title}{date_str}.pdf"
            mime_type = "application/pdf"
        elif format_lower == "docx":
            file_bytes = generate_docx_bytes(report_data)
            filename = f"{title}{date_str}.docx"
            mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        elif format_lower == "xlsx":
            file_bytes = generate_xlsx_bytes(report_data)
            filename = f"{title}{date_str}.xlsx"
            mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format '{req.format}'. Must be one of: pdf, docx, xlsx."
            )

        base64_encoded = base64.b64encode(file_bytes).decode("utf-8")

        return GenerateReportResponse(
            success=True,
            filename=filename,
            format=format_lower,
            mime_type=mime_type,
            file_base64=base64_encoded,
            file_size_bytes=len(file_bytes),
            message="Report rendered successfully."
        )

    except Exception as e:
        logger.exception(f"Report rendering error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Report rendering failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting QuardCube Report Service on http://0.0.0.0:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
