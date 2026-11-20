// Me tab: total score, cards played, my posts, sign out.
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Body, Button, Card, ErrorText, Screen, Title } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { flagEmoji, formatMoney } from "@/lib/format";
import { radius, space, useTheme } from "@/lib/theme";

type MyItem = { id: number; name: string; image_url: string;
                price: { amount: number; currency: string };
                city: { name: string; country_code: string } };
type Me = { username: string; total_points: number; cards_played: number; items: MyItem[] };

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Card style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text style={{ fontSize: 26, fontWeight: "900", color: theme.text }}>{value}</Text>
      <Text style={{ color: theme.muted }}>{label}</Text>
    </Card>
  );
}

export default function MeScreen() {
  const theme = useTheme();
  const { username, signOut } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reload every time the tab is opened (scores change after each game).
  useFocusEffect(useCallback(() => {
    api<Me>("/me").then(setMe).catch((e) => setError(errorText(e)));
  }, []));

  return (
    <Screen scroll={false}>
      <Title>{username}</Title>
      <View style={{ flexDirection: "row", gap: space.md }}>
        <Stat label="Total points" value={(me?.total_points ?? 0).toLocaleString("en")} />
        <Stat label="Cards played" value={String(me?.cards_played ?? 0)} />
      </View>
      <ErrorText>{error}</ErrorText>
      <Text style={{ fontSize: 20, fontWeight: "800", color: theme.text }}>My posts</Text>
      <FlatList
        data={me?.items ?? []}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Body muted>No posts yet. Use the Post tab to add one.</Body>}
        contentContainerStyle={{ gap: space.sm, paddingBottom: space.md }}
        renderItem={({ item }) => (
          <Card style={{ flexDirection: "row", gap: space.md, alignItems: "center", padding: space.sm }}>
            <Image source={item.image_url} style={{ width: 64, height: 64, borderRadius: radius.sm }} contentFit="cover" />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontWeight: "800", color: theme.text }}>{item.name}</Text>
              <Text style={{ color: theme.muted }}>
                {formatMoney(item.price.amount, item.price.currency)} · {flagEmoji(item.city.country_code)} {item.city.name}
              </Text>
            </View>
          </Card>
        )}
      />
      <Button label="Sign out" variant="secondary" onPress={signOut} style={{ marginBottom: space.md }} />
    </Screen>
  );
}
