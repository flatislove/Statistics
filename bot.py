import asyncio
import json
import logging
import os
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

WEB_APP_URL = "https://flatislove.github.io/Statistics/"

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")

    def log_message(self, format, *args):
        pass

def run_health_check_server():
    port = int(os.environ.get("PORT", 10000))
    server = HTTPServer(("0.0.0.0", port), HealthCheckHandler)
    logger.info(f"Health check server started on port {port}")
    server.serve_forever()

async def start_command(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    user = update.effective_user

    keyboard = [
        [KeyboardButton(text="📱 Открыть Web App", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

    welcome_text = (
        f"Привет, {user.first_name}! 👋\n\n"
        "Нажми кнопку ниже, чтобы открыть Web App:"
    )
    await update.message.reply_text(welcome_text, reply_markup=reply_markup)

async def help_command(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    await update.message.reply_text("Доступные команды:\n/start - Перезапустить бота\n/help - Справка")

async def echo_message(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    user_text = update.message.text
    await update.message.reply_text(f"Вы написали: {user_text}")

async def web_app_data_handler(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    raw_data = update.effective_message.web_app_data.data
    data = json.loads(raw_data)

    await update.message.reply_text(
        f"✅ Получены данные из Web App:\n{data.get('message', raw_data)}"
    )

def main() -> None:
    threading.Thread(target=run_health_check_server, daemon=True).start()

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    token = os.environ.get("BOT_TOKEN")

    if not token:
        logger.error("ОШИБКА: Переменная окружения BOT_TOKEN не задана!")
        return

    app = ApplicationBuilder().token(token).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))

    app.add_handler(
        MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data_handler)
    )

    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, echo_message)
    )

    logger.info("Бот с поддержкой Web App успешно запущен...")
    app.run_polling()

if __name__ == "__main__":
    main()