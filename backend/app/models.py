"""Database tables: players, cities, posted items, dealt cards (tickets) and guesses."""

from datetime import datetime

from sqlalchemy import ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(20), unique=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class City(Base):
    __tablename__ = "cities"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    country_code: Mapped[str] = mapped_column(String(2))
    country_name: Mapped[str]
    lat: Mapped[float]
    lon: Mapped[float]
    currency: Mapped[str] = mapped_column(String(3))


class Item(Base):
    """A product photo with its real local price. uploader_id is None for demo items."""

    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    uploader_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"))
    name: Mapped[str] = mapped_column(String(80))
    quantity: Mapped[float]
    unit: Mapped[str] = mapped_column(String(10))  # g, kg, ml, L, piece
    price: Mapped[float]  # in the city's currency
    image_file: Mapped[str]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    city: Mapped[City] = relationship(lazy="joined")


class Ticket(Base):
    """A card dealt to a player. The answer stays on the server until the guess (anti-cheat)."""

    __tablename__ = "tickets"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    shown_price: Mapped[float]  # in euros
    correct: Mapped[str] = mapped_column(String(6))  # "higher" or "lower"


class Guess(Base):
    __tablename__ = "guesses"
    __table_args__ = (UniqueConstraint("user_id", "item_id"),)  # one guess per item
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    item_id: Mapped[int] = mapped_column(ForeignKey("items.id"))
    swipe: Mapped[str] = mapped_column(String(6))
    swipe_correct: Mapped[bool]
    pin_lat: Mapped[float]
    pin_lon: Mapped[float]
    distance_km: Mapped[float]
    points: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
