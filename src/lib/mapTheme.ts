export type MapTheme = "dark" | "light";

const MAP_THEME_KEY = "map:theme";

export function getStoredMapTheme(): MapTheme {
  return localStorage.getItem(MAP_THEME_KEY) === "light" ? "light" : "dark";
}

export function storeMapTheme(theme: MapTheme): void {
  localStorage.setItem(MAP_THEME_KEY, theme);
}

// A standard "night mode" Google Maps style. Google ignores a client-side
// style array whenever a Map ID is set, so this only works because guard/
// alarm markers use plain `Marker` icons rather than `AdvancedMarker` (which
// requires a Map ID for vector rendering) — see AlarmMap.tsx.
const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1d2330" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1d2330" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a94a6" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3a4257" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c5cbd8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a94a6" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#243024" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5c7a5c" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2c3347" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1d2330" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a94a6" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a4257" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1d2330" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#c5cbd8" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2c3347" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f1420" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a5568" }],
  },
];

// Undefined = Google's standard default roadmap style (unchanged from what
// the Dashboard has always shown).
export function resolveMapStyle(
  theme: MapTheme,
): google.maps.MapTypeStyle[] | undefined {
  return theme === "dark" ? DARK_MAP_STYLE : undefined;
}
