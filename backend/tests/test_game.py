import os
import random
import tempfile

# Use a throw-away database and photo folder (must be set before the app is imported).
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["MEDIA_DIR"] = f"{_tmp}/media"

from fastapi.testclient import TestClient  # noqa: E402

from app import game  # noqa: E402
from app.main import app  # noqa: E402


def test_map_points_decay_with_distance():
    assert game.map_points(0) == 1000
    assert game.map_points(1500) == 368
    assert game.map_points(20_000) == 0


def test_shown_price_is_always_on_the_correct_side():
    rng = random.Random(1)
    for _ in range(2000):
        real = rng.uniform(0.05, 50)
        shown, correct = game.draw_shown_price(real, rng)
        assert (shown < real) if correct == "higher" else (shown > real)


def test_paris_to_tunis_distance():
    assert 1450 < game.haversine_km(48.8566, 2.3522, 36.8065, 10.1815) < 1500


def test_play_one_card():
    with TestClient(app) as client:
        token = client.post("/auth/login", json={"username": "tester"}).json()["token"]
        auth = {"Authorization": f"Bearer {token}"}

        cards = client.post("/game/cards", json={"count": 2, "fresh": True}, headers=auth)
        card = cards.json()["cards"][0]
        assert "real_price" not in card and "city" not in card  # no answer before the guess

        reveal = client.post("/game/guess", headers=auth, json={
            "ticket_id": card["ticket_id"], "swipe": "higher", "pin_lat": 48.85, "pin_lon": 2.35,
        }).json()
        assert reveal["points"]["total"] == reveal["points"]["price"] + reveal["points"]["map"]

        again = client.post("/game/guess", headers=auth, json={
            "ticket_id": card["ticket_id"], "swipe": "higher", "pin_lat": 0, "pin_lon": 0,
        })
        assert again.status_code == 404  # a card can only be guessed once
