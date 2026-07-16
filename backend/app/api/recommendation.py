import logging
from typing import Any, Optional
from fastapi import APIRouter, HTTPException, Query, status, Depends

from app.schemas.recommendation_schema import AIRecommendationsResponse, RecommendationHistoryItem
from app.services import recommendation_service
from app.dependencies import get_current_user
from app.models.user import User
from app.core.user_paths import UserPaths

logger = logging.getLogger(__name__)

# Primary Router (Backward Compatibility)
router = APIRouter(prefix="/ai-recommendations", tags=["AI Recommendations"])

# Alternative Router (Requested Endpoint Style)
router_override = APIRouter(prefix="/ai/recommendations", tags=["AI Recommendations Override"])


async def handle_get_recommendations(
    current_user: User,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    action: Optional[str] = None,
    implementation: Optional[str] = None,
    search: Optional[str] = None
) -> dict[str, Any]:
    logger.info("AI Recommendations handler triggered.")
    try:
        paths = UserPaths(current_user.id)
        result = recommendation_service.generate_recommendations(
            priority=priority,
            category=category,
            action=action,
            implementation=implementation,
            search=search,
            paths=paths
        )
        return result
        
    except FileNotFoundError as exc:
        logger.error("AI Recommendations generation failed — features or metrics missing: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc)
        )
        
    except Exception as exc:
        logger.error("AI Recommendations generation failed — execution error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendations generation failed: {str(exc)}"
        )


async def handle_get_history(current_user: User) -> list[dict[str, Any]]:
    logger.info("AI Recommendations History handler triggered.")
    try:
        paths = UserPaths(current_user.id)
        return recommendation_service.get_recommendation_history_list(paths)
    except Exception as exc:
        logger.error("AI Recommendations History retrieval failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"History log retrieval failed: {str(exc)}"
        )


# --- ROUTER (prefix: /ai-recommendations) ---

@router.get(
    "",
    response_model=AIRecommendationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dynamic AI marketing recommendations",
    description="Loads preprocessed metrics, model features, and feature importance configurations to return strategic recommendations.",
)
async def get_ai_recommendations(
    priority: Optional[str] = Query(None, description="Filter recommendations by priority (High, Medium, Low)"),
    category: Optional[str] = Query(None, description="Filter recommendations by category (Budget, Campaign, etc.)"),
    action: Optional[str] = Query(None, description="Filter recommendations by action type (Increase Budget, Optimize, etc.)"),
    implementation: Optional[str] = Query(None, description="Filter recommendations by implementation difficulty (Easy, Medium, Complex)"),
    search: Optional[str] = Query(None, description="Search recommendations by title, description, category, or tags"),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    return await handle_get_recommendations(current_user, priority, category, action, implementation, search)


@router.get(
    "/history",
    response_model=list[RecommendationHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get AI recommendations run history",
    description="Retrieves a history log of recent recommendations runs (latest 50 runs).",
)
async def get_recommendation_history(current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    return await handle_get_history(current_user)


# --- ROUTER OVERRIDE (prefix: /ai/recommendations) ---

@router_override.get(
    "",
    response_model=AIRecommendationsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dynamic AI marketing recommendations (Override Endpoint)",
    description="Loads preprocessed metrics, model features, and feature importance configurations to return strategic recommendations.",
)
async def get_ai_recommendations_override(
    priority: Optional[str] = Query(None, description="Filter recommendations by priority (High, Medium, Low)"),
    category: Optional[str] = Query(None, description="Filter recommendations by category (Budget, Campaign, etc.)"),
    action: Optional[str] = Query(None, description="Filter recommendations by action type (Increase Budget, Optimize, etc.)"),
    implementation: Optional[str] = Query(None, description="Filter recommendations by implementation difficulty (Easy, Medium, Complex)"),
    search: Optional[str] = Query(None, description="Search recommendations by title, description, category, or tags"),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    return await handle_get_recommendations(current_user, priority, category, action, implementation, search)


@router_override.get(
    "/history",
    response_model=list[RecommendationHistoryItem],
    status_code=status.HTTP_200_OK,
    summary="Get AI recommendations run history (Override Endpoint)",
    description="Retrieves a history log of recent recommendations runs (latest 50 runs).",
)
async def get_recommendation_history_override(current_user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    return await handle_get_history(current_user)
