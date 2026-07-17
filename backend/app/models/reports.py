from datetime import datetime
from sqlalchemy import Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    forecast_id: Mapped[str] = mapped_column(String, index=True, nullable=True)
    report_name: Mapped[str] = mapped_column(String, nullable=False)
    report_type: Mapped[str] = mapped_column(String, nullable=False)  # e.g., pdf, xlsx
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=True, index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
