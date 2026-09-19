import os
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.db import async_session
from database.models import Community

router = APIRouter(prefix="/api", tags=["Communities"])
OWNER_TELEGRAM_ID = int(os.environ.get("OWNER_TELEGRAM_ID", 0))

class CommunityCreate(BaseModel):
    name: str
    invite_code: str

async def get_db():
    async with async_session() as session:
        yield session

@router.post("/communities")
async def create_community(
    data: CommunityCreate,
    x_telegram_id: str = Header(..., alias="X-Telegram-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Telegram ID format.")

    if user_id != OWNER_TELEGRAM_ID:
        raise HTTPException(
            status_code=403, 
            detail="Access denied. Only the main administrator can create communities."
        )

    existing = await db.execute(select(Community).where(Community.invite_code == data.invite_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Community with this invite code already exists.")

    new_community = Community(name=data.name, invite_code=data.invite_code)
    db.add(new_community)
    await db.commit()
    await db.refresh(new_community)
    
    return {"status": "success", "community_id": new_community.id, "name": new_community.name}

@router.get("/communities")
async def get_communities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community))
    communities = result.scalars().all()
    return [{"id": c.id, "name": c.name, "invite_code": c.invite_code} for c in communities]

@router.get("/check-admin")
async def check_admin(x_telegram_id: str = Header(..., alias="X-Telegram-Id")):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        return {"is_admin": False}
    
    is_admin = (user_id == OWNER_TELEGRAM_ID)
    return {"is_admin": is_admin}

@router.get("/ping")
async def ping_server():
    return {"status": "ok"}