export type MapTheme = "dark" | "light";

const MAP_THEME_KEY = "map:theme";

export function getStoredMapTheme(): MapTheme {
  return localStorage.getItem(MAP_THEME_KEY) === "light" ? "light" : "dark";
}

export function storeMapTheme(theme: MapTheme): void {
  localStorage.setItem(MAP_THEME_KEY, theme);
}

// Guard markers render as `AdvancedMarker` (real avatar photos), which
// requires a vector-rendered map tied to a Google Map ID — Google ignores a
// client-side JS `styles` array whenever a Map ID is present, so a real
// dark/light switch has to be two different Map IDs rather than one map ID
// plus a style array. `VITE_GOOGLE_MAPS_MAP_ID_LIGHT` is optional: if ops
// hasn't provisioned a light-styled Map ID in the Google Cloud console yet,
// this falls back to the same (dark) Map ID so the toggle still works end
// to end — it just won't look different until that second ID exists.
export function resolveMapId(theme: MapTheme): string {
  const darkMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID";
  const lightMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID_LIGHT?.trim();

  if (theme === "light" && lightMapId) return lightMapId;
  return darkMapId;
}
