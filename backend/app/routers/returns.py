
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..tax.engine import compute_return_preview

router = APIRouter(prefix="/api/returns", tags=["returns"])

@router.get("/{tax_year}/preview")
def preview(tax_year: int, db: Session = Depends(get_db)):
    if tax_year < 2000 or tax_year > 2100:
        raise HTTPException(status_code=400, detail="Invalid tax year")
    return compute_return_preview(db=db, user_id=1, tax_year=tax_year)
