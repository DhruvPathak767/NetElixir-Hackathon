"""
scenario_history.py — Scenario History API Router
===================================================
Provides user-authenticated endpoints to list, create, delete, and manage persistent
Scenario Simulations and Optimizer allocations. All query logs are strictly user-isolated.
"""
import logging
from typing import Optional, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.history import ScenarioHistory

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scenario-history", tags=["Scenario History"])


class ScenarioHistoryCreate(BaseModel):
    scenario_name: str
    scenario_type: str  # "simulation", "comparison", "optimization", "forecast"
    input_parameters: dict
    predicted_revenue: Optional[float] = 0.0
    predicted_roas: Optional[float] = 0.0
    estimated_profit: Optional[float] = 0.0
    recommendation: Optional[str] = None


class ScenarioHistoryResponse(BaseModel):
    id: int
    scenario_name: str
    scenario_type: str
    input_parameters: dict
    predicted_revenue: float
    predicted_roas: float
    estimated_profit: float
    recommendation: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post(
    "",
    response_model=ScenarioHistoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a scenario run to history"
)
async def create_scenario_run(
    payload: ScenarioHistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        run = ScenarioHistory(
            user_id=current_user.id,
            scenario_name=payload.scenario_name,
            scenario_type=payload.scenario_type,
            input_parameters=payload.input_parameters,
            predicted_revenue=payload.predicted_revenue,
            predicted_roas=payload.predicted_roas,
            estimated_profit=payload.estimated_profit,
            recommendation=payload.recommendation
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return run
    except Exception as exc:
        db.rollback()
        logger.error("Failed to save scenario to history: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save scenario history: {str(exc)}"
        )


@router.get(
    "",
    summary="Get user scenario history logs"
)
async def get_scenario_history(
    search: Optional[str] = Query(None, description="Search by scenario name"),
    type: Optional[str] = Query(None, description="Filter by type (simulation, optimization, etc.)"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        query = db.query(ScenarioHistory).filter(ScenarioHistory.user_id == current_user.id)
        if search:
            query = query.filter(ScenarioHistory.scenario_name.ilike(f"%{search}%"))
        if type:
            query = query.filter(ScenarioHistory.scenario_type == type)

        # Newest first
        query = query.order_by(desc(ScenarioHistory.created_at))

        total = query.count()
        start = (page - 1) * limit
        items = query.offset(start).limit(limit).all()
        pages = max(1, (total + limit - 1) // limit)

        return {
            "success": True,
            "data": {
                "items": [ScenarioHistoryResponse.model_validate(i) for i in items],
                "total": total,
                "page": page,
                "pages": pages
            }
        }
    except Exception as exc:
        logger.error("Failed to list scenario history: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


@router.delete(
    "/{scenario_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a scenario history log"
)
async def delete_scenario_run(
    scenario_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        run = db.query(ScenarioHistory).filter(
            ScenarioHistory.id == scenario_id,
            ScenarioHistory.user_id == current_user.id
        ).first()

        if not run:
            raise HTTPException(status_code=404, detail="Scenario log not found or access denied.")

        db.delete(run)
        db.commit()
        return {"success": True, "message": "Scenario history log deleted successfully"}
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        logger.error("Failed to delete scenario history: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
