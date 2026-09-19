from fastapi import APIRouter

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/status")
async def reports_status():
    return {"status": "reports module active"}