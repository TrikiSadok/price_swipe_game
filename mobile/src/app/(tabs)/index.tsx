// Play tab: start the game and see how it works.
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Body, Card, Screen, Title } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { radius, space, useTheme } from "@/lib/theme";

const STEPS = [
  ["👆", "Swipe", "Is the real price higher or lower than the one shown?"],
  ["📍", "Pin", "Tap the world map where you think it was sold."],
  ["⭐", "Score", "Up to 500 points for the price, 1000 for the place."],
];

export default function Play() {
  const theme = useTheme();
  const { username } = useAuth();
  return (
    <Screen>
      <Body muted>👋 {username}</Body>
      <Title>Ready to guess?</Title>
      <Pressable onPress={() => router.push("/play")} accessibilityRole="button"
                 style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
        <Card style={[styles.mode, { borderColor: theme.primary }]}>
          <View style={[styles.emoji, { backgroundColor: theme.primary }]}><Text style={{ fontSize: 34 }}>👆</Text></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 22, fontWeight: "900", color: theme.text }}>Endless swipe</Text>
            <Text style={{ color: theme.muted }}>Higher or lower? Then find where it was sold.</Text>
          </View>
        </Card>
      </Pressable>
      <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text, marginTop: space.sm }}>How it works</Text>
      {STEPS.map(([emoji, title, text]) => (
        <View key={title} style={styles.step}>
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", color: theme.text, fontSize: 16 }}>{title}</Text>
            <Text style={{ color: theme.muted }}>{text}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mode: { flexDirection: "row", alignItems: "center", gap: space.md, borderWidth: 2 },
  emoji: { width: 64, height: 64, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  step: { flexDirection: "row", alignItems: "center", gap: space.md },
});
