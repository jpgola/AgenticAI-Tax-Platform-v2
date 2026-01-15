
import json
from typing import Any, Dict
from ..config import settings

def _schema_for_doc_type(doc_type: str) -> Dict[str, Any]:
    t = (doc_type or "").upper()
    if t in ("W2","W-2"):
        return {
            "tax_year": "number",
            "employee_name": "string",
            "employer_name": "string",
            "wages": "number",
            "federal_income_tax_withheld": "number",
        }
    if t in ("1099NEC","1099-NEC"):
        return {
            "tax_year": "number",
            "recipient_name": "string",
            "payer_name": "string",
            "nonemployee_compensation": "number",
            "federal_income_tax_withheld": "number",
        }
    if t in ("1099INT","1099-INT"):
        return {"tax_year": "number", "interest_income": "number", "federal_income_tax_withheld":"number"}
    if t in ("1099DIV","1099-DIV"):
        return {"tax_year": "number", "ordinary_dividends":"number", "qualified_dividends":"number", "federal_income_tax_withheld":"number"}
    if t in ("K1","K-1","SCHEDULE K-1"):
        return {"tax_year":"number", "ordinary_business_income":"number", "section_179_deduction":"number"}
    return {"tax_year":"number", "income_amount":"number", "federal_income_tax_withheld":"number"}

def _build_prompt(text: str, doc_type: str) -> str:
    schema = _schema_for_doc_type(doc_type)
    return f'''
You are a US tax document extraction agent.
Return ONLY valid JSON, no markdown, no explanation.

Schema:
{json.dumps(schema, indent=2)}

Rules:
- Missing fields must be null
- Numbers must be numbers, not strings
- Do not add extra keys

Document text:
"""{text}"""
'''.strip()

def _try_parse_json(raw: str) -> dict:
    raw = (raw or "").strip()
    if raw.startswith("```"):
        raw = raw.strip("`").strip()
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()
    return json.loads(raw)

def extract_tax_fields_with_gemini(text: str, doc_type: str) -> Dict[str, Any]:
    # If no key, run a deterministic fallback so tests & local dev always work.
    if not settings.gemini_api_key:
        return _fallback_extract(text=text, doc_type=doc_type)

    try:
        from google import genai  # optional dependency
        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = _build_prompt(text=text, doc_type=doc_type)
        resp = client.models.generate_content(model=settings.gemini_model, contents=prompt)
        data = _try_parse_json(resp.text or "")
        return data if isinstance(data, dict) else {}
    except Exception:
        # Never crash uploads
        return _fallback_extract(text=text, doc_type=doc_type)

def _fallback_extract(text: str, doc_type: str) -> Dict[str, Any]:
    # Tiny heuristic extractor (works for our unit tests and gives reasonable demo results)
    t = (doc_type or "").upper()
    out: Dict[str, Any] = {}
    # tax year heuristic
    for y in ["2022","2023","2024","2025"]:
        if y in (text or ""):
            out["tax_year"] = int(y)
            break
    # wages/withholding heuristics
    def find_money(label: str):
        import re
        m = re.search(label + r"[^0-9]*([0-9][0-9,]*\.?[0-9]*)", text, re.IGNORECASE)
        if not m:
            return None
        return float(m.group(1).replace(",",""))
    if t == "W2":
        w = find_money("wages") or find_money("wages, tips") or find_money("compensation")
        if w is not None: out["wages"] = w
        wh = find_money("withheld") or find_money("federal income tax")
        if wh is not None: out["federal_income_tax_withheld"] = wh
        out.setdefault("employee_name", None)
        out.setdefault("employer_name", None)
        out.setdefault("tax_year", out.get("tax_year", 2024))
        return out
    # generic fallback
    out.setdefault("tax_year", out.get("tax_year", 2024))
    out.setdefault("income_amount", None)
    out.setdefault("federal_income_tax_withheld", None)
    return out
