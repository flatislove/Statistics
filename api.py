from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Разделяем импорты: engine берем из database.db, а Base из database.models
from database.db import engine
from database.models import Base

# Импортируем роутеры из папки routers
from routers import communities, settings, players, match, teams, reports

app = FastAPI(title="Volleyball League API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(communities.router)
app.include_router(settings.router)
app.include_router(players.router)
app.include_router(match.router)
app.include_router(teams.router)
app.include_router(reports.router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)