from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Integer, String, Float, DateTime, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class AIInsights(Base):
    __tablename__ = "ai_insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    forecast_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    risks: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default=list)
    opportunities: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default=list)
    recommendations: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=True, default=list)
    reasoning: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
