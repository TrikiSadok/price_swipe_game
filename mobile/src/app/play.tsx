// The game: (1) swipe higher/lower on the card, (2) drop a pin on the map,
// (3) see the reveal (real price, place, distance, points), then the next card.
// The server never sends the answer before the guess.
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GuessMap, type LatLon } from "@/components/GuessMap";
import { SwipeCard, type Card } from "@/components/SwipeCard";
import { Body, Button } from "@/components/ui";
import { errorText, post } from "@/lib/api";
import { flagEmoji, formatDistance, formatMoney } from "@/lib/format";
import { radius, space, useTheme } from "@/lib/theme";

type Money = { amount: number; currency: string };
type Reveal = {
  real_price: Money;
  real_price_eur: Money;
  swipe: "higher" | "lower";
  swipe_correct: boolean;
  city: { name: string; country_code: string; country_name: string; lat: number; lon: number };
  distance_km: number;
  points: { price: number; map: number; total: number };
};
type Phase = "swipe" | "map" | "reveal";

export default function Play() {
  const theme = useTheme();
  const safe = useSafeAreaInsets();
  // Measured heights of what covers the map (good guesses until the first layout).
  const [topH, setTopH] = useState(160);
  const [bottomH, setBottomH] = useState(110);
  const [sheetH, setSheetH] = useState(420);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("swipe");
  const [swipe, setSwipe] = useState<"higher" | "lower" | null>(null);
  const [pin, setPin] = useState<LatLon | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [score, setScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refill = useCallback(async (fresh: boolean) => {
    try {
      const res = await post<{ cards: Card[] }>("/game/cards", { count: 3, fresh });
      setCards((prev) => [...prev, ...res.cards]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refill(true); }, [refill]);

  const current = cards[0];

  function choose(direction: "higher" | "lower") {
    setSwipe(direction);
    setPhase("map");
  }

  async function lockGuess() {
    if (!current || !swipe || !pin) return;
    setBusy(true);
    setError(null);
    try {
      const result = await post<Reveal>("/game/guess", {
        ticket_id: current.ticket_id, swipe, pin_lat: pin.lat, pin_lon: pin.lon,
      });
      setReveal(result);
      setScore((s) => s + result.points.total);
      setPhase("reveal");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setCards((prev) => prev.slice(1));
    setSwipe(null);
    setPin(null);
    setReveal(null);
    setPhase("swipe");
    if (cards.length <= 2) void refill(false);
  }

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={12}><Text style={{ fontSize: 26, color: theme.text }}>✕</Text></Pressable>
      <View style={[styles.score, { backgroundColor: theme.accent }]}>
        <Text style={styles.scoreText}>⭐ {score.toLocaleString("en")} pts</Text>
      </View>
    </View>
  );

  if (loading) {
    return <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]}>{header}<ActivityIndicator style={{ flex: 1 }} /></SafeAreaView>;
  }
  if (!current) {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]}>
        {header}
        <View style={styles.center}>
          <Text style={{ fontSize: 64 }}>🌍</Text>
          <Body style={{ textAlign: "center" }}>{error ?? "You've seen every item for now. Post one, or come back later!"}</Body>
        </View>
      </SafeAreaView>
    );
  }

  // Step 1: the card.
  if (phase === "swipe") {
    return (
      <SafeAreaView style={[styles.fill, { backgroundColor: theme.background }]}>
        {header}
        <Body muted style={{ textAlign: "center", paddingHorizontal: space.lg }}>
          Swipe right if the real price is HIGHER, left if it is LOWER
        </Body>
        <View style={styles.deck}>
          <SwipeCard key={current.ticket_id} card={current} onSwipe={choose} />
        </View>
        <View style={styles.buttons}>
          <Button label="↓ Lower" color={theme.lower} style={{ flex: 1 }} onPress={() => choose("lower")} />
          <Button label="Higher ↑" color={theme.higher} style={{ flex: 1 }} onPress={() => choose("higher")} />
        </View>
      </SafeAreaView>
    );
  }

  // Steps 2 and 3: the map, then the reveal sheet on top of it.
  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <GuessMap pin={pin} onPin={setPin}
                answer={reveal ? { lat: reveal.city.lat, lon: reveal.city.lon } : null}
                insets={{ top: phase === "map" ? topH : safe.top + 60,
                          bottom: phase === "reveal" ? sheetH : bottomH }} />
      <SafeAreaView style={styles.overlayTop} edges={["top"]} pointerEvents="box-none"
                    onLayout={(e) => setTopH(e.nativeEvent.layout.height)}>
        {header}
        {phase === "map" && (
          <Animated.View entering={FadeInDown} style={[styles.banner, { backgroundColor: theme.surface }]}>
            <Text style={{ fontWeight: "900", fontSize: 20, color: theme.text }}>Where was this sold?</Text>
            <Text style={{ color: theme.muted }}>Tap the map to drop your pin</Text>
          </Animated.View>
        )}
      </SafeAreaView>

      {phase === "map" && (
        <SafeAreaView style={styles.overlayBottom} edges={["bottom"]}
                      onLayout={(e) => setBottomH(e.nativeEvent.layout.height)}>
          {error ? <Text style={{ color: theme.danger, fontWeight: "700", marginBottom: 8 }}>{error}</Text> : null}
          <Button label="Lock my guess" onPress={lockGuess} disabled={!pin} loading={busy} />
        </SafeAreaView>
      )}

      {phase === "reveal" && reveal && (
        <Animated.View entering={FadeInUp.springify()} style={[styles.sheet, { backgroundColor: theme.surface }]}
                       onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
          <SafeAreaView edges={["bottom"]}>
            <ScrollView contentContainerStyle={{ gap: 6 }}>
              <Text style={{ color: theme.muted, fontWeight: "700" }}>Real price</Text>
              <Text style={{ fontSize: 34, fontWeight: "900", color: theme.text }}>
                {formatMoney(reveal.real_price.amount, reveal.real_price.currency)}
              </Text>
              {reveal.real_price.currency !== reveal.real_price_eur.currency && (
                <Text style={{ color: theme.muted }}>
                  ≈ {formatMoney(reveal.real_price_eur.amount, reveal.real_price_eur.currency)}
                </Text>
              )}
              <Text style={{ color: reveal.swipe_correct ? theme.higher : theme.lower, fontWeight: "800" }}>
                {reveal.swipe_correct ? "You were right" : "Not quite"}: the real price was{" "}
                {reveal.swipe_correct === (reveal.swipe === "higher") ? "higher" : "lower"}.
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "900", color: theme.text, marginTop: 6 }}>
                {flagEmoji(reveal.city.country_code)} {reveal.city.name}, {reveal.city.country_name}
              </Text>
              <Text style={{ color: theme.muted }}>{formatDistance(reveal.distance_km)} from your pin</Text>
              <View style={styles.pointsRow}>
                <View style={[styles.pointsBox, { borderColor: theme.border }]}>
                  <Text style={{ color: theme.muted }}>Price</Text>
                  <Text style={[styles.pointsValue, { color: theme.text }]}>{reveal.points.price}</Text>
                </View>
                <View style={[styles.pointsBox, { borderColor: theme.border }]}>
                  <Text style={{ color: theme.muted }}>Location</Text>
                  <Text style={[styles.pointsValue, { color: theme.text }]}>{reveal.points.map}</Text>
                </View>
                <View style={[styles.pointsBox, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                  <Text style={{ color: "#1E1B2E" }}>+{reveal.points.total} points</Text>
                  <Text style={[styles.pointsValue, { color: "#1E1B2E" }]}>⭐</Text>
                </View>
              </View>
              <Button label="Next card" onPress={next} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.lg, gap: space.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: space.md, paddingVertical: space.sm },
  score: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  scoreText: { fontWeight: "900", color: "#1E1B2E", fontSize: 16 },
  deck: { flex: 1, padding: space.md },
  buttons: { flexDirection: "row", gap: space.md, paddingHorizontal: space.md },
  overlayTop: { position: "absolute", top: 0, start: 0, end: 0 },
  banner: { marginHorizontal: space.md, borderRadius: radius.md, padding: space.md, gap: 2 },
  overlayBottom: { position: "absolute", bottom: 0, start: 0, end: 0, padding: space.md },
  sheet: { position: "absolute", bottom: 0, start: 0, end: 0, maxHeight: "62%",
           borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.lg,
           shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  pointsRow: { flexDirection: "row", gap: space.sm, marginVertical: space.sm },
  pointsBox: { flex: 1, borderWidth: 1.5, borderRadius: radius.md, padding: space.sm, alignItems: "center" },
  pointsValue: { fontSize: 22, fontWeight: "900" },
});
