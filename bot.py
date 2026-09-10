import logging
import os
from telegram import Update
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# Настройка логирования для отслеживания событий в консоли/сервере
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def start_command(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    user = update.effective_user
    welcome_text = (
        f"Привет, {user.first_name}! 👋\n\n"
        "Я бот, работающий 24/7.\n"
        "Отправь мне любое сообщение, и я отвечу!"
    )
    await update.message.reply_text(welcome_text)


async def help_command(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    await update.message.reply_text("Доступные команды:\n/start - Перезапустить бота\n/help - Справка")


async def echo_message(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> None:
    user_text = update.message.text
    await update.message.reply_text(f"Вы написали: {user_text}")


def main() -> None:
    token = os.environ.get(
        "BOT_TOKEN", "8691852267:AAFuIcUaaUsIFJAlQCbiuGk5RH5NjHzaI4A"
    )

    if token == "8691852267:AAFuIcUaaUsIFJAlQCbiuGk5RH5NjHzaI4A":
        logger.warning(
            "Внимание: Используется тестовый токен-заглушка! Не забудьте указать токен от @BotFather."
        )

    # Инициализация приложения бота
    app = ApplicationBuilder().token(token).build()

    # Регистрация обработчиков
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))

    # Обработка всех остальных текстовых сообщений (кроме команд)
    app.add_handler(
        MessageHandler(filters.TEXT & ~filters.COMMAND, echo_message)
    )

    # Запуск опроса серверов Telegram (Long Polling)
    logger.info("Бот успешно запущен и готов к работе...")
    app.run_polling()


if __name__ == "__main__":
    main()