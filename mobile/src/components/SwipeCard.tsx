// The swipeable product card.
// Swipe RIGHT = "the real price is HIGHER" than the one shown; swipe LEFT = "LOWER".
// The card follows the finger (Reanimated runs this on the UI thread at 60 fps); past a
// threshold or with a quick flick it flies off and reports the direction.
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring,
                  withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { formatMoney, formatSize } from "@/lib/format";
import { radius, space, useTheme } from "@/lib/theme";

export type Card = {
  ticket_id: string;
  image_url: string;
  name: string;
  quantity: string;
  unit: string;
  shown_price: { amount: number; currency: string };
};

type Props = { card: Card; onSwipe: (direction: "higher" | "lower") => void };

export function SwipeCard({ card, onSwipe }: Props) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const threshold = width * 0.28;

  function done(direction: "higher" | "lower") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSwipe(direction);
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = e.translationX;
      y.value = e.translationY * 0.25;
    })
    .onEnd((e) => {
      if (Math.abs(x.value) > threshold || Math.abs(e.velocityX) > 900) {
        const right = x.value > 0 || (x.value === 0 && e.velocityX > 0);
        x.value = withTiming((right ? 1 : -1) * width * 1.4, { duration: 220 }, () => {
          scheduleOnRN(done, right ? "higher" : "lower");
        });
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value },
                { rotate: `${interpolate(x.value, [-width, width], [-14, 14])}deg` }],
  }));
  const higherStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, threshold], [0, 1], "clamp") }));
  const lowerStyle = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [-threshold, 0], [1, 0], "clamp") }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }, cardStyle]}>
        <Image source={card.image_url} style={styles.image} contentFit="cover" transition={150} />
        <Animated.View style={[styles.stamp, styles.stampHigher, { borderColor: theme.higher }, higherStyle]}>
          <Text style={[styles.stampText, { color: theme.higher }]}>Higher ↑</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.stampLower, { borderColor: theme.lower }, lowerStyle]}>
          <Text style={[styles.stampText, { color: theme.lower }]}>↓ Lower</Text>
        </Animated.View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{card.name}</Text>
          <Text style={{ color: theme.muted, fontSize: 15 }}>{formatSize(card.quantity, card.unit)}</Text>
          <View style={[styles.pricePill, { backgroundColor: theme.accent }]}>
            <Text style={styles.priceLabel}>Price shown</Text>
            <Text style={styles.price}>{formatMoney(card.shown_price.amount, card.shown_price.currency)}</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.lg, overflow: "hidden", shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 1, shadowRadius: 24, elevation: 8 },
  image: { flex: 1 },
  info: { padding: space.md, gap: 4 },
  name: { fontSize: 26, fontWeight: "900" },
  pricePill: { marginTop: space.sm, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 16,
               alignSelf: "flex-start" },
  priceLabel: { color: "#1E1B2E", fontSize: 12, fontWeight: "700", opacity: 0.7 },
  price: { color: "#1E1B2E", fontSize: 30, fontWeight: "900" },
  stamp: { position: "absolute", top: 40, borderWidth: 4, borderRadius: 12, paddingHorizontal: 12,
           paddingVertical: 4, backgroundColor: "rgba(255,255,255,0.9)" },
  stampHigher: { start: 24, transform: [{ rotate: "-12deg" }] },
  stampLower: { end: 24, transform: [{ rotate: "12deg" }] },
  stampText: { fontSize: 30, fontWeight: "900" },
});
