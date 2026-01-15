
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db, SessionLocal
from .models import User
from .routers import upload, returns

app = FastAPI(title="AgenticAI (Intuit-like)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id==1).first()
        if not user:
            db.add(User(id=1, email="demo@local", name="Demo User"))
            db.commit()
    finally:
        db.close()

app.include_router(upload.router)
app.include_router(returns.router)

@app.get("/health")
def health():
    return {"status":"ok"}
