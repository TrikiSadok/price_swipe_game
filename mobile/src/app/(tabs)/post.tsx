// Post tab, step 1: take a photo in the app, or pick one from the photo library.
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Text } from "react-native";
import { Body, Button, Screen, Title } from "@/components/ui";
import { setDraftPhoto } from "@/lib/draft";

export default function PostStart() {
  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled) return;
    const { uri, width, height } = result.assets[0];
    setDraftPhoto({ uri, width, height });
    router.push("/post/details");
  }

  return (
    <Screen>
      <Text style={{ fontSize: 64, marginTop: 24 }}>📸</Text>
      <Title>Post a price</Title>
      <Body muted>
        Snap a product you see in a shop, market or street, with its real price. Backgrounds are
        welcome: they're clues!
      </Body>
      <Button label="Take a photo" onPress={() => router.push("/post/camera")} />
      <Button label="Choose from my photos" variant="secondary" onPress={pickFromLibrary} />
    </Screen>
  );
}
