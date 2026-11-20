"""Demo content, loaded on first start: cities and 20 items with placeholder photos.

Prices are rough real-world values. The pictures are generated, so the repo stays free of
third-party photos. Post your own photos from the app to play with real ones.
"""

import random

from PIL import Image, ImageDraw, ImageFont
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import MEDIA_DIR
from app.models import City, Item

# name, country code, country, latitude, longitude, currency
CITIES = [
    ("Paris", "FR", "France", 48.8566, 2.3522, "EUR"),
    ("Lyon", "FR", "France", 45.7640, 4.8357, "EUR"),
    ("Tunis", "TN", "Tunisia", 36.8065, 10.1815, "TND"),
    ("Sfax", "TN", "Tunisia", 34.7406, 10.7603, "TND"),
    ("Sousse", "TN", "Tunisia", 35.8256, 10.6360, "TND"),
    ("Marrakesh", "MA", "Morocco", 31.6295, -7.9811, "MAD"),
    ("Casablanca", "MA", "Morocco", 33.5731, -7.5898, "MAD"),
    ("Algiers", "DZ", "Algeria", 36.7538, 3.0588, "DZD"),
    ("Cairo", "EG", "Egypt", 30.0444, 31.2357, "EGP"),
    ("Munich", "DE", "Germany", 48.1351, 11.5820, "EUR"),
    ("Berlin", "DE", "Germany", 52.5200, 13.4050, "EUR"),
    ("Madrid", "ES", "Spain", 40.4168, -3.7038, "EUR"),
    ("Barcelona", "ES", "Spain", 41.3874, 2.1686, "EUR"),
    ("Rome", "IT", "Italy", 41.9028, 12.4964, "EUR"),
    ("Lisbon", "PT", "Portugal", 38.7223, -9.1393, "EUR"),
    ("Amsterdam", "NL", "Netherlands", 52.3676, 4.9041, "EUR"),
    ("Zurich", "CH", "Switzerland", 47.3769, 8.5417, "CHF"),
    ("London", "GB", "United Kingdom", 51.5074, -0.1278, "GBP"),
    ("Istanbul", "TR", "Türkiye", 41.0082, 28.9784, "TRY"),
    ("Dubai", "AE", "United Arab Emirates", 25.2048, 55.2708, "AED"),
    ("Mumbai", "IN", "India", 19.0760, 72.8777, "INR"),
    ("Tokyo", "JP", "Japan", 35.6762, 139.6503, "JPY"),
    ("New York City", "US", "United States", 40.7128, -74.0060, "USD"),
    ("San Francisco", "US", "United States", 37.7749, -122.4194, "USD"),
    ("Montréal", "CA", "Canada", 45.5019, -73.5674, "CAD"),
    ("Mexico City", "MX", "Mexico", 19.4326, -99.1332, "MXN"),
    ("São Paulo", "BR", "Brazil", -23.5505, -46.6333, "BRL"),
    ("Dakar", "SN", "Senegal", 14.7167, -17.4677, "XOF"),
    ("Sydney", "AU", "Australia", -33.8688, 151.2093, "AUD"),
]

# name, quantity, unit, city, local price
DEMO_ITEMS = [
    ("Baguette", 1, "piece", "Paris", 1.25),
    ("Bananas", 1, "kg", "Tunis", 4.8),
    ("Mint tea", 1, "piece", "Marrakesh", 10),
    ("Tomatoes", 1, "kg", "Cairo", 25),
    ("Pretzel", 1, "piece", "Munich", 1.10),
    ("Olive oil", 1, "L", "Madrid", 9.50),
    ("Simit", 1, "piece", "Istanbul", 20),
    ("Coffee", 1, "piece", "New York City", 4.50),
    ("Onigiri", 1, "piece", "Tokyo", 180),
    ("Milk", 1, "L", "Montréal", 2.79),
    ("Bottled water", 1.5, "L", "Dakar", 500),
    ("Dates", 1, "kg", "Dubai", 35),
    ("Samosa", 1, "piece", "Mumbai", 20),
    ("Tacos al pastor", 3, "piece", "Mexico City", 60),
    ("Espresso", 1, "piece", "Rome", 1.20),
    ("Eggs", 12, "piece", "London", 3.20),
    ("Bread loaf", 1, "piece", "Algiers", 15),
    ("Croissant", 1, "piece", "Lyon", 1.30),
    ("Harissa", 135, "g", "Sfax", 1.95),
    ("Pastel de nata", 1, "piece", "Lisbon", 1.40),
]

PALETTE = [(108, 76, 245), (20, 184, 122), (255, 90, 95), (255, 182, 39), (56, 152, 236)]


def placeholder_photo(name: str, seed: int) -> Image.Image:
    """A soft gradient 'photo' with the item name on a white label."""
    rnd = random.Random(seed)
    w, h = 1200, 1500
    base = PALETTE[seed % len(PALETTE)]
    top = tuple(min(255, c + 60) for c in base)
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):  # vertical gradient
        t = y / h
        draw.line([(0, y), (w, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, base)))
    overlay = Image.new("RGBA", (w, h))
    shapes = ImageDraw.Draw(overlay)
    for _ in range(9):  # a few soft circles so pictures don't look identical
        x, y, r = rnd.randint(0, w), rnd.randint(0, h), rnd.randint(80, 320)
        shapes.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, rnd.randint(25, 60)))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([100, h // 2 - 130, w - 100, h // 2 + 130], radius=60,
                           fill=(255, 255, 255))
    draw.text((w // 2, h // 2), name, fill=(30, 27, 46), font=ImageFont.load_default(size=110),
              anchor="mm")
    draw.text((w // 2, 110), "DEMO PHOTO", fill=(255, 255, 255),
              font=ImageFont.load_default(size=54), anchor="mm")
    return img


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(City.id).limit(1)) is not None:
        return
    cities = {}
    for name, cc, country, lat, lon, currency in CITIES:
        cities[name] = City(name=name, country_code=cc, country_name=country, lat=lat, lon=lon,
                            currency=currency)
        db.add(cities[name])
    db.flush()
    for n, (name, quantity, unit, city, price) in enumerate(DEMO_ITEMS):
        filename = f"demo-{n:02d}.jpg"
        placeholder_photo(name, n).save(MEDIA_DIR / filename, "JPEG", quality=88)
        db.add(Item(name=name, quantity=quantity, unit=unit, price=price,
                    city_id=cities[city].id, image_file=filename))
    db.commit()
