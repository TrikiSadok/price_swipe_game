// Playful colour palette with light and dark variants. Screens read colours through
// useTheme() so dark mode "just works".
import { useColorScheme } from "react-native";

const light = {
  background: "#FFF8F0",
  surface: "#FFFFFF",
  text: "#1E1B2E",
  muted: "#6B6680",
  border: "#EDE6DC",
  primary: "#6C4CF5", // violet
  primaryText: "#FFFFFF",
  higher: "#14B87A", // green: "real price is higher"
  lower: "#FF5A5F", // coral: "real price is lower"
  accent: "#FFB627", // sunny yellow for points
  danger: "#E5484D",
  shadow: "rgba(30, 27, 46, 0.12)",
};

const dark: typeof light = {
  background: "#14121C",
  surface: "#1F1C2B",
  text: "#F4F1FA",
  muted: "#A8A3BA",
  border: "#2E2A3D",
  primary: "#8E75FF",
  primaryText: "#FFFFFF",
  higher: "#2BD494",
  lower: "#FF7378",
  accent: "#FFC64D",
  danger: "#FF6B70",
  shadow: "rgba(0, 0, 0, 0.4)",
};

export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? dark : light;
}

export const radius = { sm: 10, md: 16, lg: 28 };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
