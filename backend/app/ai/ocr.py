
import io
try:
    import fitz  # PyMuPDF
except Exception:
    fitz = None

try:
    from PIL import Image
    import pytesseract
except Exception:
    Image = None
    pytesseract = None

def extract_text_from_pdf(data: bytes) -> str:
    if not data:
        return ""
    if fitz is None:
        try:
            return data.decode(errors="ignore")
        except Exception:
            return ""
    try:
        chunks = []
        with fitz.open(stream=data, filetype="pdf") as doc:
            for page in doc:
                chunks.append(page.get_text())
        return "\n".join(chunks)
    except Exception:
        try:
            return data.decode(errors="ignore")
        except Exception:
            return ""

def extract_text_from_image(data: bytes) -> str:
    if not data or Image is None or pytesseract is None:
        return ""
    try:
        img = Image.open(io.BytesIO(data))
        return pytesseract.image_to_string(img)
    except Exception:
        return ""

def smart_extract_text(filename: str, data: bytes) -> str:
    name = (filename or "").lower()
    if name.endswith(".pdf"):
        return extract_text_from_pdf(data)
    if any(name.endswith(ext) for ext in [".png",".jpg",".jpeg",".tif",".tiff",".bmp",".gif"]):
        return extract_text_from_image(data)
    try:
        return data.decode(errors="ignore")
    except Exception:
        return ""
