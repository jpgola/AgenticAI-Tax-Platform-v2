
from typing import Any, Dict, List
from sqlalchemy.orm import Session
from ..models import Document

def _safe_num(v: Any) -> float:
    try:
        if v is None: return 0.0
        return float(v)
    except Exception:
        return 0.0

def compute_return_preview(db: Session, user_id: int, tax_year: int) -> Dict[str, Any]:
    docs: List[Document] = db.query(Document).filter(Document.user_id==user_id, Document.tax_year==tax_year).all()
    total_income = 0.0
    withholding = 0.0
    wages = 0.0
    for d in docs:
        payload = d.extracted_data.raw_json if d.extracted_data and d.extracted_data.raw_json else {}
        dt = (d.doc_type or "").upper()
        if dt == "W2":
            w = _safe_num(payload.get("wages"))
            wages += w
            total_income += w
            withholding += _safe_num(payload.get("federal_income_tax_withheld"))
        elif dt in ("1099NEC","1099-NEC"):
            total_income += _safe_num(payload.get("nonemployee_compensation"))
            withholding += _safe_num(payload.get("federal_income_tax_withheld"))
        elif dt in ("1099INT","1099-INT"):
            total_income += _safe_num(payload.get("interest_income"))
            withholding += _safe_num(payload.get("federal_income_tax_withheld"))
        elif dt in ("1099DIV","1099-DIV"):
            total_income += _safe_num(payload.get("ordinary_dividends"))
            withholding += _safe_num(payload.get("federal_income_tax_withheld"))
        elif dt in ("K1","K-1","SCHEDULE K-1"):
            total_income += _safe_num(payload.get("ordinary_business_income"))

    standard_deduction = 14600.0
    taxable = max(total_income - standard_deduction, 0.0)
    estimated_tax = taxable * 0.22
    estimated_refund = max(withholding - estimated_tax, 0.0)

    summary = {
        "totalIncome": round(total_income, 2),
        "deductions": round(standard_deduction, 2),
        "estimatedTax": round(estimated_tax, 2),
        "estimatedRefund": round(estimated_refund, 2),
        "filingStatus": "In Progress" if docs else "Not Started",
        "complianceScore": 80 if docs else 50,
        "incomeBreakdown": [
            {"name":"W-2 Wages","value": round(wages,2), "color":"#3b82f6"}
        ] if wages>0 else [],
        "deductionBreakdown": [
            {"name":"Standard Deduction","value": standard_deduction, "color":"#10b981"}
        ],
    }

    return {"tax_year": tax_year, "summary": summary, "documents":[
        {"document_id": d.id, "doc_type": d.doc_type, "extracted": (d.extracted_data.raw_json if d.extracted_data else {}), "confidence": (d.extracted_data.confidence if d.extracted_data else 0.0), "filename": d.filename}
        for d in docs
    ], "message":"Preview only. Not tax advice."}
