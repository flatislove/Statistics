import os
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from database.db import async_session
from database.models import Community, MatchDay

router = APIRouter(prefix="/api", tags=["Match"])
OWNER_TELEGRAM_ID = int(os.environ.get("OWNER_TELEGRAM_ID", 0))

class MatchDayCreate(BaseModel):
    date: str | None = None

async def get_db():
    async with async_session() as session:
        yield session

@router.post("/communities/{community_id}/match-days")
async def create_match_day(
    community_id: int,
    data: MatchDayCreate = None,
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

    new_match_day = MatchDay(
        community_id=community_id,
        format_type=comm.format_type,
        target_wins=comm.target_wins,
        date=data.date if data else None
    )
    db.add(new_match_day)
    await db.commit()
    await db.refresh(new_match_day)

    return {
        "status": "success",
        "match_day_id": new_match_day.id,
        "format_type": new_match_day.format_type,
        "target_wins": new_match_day.target_wins,
        "date": new_match_day.date
    }