// Demo sign-in: pick a username. (The full app uses e-mail codes and Apple/Google sign-in.)
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { Body, Button, ErrorText, Field, Screen, Title } from "@/components/ui";
import { errorText } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export default function SignIn() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signIn(username.trim());
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <View style={{ marginTop: 60, marginBottom: 24, alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 72 }}>🛒</Text>
          <Title style={{ color: theme.primary, fontSize: 40 }}>Price Swipe</Title>
          <Body muted style={{ textAlign: "center" }}>Guess real prices from around the world.</Body>
        </View>
        <Field label="Pick a username" placeholder="e.g. traveller_42" value={username}
               onChangeText={setUsername} autoCapitalize="none" autoCorrect={false}
               returnKeyType="go" onSubmitEditing={submit} maxLength={20} />
        <ErrorText>{error}</ErrorText>
        <Button label="Start playing" onPress={submit} loading={busy}
                disabled={username.trim().length < 3} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
