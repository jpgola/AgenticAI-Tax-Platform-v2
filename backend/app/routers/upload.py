
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional

from ..db import get_db
from ..models import Document, ExtractedData
from ..ai.ocr import smart_extract_text
from ..ai.gemini_extractor import extract_tax_fields_with_gemini

router = APIRouter(prefix="/api", tags=["upload"])

def _infer_doc_type_from_filename(filename: str) -> str:
    name = (filename or "").lower()
    if "w2" in name or "w-2" in name: return "W2"
    if "nec" in name: return "1099NEC"
    if "div" in name: return "1099DIV"
    if "int" in name: return "1099INT"
    if "k1" in name or "k-1" in name: return "K1"
    return "UNKNOWN"

def _expected_fields(doc_type: str) -> List[str]:
    t = (doc_type or "").upper()
    if t == "W2": return ["tax_year","wages","federal_income_tax_withheld"]
    if t in ("1099NEC","1099-NEC"): return ["tax_year","nonemployee_compensation"]
    if t in ("1099INT","1099-INT"): return ["tax_year","interest_income"]
    if t in ("1099DIV","1099-DIV"): return ["tax_year","ordinary_dividends"]
    if t in ("K1","K-1","SCHEDULE K-1"): return ["tax_year","ordinary_business_income"]
    return ["tax_year"]

def _confidence(doc_type: str, extracted: Dict[str, Any]) -> float:
    exp = _expected_fields(doc_type)
    if not exp: return 0.5
    filled = 0
    for f in exp:
        v = extracted.get(f)
        if v is None: continue
        if isinstance(v,str) and not v.strip(): continue
        filled += 1
    return max(0.0, min(1.0, filled/len(exp)))

def _tax_year(extracted: Dict[str, Any]) -> Optional[int]:
    for k in ("tax_year","year","taxYear"):
        if extracted.get(k) is not None:
            try: return int(extracted[k])
            except Exception: pass
    return None

@router.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File must have a filename")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    doc_type = _infer_doc_type_from_filename(file.filename)
    text = smart_extract_text(file.filename, content)
    extracted = extract_tax_fields_with_gemini(text=text, doc_type=doc_type) or {}
    conf = _confidence(doc_type, extracted)
    year = _tax_year(extracted) or 2024  # default for demo

    document = Document(user_id=1, filename=file.filename, doc_type=doc_type, tax_year=year)
    db.add(document)
    db.flush()

    extracted_row = ExtractedData(document_id=document.id, raw_json=extracted, confidence=conf)
    db.add(extracted_row)
    db.commit()
    db.refresh(document)
    db.refresh(extracted_row)

    return {"document_id": document.id, "doc_type": document.doc_type, "extracted": extracted_row.raw_json, "confidence": extracted_row.confidence}
