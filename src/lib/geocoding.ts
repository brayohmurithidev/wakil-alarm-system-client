// Reverse geocoding (lat/lng -> human-readable address) for dispatcher-facing
// alarm displays. Uses the client-side Maps JS Geocoder rather than Google's
// server-side Geocoding REST endpoint, because that REST endpoint doesn't
// send CORS headers and can't be called directly from browser JS.
//
// AlarmNotification renders globally on every route (not just the map page),
// so unlike AlarmMap.tsx we can't assume @vis.gl/react-google-maps's
// <APIProvider> has already loaded the Maps script - this loads it itself
// on first use, reusing an in-flight/already-loaded script if one exists
// instead of injecting a second copy.

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

let loadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
    return Promise.resolve();
  }

  if (loadPromise) return loadPromise;

  const rawPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]',
    );

    if (existing) {
      // Already loading elsewhere (e.g. AlarmMap's <APIProvider>) - poll
      // for it to finish instead of injecting a second <script> tag, which
      // Google's loader warns/errors on. The outer withTimeout() below
      // bounds how long this polls for.
      const interval = setInterval(() => {
        if (window.google?.maps?.Geocoder) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });

  // A blocked/stalled script request (ad-blocker, CSP, flaky network)
  // doesn't always reliably fire onerror, and the "existing script" poll
  // above has no natural end either - both would otherwise hang this
  // forever and leave the UI on "Resolving address..." indefinitely.
  loadPromise = withTimeout(
    rawPromise,
    10000,
    "Timed out loading Google Maps script",
  ).catch((error) => {
    // Let the next call retry instead of permanently caching a failure.
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

// Keyed to 5dp (~1m precision) - plenty for dedup, and alarms don't move
// enough between updates for coarser rounding to matter.
const addressCache = new Map<string, string>();

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = addressCache.get(key);
  if (cached) return cached;

  try {
    await loadGoogleMapsScript();

    const geocoder = new google.maps.Geocoder();
    const address = await withTimeout(
      new Promise<string | null>((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            resolve(results[0].formatted_address);
          } else {
            resolve(null);
          }
        });
      }),
      10000,
      "Timed out waiting for geocode response",
    );

    if (address) addressCache.set(key, address);
    return address;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}
