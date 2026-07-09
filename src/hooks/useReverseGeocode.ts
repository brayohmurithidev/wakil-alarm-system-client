import { useEffect, useRef, useState } from "react";

import { reverseGeocode } from "@/lib/geocoding";

// undefined = lookup in flight (or no valid coordinates yet), null = lookup
// failed/unavailable (caller should fall back to raw coordinates), string =
// resolved address.
//
// Pass NaN for lat/lng (or call before the real coordinates are known - e.g.
// a page whose alarm query hasn't resolved yet, but which can't call this
// hook conditionally per React's rules of hooks) to skip the lookup entirely
// rather than firing a wasted geocode request for placeholder coordinates.
export function useReverseGeocode(
  lat: number,
  lng: number,
): string | null | undefined {
  const [address, setAddress] = useState<string | null | undefined>(
    undefined,
  );
  // Guards against duplicate in-flight requests for the same coordinates
  // across re-renders, without needing an effect cleanup/cancellation dance
  // - reverseGeocode() itself is cached by rounded coordinates anyway.
  const requestedKey = useRef<string | null>(null);

  useEffect(() => {
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    const key = `${lat},${lng}`;
    if (requestedKey.current === key) return;
    requestedKey.current = key;

    setAddress(undefined);
    reverseGeocode(lat, lng).then((result) => {
      setAddress(result);
    });
  }, [lat, lng]);

  return address;
}
