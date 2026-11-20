// Small building blocks shared by all screens: screen frame, text, button, card, chip, field.
// Spacing uses start/end (not left/right) so Arabic right-to-left layouts mirror correctly.
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
         type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { radius, space, useTheme } from "@/lib/theme";

/** Full-screen frame with the theme background; scrolls by default.
 *  `safeTop={false}` on screens with a navigation header (the header already covers the notch). */
export function Screen({ children, scroll = true, style, safeTop = true }:
                       { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle>;
                         safeTop?: boolean }) {
  const theme = useTheme();
  const inner = <View style={[styles.screenInner, style]}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={safeTop ? ["top"] : []}>
      {scroll ? (
        // automaticallyAdjustKeyboardInsets: iOS scrolls the focused field above the keyboard.
        // keyboardDismissMode: dragging the screen down hides the keyboard.
        <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets
                    keyboardDismissMode="interactive">
          {inner}
        </ScrollView>
      ) : inner}
    </SafeAreaView>
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.title, { color: theme.text }, style]}>{children}</Text>;
}

export function Body({ children, muted, style }:
                     { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  const theme = useTheme();
  return <Text style={[styles.body, { color: muted ? theme.muted : theme.text }, style]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Big rounded button. `color` overrides the primary colour (e.g. green for "Higher"). */
export function Button({ label, onPress, variant = "primary", color, loading, disabled, style,
                         testID }: ButtonProps) {
  const theme = useTheme();
  const bg = variant === "primary" ? color ?? theme.primary
    : variant === "secondary" ? theme.surface : "transparent";
  const fg = variant === "primary" ? theme.primaryText : color ?? theme.primary;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === "secondary" ? theme.border : bg,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> :
        <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border,
                                 shadowColor: theme.shadow }, style]}>
      {children}
    </View>
  );
}

/** Selectable pill (units, store types, cities...). */
export function Chip({ label, selected, onPress }:
                     { label: string; selected?: boolean; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}
      style={[styles.chip, { borderColor: selected ? theme.primary : theme.border,
                             backgroundColor: selected ? theme.primary : theme.surface }]}>
      <Text style={{ color: selected ? theme.primaryText : theme.text, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

/** Labelled text input. */
export function Field({ label, hint, ...input }: TextInputProps & { label: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: space.xs, marginBottom: space.md }}>
      <Text style={{ color: theme.text, fontWeight: "700" }}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.muted}
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        {...input}
        style={[styles.input, { color: theme.text, borderColor: theme.border,
                                backgroundColor: theme.surface }, input.style]}
      />
      {hint ? <Text style={{ color: theme.muted, fontSize: 13 }}>{hint}</Text> : null}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  const theme = useTheme();
  if (!children) return null;
  return <Text style={{ color: theme.danger, marginVertical: space.sm, fontWeight: "600" }}>{children}</Text>;
}

const styles = StyleSheet.create({
  screenInner: { padding: space.md, gap: space.md, flexGrow: 1 },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  body: { fontSize: 16, lineHeight: 22 },
  button: { minHeight: 56, borderRadius: radius.lg, borderWidth: 1.5, alignItems: "center",
            justifyContent: "center", paddingHorizontal: space.lg },
  buttonText: { fontSize: 18, fontWeight: "800" },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space.md,
          shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 16, elevation: 4 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5,
          marginEnd: space.sm, marginBottom: space.sm },
  input: { borderWidth: 1.5, borderRadius: radius.md, paddingHorizontal: space.md, minHeight: 52,
           fontSize: 17 },
});
