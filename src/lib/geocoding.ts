// Reverse geocoding (lat/lng -> human-readable address) for dispatcher-facing
// alarm displays. Uses the client-side Maps JS Geocoder rather than Google's
// server-side Geocoding REST endpoint, because that REST endpoint doesn't
// send CORS headers and can't be called directly from browser JS.
//
// The application-level APIProvider is the single owner of Maps loading.
// Reverse geocoding waits for that loader, then requests Google's modular
// geocoding library instead of injecting another Maps <script> tag.

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

let geocodingLibraryPromise: Promise<google.maps.GeocodingLibrary> | null =
  null;

function loadGeocodingLibrary(): Promise<google.maps.GeocodingLibrary> {
  if (geocodingLibraryPromise) return geocodingLibraryPromise;

  const waitForProvider = new Promise<google.maps.GeocodingLibrary>(
    (resolve, reject) => {
      const startedAt = Date.now();
      const checkProvider = () => {
        if (!window.google?.maps?.importLibrary) {
          if (Date.now() - startedAt >= 10000) {
            reject(
              new Error(
                "Timed out loading the Google Maps geocoding library",
              ),
            );
            return;
          }

          setTimeout(checkProvider, 50);
          return;
        }

        void google.maps
          .importLibrary("geocoding")
          .then(
            (library) =>
              resolve(library as google.maps.GeocodingLibrary),
            reject,
          );
      };

      checkProvider();
    },
  );

  geocodingLibraryPromise = waitForProvider.catch((error) => {
    geocodingLibraryPromise = null;
    throw error;
  });

  return geocodingLibraryPromise;
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
    const { Geocoder } = await loadGeocodingLibrary();
    const geocoder = new Geocoder();
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
