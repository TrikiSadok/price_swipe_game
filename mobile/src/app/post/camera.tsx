// In-app camera. The photo keeps its background (clues are part of the game).
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Body, Button, Screen } from "@/components/ui";
import { setDraftPhoto } from "@/lib/draft";

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Screen>
        <Body style={{ marginTop: 60 }}>Price Swipe needs the camera to take product photos.</Body>
        <Button label="Allow" onPress={requestPermission} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Screen>
    );
  }

  async function capture() {
    if (!camera.current || busy) return;
    setBusy(true);
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.8 });
      setDraftPhoto({ uri: photo.uri, width: photo.width, height: photo.height });
      router.replace("/post/details");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
      <SafeAreaView style={styles.controls} edges={["bottom"]}>
        <Button label="Cancel" variant="ghost" color="#fff" onPress={() => router.back()} />
        <Pressable accessibilityLabel="Capture" onPress={capture} style={styles.shutter}>
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={{ width: 90 }} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { position: "absolute", bottom: 0, start: 0, end: 0, flexDirection: "row",
              alignItems: "center", justifyContent: "space-between", padding: 24 },
  shutter: { width: 84, height: 84, borderRadius: 42, borderWidth: 5, borderColor: "#fff",
             alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff" },
});
