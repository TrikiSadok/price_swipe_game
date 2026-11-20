// Post step 2: where it is sold, what it is, how much. Then upload.
import { File } from "expo-file-system";
import { Image } from "expo-image";
import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { Button, Chip, ErrorText, Field, Screen } from "@/components/ui";
import { api, errorText } from "@/lib/api";
import { getDraftPhoto, setDraftPhoto } from "@/lib/draft";
import { flagEmoji, parseAmount } from "@/lib/format";
import { radius, space, useTheme } from "@/lib/theme";

type City = { id: number; name: string; country_code: string; country_name: string; currency: string };
const UNITS = ["g", "kg", "ml", "L", "piece"];

export default function PostDetails() {
  const theme = useTheme();
  const photo = getDraftPhoto();
  const [cities, setCities] = useState<City[]>([]);
  const [city, setCity] = useState<City | null>(null);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("piece");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ cities: City[] }>("/cities").then((res) => setCities(res.cities))
      .catch((e) => setError(errorText(e)));
  }, []);

  const priceValue = parseAmount(price);
  const quantityValue = parseAmount(quantity);
  const ready = !!(photo && city && name.trim().length >= 2 && priceValue && quantityValue);
  const shown = cities.filter((c) => `${c.name} ${c.country_name}`.toLowerCase()
    .includes(search.trim().toLowerCase()));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      // Expo's fetch needs a real Blob-like file, so the photo is wrapped in expo-file-system's File.
      form.append("photo", new File(photo!.uri));
      form.append("name", name.trim());
      form.append("quantity", String(quantityValue));
      form.append("unit", unit);
      form.append("price", String(priceValue));
      form.append("city_id", String(city!.id));
      await api("/items", { method: "POST", body: form });
      setDraftPhoto(null);
      Alert.alert("Posted! 🎉", "Other players can now guess your item.");
      router.replace("/(tabs)/me");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  if (!photo) return <Redirect href="/(tabs)/post" />;

  return (
    <Screen safeTop={false}>
      <Image source={photo.uri} style={{ width: "100%", height: 240, borderRadius: radius.lg }}
             contentFit="cover" />

      <Text style={{ color: theme.text, fontWeight: "700" }}>Where is it sold?</Text>
      <Chip label={city ? `${flagEmoji(city.country_code)} ${city.name}` : "Choose a city"}
            selected={!!city} onPress={() => setPicking(true)} />

      <Field label="Item name" placeholder="e.g. Bananas" value={name} onChangeText={setName} maxLength={80} />

      <Text style={{ color: theme.text, fontWeight: "700" }}>Size or quantity</Text>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
        <TextInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad"
                   style={{ width: 80, minHeight: 44, borderWidth: 1.5, borderRadius: radius.md,
                            borderColor: theme.border, backgroundColor: theme.surface,
                            color: theme.text, fontSize: 17, paddingHorizontal: space.sm }} />
        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", paddingTop: space.sm }}>
          {UNITS.map((u) => <Chip key={u} label={u} selected={unit === u} onPress={() => setUnit(u)} />)}
        </View>
      </View>

      <Field label={`Price${city ? ` (${city.currency})` : ""}`} value={price} onChangeText={setPrice}
             keyboardType="decimal-pad" placeholder="0.00" />

      <ErrorText>{error}</ErrorText>
      <Button label="Post" onPress={submit} loading={busy} disabled={!ready} />
      <View style={{ height: 40 }} />

      <Modal visible={picking} animationType="slide" presentationStyle="pageSheet"
             onRequestClose={() => setPicking(false)}>
        <View style={{ flex: 1, backgroundColor: theme.background, padding: space.md }}>
          <Field label="City" placeholder="Search" value={search} onChangeText={setSearch} autoCorrect={false} />
          <FlatList data={shown} keyExtractor={(c) => String(c.id)} keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable onPress={() => { setCity(item); setPicking(false); }}
                         style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.text, fontSize: 17 }}>
                  {flagEmoji(item.country_code)}  {item.name}, {item.country_name}
                </Text>
              </Pressable>
            )} />
        </View>
      </Modal>
    </Screen>
  );
}
