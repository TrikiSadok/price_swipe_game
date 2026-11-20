"""Price Swipe demo API.

    POST /auth/login    pick a username, get a token (demo sign-in, no password)
    GET  /me            your score and your posts
    POST /game/cards    deal cards: photo, name, size and the SHOWN price only
    POST /game/guess    swipe + map pin -> real price, place, distance, points
    GET  /cities        cities you can post from
    POST /items         post a product photo with its real price

Run:  uv run uvicorn app.main:app --reload     (interactive docs at /docs)
"""

import re
import secrets
import uuid
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.staticfiles import StaticFiles
from PIL import Image, ImageOps
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app import game
from app.db import MEDIA_DIR, Base, SessionLocal, engine, get_db
from app.models import City, Guess, Item, Ticket, User
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed_if_empty(db)
    yield


app = FastAPI(title="Price Swipe (demo)", lifespan=lifespan)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

USERNAME = re.compile(r"^[A-Za-z0-9_.]{3,20}$")


def current_user(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> User:
    token = authorization.removeprefix("Bearer ").strip()
    user = db.scalar(select(User).where(User.token == token)) if token else None
    if user is None:
        raise HTTPException(401, "Please sign in again.")
    return user


def media_url(request: Request, filename: str) -> str:
    return f"{str(request.base_url).rstrip('/')}/media/{filename}"


def city_json(city: City) -> dict:
    return {"id": city.id, "name": city.name, "country_code": city.country_code,
            "country_name": city.country_name, "lat": city.lat, "lon": city.lon,
            "currency": city.currency}


# --- Sign-in -------------------------------------------------------------------------------

class LoginBody(BaseModel):
    username: str


@app.post("/auth/login")
def login(body: LoginBody, db: Session = Depends(get_db)) -> dict:
    """Demo sign-in: a new username creates a player, a known one signs back in."""
    name = body.username.strip()
    if not USERNAME.match(name):
        raise HTTPException(422, "Use 3-20 letters, digits, _ or .")
    user = db.scalar(select(User).where(func.lower(User.username) == name.lower()))
    if user is None:
        user = User(username=name, token=secrets.token_urlsafe(32))
        db.add(user)
        db.commit()
    return {"token": user.token, "username": user.username}


@app.get("/me")
def me(request: Request, user: User = Depends(current_user),
       db: Session = Depends(get_db)) -> dict:
    points, played = db.execute(
        select(func.coalesce(func.sum(Guess.points), 0), func.count(Guess.id))
        .where(Guess.user_id == user.id)
    ).one()
    items = db.scalars(select(Item).where(Item.uploader_id == user.id)
                       .order_by(Item.id.desc())).all()
    return {
        "username": user.username, "total_points": points, "cards_played": played,
        "items": [{"id": i.id, "name": i.name, "image_url": media_url(request, i.image_file),
                   "price": {"amount": i.price, "currency": i.city.currency},
                   "city": city_json(i.city)} for i in items],
    }


# --- Game ----------------------------------------------------------------------------------

class CardsBody(BaseModel):
    count: int = Field(3, ge=1, le=10)
    fresh: bool = False  # starting a new game: forget cards dealt earlier but never guessed


@app.post("/game/cards")
def cards(body: CardsBody, request: Request, user: User = Depends(current_user),
          db: Session = Depends(get_db)) -> dict:
    """Deal up to `count` random items the player hasn't posted, guessed or been dealt yet."""
    if body.fresh:
        db.execute(delete(Ticket).where(Ticket.user_id == user.id))
    guessed = select(Guess.item_id).where(Guess.user_id == user.id)
    dealt = select(Ticket.item_id).where(Ticket.user_id == user.id)
    items = db.scalars(
        select(Item)
        .where(or_(Item.uploader_id.is_(None), Item.uploader_id != user.id),
               Item.id.not_in(guessed), Item.id.not_in(dealt))
        .order_by(func.random()).limit(body.count)
    ).all()
    out = []
    for item in items:
        shown, correct = game.draw_shown_price(game.to_eur(item.price, item.city.currency))
        ticket = Ticket(id=uuid.uuid4().hex, user_id=user.id, item_id=item.id,
                        shown_price=shown, correct=correct)
        db.add(ticket)
        out.append({
            "ticket_id": ticket.id, "image_url": media_url(request, item.image_file),
            "name": item.name, "quantity": f"{item.quantity:g}", "unit": item.unit,
            "shown_price": {"amount": shown, "currency": game.PLAYER_CURRENCY},
        })
    db.commit()
    return {"cards": out}


class GuessBody(BaseModel):
    ticket_id: str
    swipe: Literal["higher", "lower"]
    pin_lat: float = Field(ge=-90, le=90)
    pin_lon: float = Field(ge=-180, le=180)


@app.post("/game/guess")
def guess(body: GuessBody, user: User = Depends(current_user),
          db: Session = Depends(get_db)) -> dict:
    """Score the swipe and the map pin, then reveal the answer."""
    ticket = db.get(Ticket, body.ticket_id)
    if ticket is None or ticket.user_id != user.id:
        raise HTTPException(404, "This card expired. Here's a new one.")
    item = db.get(Item, ticket.item_id)
    city = item.city
    distance = game.haversine_km(body.pin_lat, body.pin_lon, city.lat, city.lon)
    swipe_correct = body.swipe == ticket.correct
    price_points = game.SWIPE_POINTS if swipe_correct else 0
    map_points = game.map_points(distance)
    db.add(Guess(user_id=user.id, item_id=item.id, swipe=body.swipe,
                 swipe_correct=swipe_correct, pin_lat=body.pin_lat, pin_lon=body.pin_lon,
                 distance_km=round(distance, 1), points=price_points + map_points))
    db.delete(ticket)
    db.commit()
    return {
        "real_price": {"amount": item.price, "currency": city.currency},
        "real_price_eur": {"amount": round(game.to_eur(item.price, city.currency), 2),
                           "currency": game.PLAYER_CURRENCY},
        "shown_price": {"amount": ticket.shown_price, "currency": game.PLAYER_CURRENCY},
        "swipe": body.swipe, "swipe_correct": swipe_correct,
        "city": city_json(city), "distance_km": round(distance, 1),
        "points": {"price": price_points, "map": map_points, "total": price_points + map_points},
    }


# --- Posting -------------------------------------------------------------------------------

@app.get("/cities")
def cities(db: Session = Depends(get_db)) -> dict:
    return {"cities": [city_json(c) for c in db.scalars(select(City).order_by(City.name))]}


@app.post("/items")
def post_item(
    photo: UploadFile = File(...),
    name: str = Form(..., min_length=2, max_length=80),
    quantity: float = Form(..., gt=0, lt=100_000),
    unit: Literal["g", "kg", "ml", "L", "piece"] = Form(...),
    price: float = Form(..., gt=0, lt=1e9),
    city_id: int = Form(...),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Save the photo (resized, re-encoded, so camera metadata like GPS is dropped)."""
    city = db.get(City, city_id)
    if city is None:
        raise HTTPException(422, "Unknown city.")
    try:
        img = ImageOps.exif_transpose(Image.open(photo.file)).convert("RGB")
    except Exception as exc:
        raise HTTPException(422, "Could not read this photo.") from exc
    img.thumbnail((1600, 1600))
    filename = f"{uuid.uuid4().hex}.jpg"
    img.save(MEDIA_DIR / filename, "JPEG", quality=85)
    item = Item(uploader_id=user.id, city_id=city.id, name=name.strip(), quantity=quantity,
                unit=unit, price=price, image_file=filename)
    db.add(item)
    db.commit()
    return {"id": item.id}
