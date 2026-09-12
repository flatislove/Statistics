import uuid
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.db import async_session
from database.models import Community, Player

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

OWNER_TELEGRAM_ID = int(os.environ.get("OWNER_TELEGRAM_ID", 0))

class CommunityCreate(BaseModel):
    name: str
    invite_code: str

class PlayerCreate(BaseModel):
    name: str
    username: str | None = None
    telegram_id: int | None = None
    gender: str = "M"

class PlayerUpdate(BaseModel):
    name: str | None = None
    username: str | None = None
    telegram_id: int | None = None
    gender: str | None = None

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

@router.get("/communities/{community_id}/players")
async def get_players(community_id: int, db: AsyncSession = Depends(get_db)):
    comm = await db.get(Community, community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    result = await db.execute(select(Player).where(Player.community_id == community_id))
    players = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.first_name,
            "username": p.username,
            "telegram_id": p.telegram_id,
            "gender": p.gender
        } 
        for p in players
    ]

@router.post("/communities/{community_id}/players")
async def create_player(
    community_id: int,
    data: PlayerCreate,
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

    new_player = Player(
        guid=str(uuid.uuid4()),
        first_name=data.name,
        username=data.username,
        telegram_id=data.telegram_id,
        gender=data.gender,
        community_id=community_id
    )
    db.add(new_player)
    await db.commit()
    await db.refresh(new_player)
    
    return {
        "status": "success",
        "id": new_player.id,
        "name": new_player.first_name,
        "username": new_player.username,
        "telegram_id": new_player.telegram_id,
        "gender": new_player.gender
    }

@router.put("/players/{player_id}")
async def update_player(
    player_id: int,
    data: PlayerUpdate,
    x_telegram_id: str = Header(..., alias="X-Telegram-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Telegram ID format.")

    if user_id != OWNER_TELEGRAM_ID:
        raise HTTPException(status_code=403, detail="Access denied.")

    player = await db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found.")

    if data.name is not None:
        player.first_name = data.name
    if data.username is not None:
        player.username = data.username
    if data.telegram_id is not None:
        player.telegram_id = data.telegram_id
    if data.gender is not None:
        player.gender = data.gender

    await db.commit()
    await db.refresh(player)
    
    return {
        "status": "success",
        "id": player.id,
        "name": player.first_name,
        "username": player.username,
        "telegram_id": player.telegram_id,
        "gender": player.gender
    }

@router.delete("/players/{player_id}")
async def delete_player(
    player_id: int,
    x_telegram_id: str = Header(..., alias="X-Telegram-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Telegram ID format.")

    if user_id != OWNER_TELEGRAM_ID:
        raise HTTPException(status_code=403, detail="Access denied.")

    player = await db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found.")

    await db.delete(player)
    await db.commit()
    
    return {"status": "success", "deleted_id": player_id}

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