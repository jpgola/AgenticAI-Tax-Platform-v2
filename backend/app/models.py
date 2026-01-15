
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    documents = relationship("Document", back_populates="user")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)  # W2, 1099NEC, 1099INT, 1099DIV, K1, UNKNOWN
    tax_year = Column(Integer, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    original_path = Column(String, nullable=True)

    user = relationship("User", back_populates="documents")
    extracted_data = relationship("ExtractedData", back_populates="document", uselist=False)

class ExtractedData(Base):
    __tablename__ = "extracted_data"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    raw_json = Column(JSON, nullable=False)
    confidence = Column(Float, default=0.0)
    document = relationship("Document", back_populates="extracted_data")
