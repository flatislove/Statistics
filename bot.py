import asyncio
import json
import logging
import os
from telegram import Update, KeyboardButton, ReplyKeyboardMarkup, WebAppInfo
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# Настройка лагавання для адсочвання падзей у кансолі Render
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# Спасылка на ваш задэплоены Web App на GitHub Pages
WEB_APP_URL = "https://flatislove.github.io/Statistics/"


async def start_command(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    user = update.effective_user

    # Кнопка для адкрыцця Web App
    keyboard = [
        [KeyboardButton(text="📱 Адкрыць Web App", web_app=WebAppInfo(url=WEB_APP_URL))]
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)

    welcome_text = (
        f"Прывіт, {user.first_name}! 👋\n\n"
        "Націсні кнопку ніжэй, каб адкрыць Web App:"
    )
    await update.message.reply_text(welcome_text, reply_markup=reply_markup)


async def help_command(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    await update.message.reply_text("Даступныя каманды:\n/start - Перезапусціць бота\n/help - Даведка")


async def echo_message(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    user_text = update.message.text
    await update.message.reply_text(f"Вы напісалі: {user_text}")


async def web_app_data_handler(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    """Прымае даныя, адпраўленыя з Web App па кнопцы tg.sendData()"""
    raw_data = update.effective_message.web_app_data.data
    data = json.loads(raw_data)

    await update.message.reply_text(
        f"✅ Атрыманы даныя з Web App:\n{data.get('message', raw_data)}"
    )


def main() -> None:
    # Яўна ствараем event loop для сумяшчальнасці з Python 3.14+
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    # Бяспечнае атрыманне токена з Environment Variables
    token = os.environ.get("BOT_TOKEN")

    if not token:
        logger.error("ПАМЫЛКА: Зменная асяроддзя BOT_TOKEN не зададзена!")
        return

    app = ApplicationBuilder().token(token).build()

    # Рэгістрацыя апрацоўшчыкаў
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))

    # Апрацоўшчык даных з Web App
    app.add_handler(
        MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data_handler)
    )

    # Апрацоўшчык звычайных тэкставых паведамленняў
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, echo_message)
    )

    logger.info("Бот з падтрымкай Web App паспяхова запушчаны...")
    app.run_polling()


if __name__ == "__main__":
    main()