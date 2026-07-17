from datetime import datetime
from sqlalchemy import Integer, String, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class DashboardCache(Base):
    __tablename__ = "dashboard_cache"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    dataset_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    total_revenue: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_spend: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    average_roas: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_conversions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    average_cpa: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    growth_percentage: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
