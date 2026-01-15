
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_upload_and_preview():
    # Upload a text file that looks like a W2
    content = b"W2 2024\nWages 92000\nFederal income tax withheld 14500\n"
    files = {"file": ("w2_2024.txt", content, "text/plain")}
    r = client.post("/api/upload", files=files)
    assert r.status_code == 200
    j = r.json()
    assert j["doc_type"] == "W2"
    assert "extracted" in j

    r2 = client.get("/api/returns/2024/preview")
    assert r2.status_code == 200
    j2 = r2.json()
    assert j2["tax_year"] == 2024
    assert j2["summary"]["totalIncome"] >= 0
