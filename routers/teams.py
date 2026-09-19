import os
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database.db import async_session
from database.models import MatchDay, MatchDayTeam, Player, Game

router = APIRouter(prefix="/api", tags=["Teams"])
OWNER_TELEGRAM_ID = int(os.environ.get("OWNER_TELEGRAM_ID", 0))

class TeamSaveSchema(BaseModel):
    name: str
    player_ids: list[int]

class LineupUpdateSchema(BaseModel):
    teams: list[TeamSaveSchema]

async def get_db():
    async with async_session() as session:
        yield session

@router.get("/match-days/{match_day_id}/lineup")
async def get_match_day_lineup(match_day_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MatchDayTeam)
        .options(selectinload(MatchDayTeam.players))
        .where(MatchDayTeam.match_day_id == match_day_id)
    )
    teams = result.scalars().all()
    
    return [
        {
            "name": t.name,
            "player_ids": [p.id for p in t.players]
        }
        for t in teams
    ]

@router.put("/match-days/{match_day_id}/lineup")
async def save_or_update_lineup(
    match_day_id: int,
    payload: LineupUpdateSchema,
    x_telegram_id: str = Header(..., alias="X-Telegram-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Telegram ID format.")

    if user_id != OWNER_TELEGRAM_ID:
        raise HTTPException(status_code=403, detail="Access denied.")

    match_day = await db.get(MatchDay, match_day_id)
    if not match_day:
        raise HTTPException(status_code=404, detail="MatchDay not found.")

    existing_teams_result = await db.execute(
        select(MatchDayTeam)
        .options(selectinload(MatchDayTeam.players))
        .where(MatchDayTeam.match_day_id == match_day_id)
    )
    existing_teams = {t.name: t for t in existing_teams_result.scalars().all()}
    incoming_names = {t.name for t in payload.teams}

    for name, team_obj in existing_teams.items():
        if name not in incoming_names:
            games_check = await db.execute(
                select(Game).where((Game.team_1_id == team_obj.id) | (Game.team_2_id == team_obj.id))
            )
            if games_check.scalar_one_or_none():
                raise HTTPException(status_code=400, detail=f"Cannot delete team '{name}' because it has active games.")
            await db.delete(team_obj)

    for team_data in payload.teams:
        players_result = await db.execute(
            select(Player).where(Player.id.in_(team_data.player_ids))
        )
        players = players_result.scalars().all()
        
        if len(players) != len(team_data.player_ids):
            raise HTTPException(status_code=400, detail="One or more players not found.")

        team_obj = existing_teams.get(team_data.name)
        if team_obj:
            team_obj.players = players
        else:
            new_team = MatchDayTeam(
                match_day_id=match_day_id,
                name=team_data.name,
                players=players
            )
            db.add(new_team)

    await db.commit()
    return {"status": "success", "message": "Lineup successfully updated"}