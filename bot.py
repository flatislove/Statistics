import os
import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes

from database.db import engine, Base
from api import router as api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("BOT_TOKEN")
WEBAPP_URL = os.environ.get("WEBAPP_URL", "https://flatislove.github.io/Statistics/")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты из отдельного файла api.py
app.include_router(api_router)

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