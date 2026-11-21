from datetime import datetime
from fastapi import APIRouter
from app.schemas import HealthOut

router = APIRouter()


@router.get("/health", response_model=HealthOut, tags=["Health"])
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}
