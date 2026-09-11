import os
import asyncio
import logging
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

from database.db import async_session, engine, Base
from database.models import Community, Player, MatchDay, MatchDayTeam, Game, PlayerGameStats

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("BOT_TOKEN")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://flatislove.github.io/Statistics/")
OWNER_TELEGRAM_ID = int(os.environ.get("OWNER_TELEGRAM_ID", 0))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CommunityCreate(BaseModel):
    name: str
    invite_code: str

class PlayerCreate(BaseModel):
    name: str

async def get_db():
    async with async_session() as session:
        yield session

@app.post("/api/communities")
async def create_community(
    data: CommunityCreate,
    x_telegram_id: str = Header(..., alias="X-Telegram-Id"),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Telegram ID format.")

    logger.info(f"Create community request from user ID: {user_id} (Owner ID: {OWNER_TELEGRAM_ID})")

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

@app.get("/api/communities")
async def get_communities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community))
    communities = result.scalars().all()
    return [{"id": c.id, "name": c.name, "invite_code": c.invite_code} for c in communities]

@app.get("/api/communities/{community_id}/players")
async def get_players(community_id: int, db: AsyncSession = Depends(get_db)):
    comm = await db.get(Community, community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    result = await db.execute(select(Player).where(Player.community_id == community_id))
    players = result.scalars().all()
    return [{"id": p.id, "name": p.name} for p in players]

@app.post("/api/communities/{community_id}/players")
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

    new_player = Player(name=data.name, community_id=community_id)
    db.add(new_player)
    await db.commit()
    await db.refresh(new_player)
    
    return {"status": "success", "player_id": new_player.id, "name": new_player.name}

@app.get("/api/check-admin")
async def check_admin(x_telegram_id: str = Header(..., alias="X-Telegram-Id")):
    try:
        user_id = int(x_telegram_id)
    except ValueError:
        return {"is_admin": False}
    
    is_admin = (user_id == OWNER_TELEGRAM_ID)
    logger.info(f"Check admin for user ID {user_id}: result = {is_admin}")
    return {"is_admin": is_admin}

@app.get("/api/ping")
async def ping_server():
    return {"status": "ok"}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("📱 Open Web App", web_app=WebAppInfo(url=WEBAPP_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "Hello! Welcome to the volleyball match statistics system.",
        reply_markup=reply_markup
    )

async def init_db_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database and tables successfully initialized.")

async def main():
    await init_db_tables()

    ptb_app = ApplicationBuilder().token(BOT_TOKEN).build()
    ptb_app.add_handler(CommandHandler("start", start))

    await ptb_app.initialize()
    await ptb_app.start()
    await ptb_app.updater.start_polling()
    logger.info("Telegram bot successfully started in polling mode.")

    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    config = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="info")
    server = uvicorn.Server(config)
    
    await server.serve()

    await ptb_app.updater.stop()
    await ptb_app.stop()
    await ptb_app.shutdown()

if __name__ == "__main__":
    asyncio.run(main())