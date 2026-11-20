"""Game rules: the shown price, the distance and the points. Pure functions, easy to test."""

import math
import random

PLAYER_CURRENCY = "EUR"

# Approximate demo exchange rates: how many euros one unit of each currency is worth.
EUR_PER_UNIT = {
    "EUR": 1.0, "USD": 0.86, "GBP": 1.15, "CAD": 0.62, "JPY": 0.0057, "TND": 0.29,
    "MAD": 0.093, "DZD": 0.0066, "EGP": 0.018, "TRY": 0.021, "AED": 0.235, "INR": 0.0098,
    "MXN": 0.047, "XOF": 0.001524, "BRL": 0.16, "AUD": 0.56, "CHF": 1.07,
}

SWIPE_POINTS = 500  # for a correct higher/lower swipe
MAP_MAX_POINTS = 1000  # pin exactly on the city
MAP_SCALE_KM = 1500  # map points = max * exp(-distance / scale)

# The shown price is the real price times a factor from one of these ranges.
LOW_RANGE = (0.50, 0.85)  # shown price is lower -> correct answer "higher"
HIGH_RANGE = (1.15, 2.00)  # shown price is higher -> correct answer "lower"

EARTH_RADIUS_KM = 6371.0088


def to_eur(amount: float, currency: str) -> float:
    return amount * EUR_PER_UNIT[currency]


def draw_shown_price(real: float, rng: random.Random | None = None) -> tuple[float, str]:
    """Pick the price shown on the card and the correct swipe.

    1. Choose a side with probability 1/2.
    2. Draw the factor uniformly on the LOG scale inside that side's range, so "half" and
       "double" are equally likely: the shown price alone says nothing about the answer.
    Redraw in the rare case where rounding to cents lands on the wrong side.
    """
    rng = rng or random.SystemRandom()
    while True:
        low, high, correct = ((*LOW_RANGE, "higher") if rng.random() < 0.5
                              else (*HIGH_RANGE, "lower"))
        factor = math.exp(rng.uniform(math.log(low), math.log(high)))
        shown = round(real * factor, 2)
        if (correct == "higher" and shown < real) or (correct == "lower" and shown > real):
            return shown, correct


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two points, in kilometres."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(min(1.0, math.sqrt(a)))


def map_points(distance_km: float) -> int:
    """0 km -> 1000, 500 km -> 717, 1500 km -> 368, 5000 km -> 36."""
    return round(MAP_MAX_POINTS * math.exp(-distance_km / MAP_SCALE_KM))
