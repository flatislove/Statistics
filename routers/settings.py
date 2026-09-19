import os
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import async_session
from database.models import Community, TournamentFormat

router = APIRouter(prefix="/api", tags=["Settings"])
OWNER_TELEGRAM_ID = int(os.environ.get("OWNER_TELEGRAM_ID", 0))

class CommunitySettingsUpdate(BaseModel):
    format_type: TournamentFormat
    target_wins: int

async def get_db():
    async with async_session() as session:
        yield session

@router.get("/communities/{community_id}/settings")
async def get_community_settings(
    community_id: int,
    db: AsyncSession = Depends(get_db)
):
    comm = await db.get(Community, community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    return {
        "format_type": comm.format_type,
        "target_wins": comm.target_wins
    }

@router.put("/communities/{community_id}/settings")
async def update_community_settings(
    community_id: int,
    data: CommunitySettingsUpdate,
    x_telegram_id: str = Header(..., alias="X-Telegram-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Telegram ID format.")

    if user_id != OWNER_TELEGRAM_ID:
        raise HTTPException(status_code=403, detail="Access denied.")

    comm = await db.get(Community, community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")

    comm.format_type = data.format_type
    comm.target_wins = data.target_wins
    await db.commit()

    return {"status": "success", "format_type": comm.format_type, "target_wins": comm.target_wins}