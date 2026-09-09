// Pure DOM-observer lifecycle helpers for the live map (AlarmMap.tsx).
//
// Root cause this exists to fix: the production console errors -
//   "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not
//   of type 'Element'" and "Cannot read properties of undefined (reading
//   'remove')" - both thrown synchronously inside a useEffect. This app
//   has no error boundary anywhere, so either one doesn't just log a
//   warning - it takes down the entire React tree (the map included),
//   which is why "the map isn't loading" showed up alongside them rather
//   than as a separate issue.
//
// MapResizeHandler called `observer.observe(map.getDiv())` and
// TilesLoadedHandler called `listener.remove()` on the assumption that,
// once useMap() returns a non-null map instance, the container div and
// every listener the map ever hands back stay valid for as long as the
// effect's own closure exists. That assumption breaks specifically when
// the underlying google.maps.Map instance is torn down - navigating away
// from the dashboard, or AlarmMap being remounted - while one of these
// effects is still in flight; useMap()'s returned reference can outlive
// the real map's own DOM attachment by a tick. React 19 StrictMode's
// dev-only mount -> unmount -> remount double-invoke is exactly this same
// shape, sped up and made deterministic - it doesn't run in production,
// but the non-idempotent assumption it would have caught in development
// is the same one a real, timing-dependent unmount-while-initializing race
// hits in production.
//
// TilesLoadedHandler had a second, independent bug that made that race far
// more likely to actually be hit: AlarmMap passed `onLoaded={() =>
// setTilesLoaded(true)}` as a fresh inline function on every render, and
// that value sat in the effect's own dependency array - so instead of
// running once per real mount/unmount, the whole add-listener/
// remove-listener cycle re-ran on every single re-render of the dashboard
// (every alarm/guard refetch, every socket event). See the
// handleTilesLoaded useCallback in AlarmMap.tsx for the other half of that
// fix - stabilizing the callback is what makes this cycle rare again
// rather than eliminating the underlying race, which is why the guards
// below still matter on their own.

/**
 * True only for a live DOM Element - the one thing
 * ResizeObserver.observe()/IntersectionObserver.observe() actually require
 * (they throw synchronously otherwise, per the DOM spec's WebIDL argument
 * checks). Safe to call with anything, including null, undefined, or a
 * disposed/detached reference.
 */
export function isObservableElement(target: unknown): target is Element {
  return typeof Element !== "undefined" && target instanceof Element;
}

export type ObservationHandle = { stop: () => void };

const NOOP_HANDLE: ObservationHandle = { stop: () => {} };

/**
 * Starts a ResizeObserver on `target` iff it's a real, currently-attached
 * Element and the browser supports ResizeObserver - otherwise a harmless
 * no-op handle, matching the original guard (`typeof ResizeObserver ===
 * "undefined"`) that MapResizeHandler already had, plus the missing
 * Element check. `stop()` is always safe to call, any number of times.
 */
export function observeResize(
  target: unknown,
  onResize: () => void,
): ObservationHandle {
  if (typeof ResizeObserver === "undefined" || !isObservableElement(target)) {
    return NOOP_HANDLE;
  }
  const observer = new ResizeObserver(onResize);
  observer.observe(target);
  let stopped = false;
  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      observer.disconnect();
    },
  };
}

/**
 * Adds a Google Maps event listener for one occurrence and hands back a
 * handle whose stop() is safe to call any number of times - including when
 * addListener itself never happened (map is null/undefined). This is what
 * makes cleanup safe against `listener.remove()` throwing on an undefined
 * listener, regardless of why one was never assigned, and safe against
 * being invoked twice (once when the event fires, once from React's
 * effect-cleanup on unmount).
 */
export function addMapListenerOnce(
  map: google.maps.Map | null | undefined,
  eventName: string,
  handler: () => void,
): ObservationHandle {
  if (!map) return NOOP_HANDLE;
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    listener?.remove();
  };
  const listener = map.addListener(eventName, () => {
    handler();
    stop();
  });
  return { stop };
}
