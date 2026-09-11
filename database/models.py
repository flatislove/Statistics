import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base

class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    players = relationship("Player", back_populates="community", cascade="all, delete-orphan")
    match_days = relationship("MatchDay", back_populates="community", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, autoincrement=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    guid = Column(String(36), unique=True, nullable=False)
    telegram_id = Column(BigInteger, nullable=True)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=False)
    gender = Column(String(10), nullable=False)  # 'm' или 'f'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    community = relationship("Community", back_populates="players")


class MatchDay(Base):
    __tablename__ = "match_days"

    id = Column(Integer, primary_key=True, autoincrement=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    date = Column(Date, default=datetime.date.today)
    status = Column(String(20), default="active")  # 'active', 'completed'

    community = relationship("Community", back_populates="match_days")
    teams = relationship("MatchDayTeam", back_populates="match_day", cascade="all, delete-orphan")


class MatchDayTeam(Base):
    __tablename__ = "match_day_teams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_day_id = Column(Integer, ForeignKey("match_days.id"), nullable=False)
    name = Column(String(50), nullable=False)  # "Команда 1", "Команда 2", "Команда 3"

    match_day = relationship("MatchDay", back_populates="teams")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_day_id = Column(Integer, ForeignKey("match_days.id"), nullable=False)
    team_1_id = Column(Integer, ForeignKey("match_day_teams.id"), nullable=False)
    team_2_id = Column(Integer, ForeignKey("match_day_teams.id"), nullable=False)
    team_1_score = Column(Integer, default=0)
    team_2_score = Column(Integer, default=0)
    status = Column(String(20), default="in_progress")  # 'in_progress', 'finished'


class PlayerGameStats(Base):
    __tablename__ = "player_game_stats"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    attack_plus = Column(Integer, default=0)
    attack_minus = Column(Integer, default=0)
    drop_plus = Column(Integer, default=0)
    drop_minus = Column(Integer, default=0)
    serve_plus = Column(Integer, default=0)
    serve_minus = Column(Integer, default=0)