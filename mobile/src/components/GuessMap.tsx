// World map for the location guess (MapLibre with OpenStreetMap-based vector tiles).
// - Before the reveal: tap anywhere to place your pin.
// - After the reveal: your pin, the real city and a dashed line between them.
// Tiles come from OpenFreeMap for now (free, no key); production will self-host them.
import { Camera, GeoJSONSource, Layer, Map, Marker, type CameraRef } from "@maplibre/maplibre-react-native";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/lib/theme";

const STYLE_URL = process.env.EXPO_PUBLIC_MAP_STYLE_URL ?? "https://tiles.openfreemap.org/styles/positron";

export type LatLon = { lat: number; lon: number };

type Props = {
  pin: LatLon | null;
  onPin?: (p: LatLon) => void;
  answer?: LatLon | null; // the real city, shown after the guess
  // Points of screen covered by overlays (header on top; button or reveal sheet at the bottom).
  // Used so the zoom-to-answer and the map credits stay in the visible part of the map.
  insets?: { top: number; bottom: number };
};

function Dot({ color, size = 22 }: { color: string; size?: number }) {
  return <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />;
}

export function GuessMap({ pin, onPin, answer, insets = { top: 0, bottom: 0 } }: Props) {
  const theme = useTheme();
  const camera = useRef<CameraRef>(null);

  // When the answer arrives, zoom so both the pin and the real city are visible.
  useEffect(() => {
    if (!answer || !pin) return;
    const west = Math.min(pin.lon, answer.lon), east = Math.max(pin.lon, answer.lon);
    const south = Math.min(pin.lat, answer.lat), north = Math.max(pin.lat, answer.lat);
    camera.current?.fitBounds([west, south, east, north],
      { padding: { top: insets.top + 50, bottom: insets.bottom + 50, left: 60, right: 60 }, duration: 900 });
  }, [answer, pin, insets.top, insets.bottom]);

  return (
    <Map style={StyleSheet.absoluteFill} mapStyle={STYLE_URL} logo={false} compass={false}
         touchRotate={false} touchPitch={false} attribution
         attributionPosition={{ bottom: insets.bottom + 8, right: 8 }}
         onPress={(e) => {
           if (!onPin || answer) return;
           const [lon, lat] = e.nativeEvent.lngLat;
           onPin({ lat, lon });
         }}>
      <Camera ref={camera} initialViewState={{ center: [12, 28], zoom: 0.8 }} maxZoom={12} />
      {answer && pin ? (
        <GeoJSONSource id="guess-line" data={{ type: "Feature", properties: {},
          geometry: { type: "LineString", coordinates: [[pin.lon, pin.lat], [answer.lon, answer.lat]] } }}>
          <Layer type="line" id="guess-line-layer"
                 paint={{ "line-color": theme.primary, "line-width": 3, "line-dasharray": [2, 2] }} />
        </GeoJSONSource>
      ) : null}
      {pin ? <Marker id="pin" lngLat={[pin.lon, pin.lat]}><Dot color={theme.primary} /></Marker> : null}
      {answer ? <Marker id="answer" lngLat={[answer.lon, answer.lat]}><Dot color={theme.higher} size={26} /></Marker> : null}
    </Map>
  );
}

const styles = StyleSheet.create({
  dot: { borderWidth: 4, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4,
         shadowOffset: { width: 0, height: 2 } },
});
