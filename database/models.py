import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Date, DateTime, ForeignKey, Enum as SQLEnum, Table
from sqlalchemy.orm import relationship
from database.db import Base
import enum

team_players = Table(
    "team_players",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("match_day_teams.id", ondelete="CASCADE"), primary_key=True),
    Column("player_id", Integer, ForeignKey("players.id", ondelete="CASCADE"), primary_key=True)
)

class TournamentFormat(str, enum.Enum):
    ROUND_ROBIN = "round_robin"
    PLAYOFF = "playoff"
    FRIENDLY = "friendly"


class Community(Base):
    __tablename__ = "communities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    invite_code = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    format_type = Column(SQLEnum(TournamentFormat), default=TournamentFormat.ROUND_ROBIN, nullable=False)
    target_wins = Column(Integer, default=1, nullable=False)

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
    gender = Column(String(10), nullable=False) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    community = relationship("Community", back_populates="players")
    stats = relationship("PlayerGameStats", back_populates="player", cascade="all, delete-orphan")
    match_teams = relationship("MatchDayTeam", secondary=team_players, back_populates="players")


class MatchDay(Base):
    __tablename__ = "match_days"

    id = Column(Integer, primary_key=True, autoincrement=True)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    date = Column(Date, default=datetime.date.today)
    status = Column(String(20), default="active")
    
    format_type = Column(SQLEnum(TournamentFormat), default=TournamentFormat.ROUND_ROBIN, nullable=False)
    target_wins = Column(Integer, default=1, nullable=False)

    community = relationship("Community", back_populates="match_days")
    teams = relationship("MatchDayTeam", back_populates="match_day", cascade="all, delete-orphan")
    games = relationship("Game", back_populates="match_day", cascade="all, delete-orphan")


class MatchDayTeam(Base):
    __tablename__ = "match_day_teams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_day_id = Column(Integer, ForeignKey("match_days.id"), nullable=False)
    name = Column(String(50), nullable=False)

    match_day = relationship("MatchDay", back_populates="teams")
    players = relationship("Player", secondary=team_players, back_populates="match_teams")


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_day_id = Column(Integer, ForeignKey("match_days.id"), nullable=False)
    team_1_id = Column(Integer, ForeignKey("match_day_teams.id"), nullable=False)
    team_2_id = Column(Integer, ForeignKey("match_day_teams.id"), nullable=False)
    
    target_wins = Column(Integer, default=1, nullable=False)
    status = Column(String(20), default="in_progress")
    stage = Column(String(50), nullable=True)

    match_day = relationship("MatchDay", back_populates="games")
    team_1 = relationship("MatchDayTeam", foreign_keys=[team_1_id])
    team_2 = relationship("MatchDayTeam", foreign_keys=[team_2_id])
    stats = relationship("PlayerGameStats", back_populates="game", cascade="all, delete-orphan")
    sets = relationship("GameSet", back_populates="game", cascade="all, delete-orphan", order_by="GameSet.set_number")


class GameSet(Base):
    __tablename__ = "game_sets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    
    set_number = Column(Integer, nullable=False)
    score_1 = Column(Integer, default=0, nullable=False)
    score_2 = Column(Integer, default=0, nullable=False)

    game = relationship("Game", back_populates="sets")


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

    game = relationship("Game", back_populates="stats")
    player = relationship("Player", back_populates="stats")