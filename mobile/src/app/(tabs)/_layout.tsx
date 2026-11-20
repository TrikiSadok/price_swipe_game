// Bottom tabs: Play, Post, Me. Icons are Apple SF Symbols (iOS).
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ColorValue } from "react-native";
import { useTheme } from "@/lib/theme";

export default function TabsLayout() {
  const theme = useTheme();
  const icon = (name: "gamecontroller.fill" | "camera.fill" | "person.crop.circle.fill") =>
    function TabIcon({ color }: { color: ColorValue }) {
      return <SymbolView name={name} tintColor={color} size={26} />;
    };
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: theme.muted,
      tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
    }}>
      <Tabs.Screen name="index" options={{ title: "Play", tabBarIcon: icon("gamecontroller.fill") }} />
      <Tabs.Screen name="post" options={{ title: "Post", tabBarIcon: icon("camera.fill") }} />
      <Tabs.Screen name="me" options={{ title: "Me", tabBarIcon: icon("person.crop.circle.fill") }} />
    </Tabs>
  );
}
