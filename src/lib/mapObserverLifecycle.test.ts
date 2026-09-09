// Regression tests for the production console errors this file's
// mapObserverLifecycle.ts was extracted to fix - see that file's header for
// the full root-cause narrative. No jsdom/testing-library dependency: a
// minimal, spy-able fake Element/ResizeObserver is enough to exercise the
// actual guard logic (isObservableElement checks `instanceof Element`
// against whatever the global Element happens to be - these fakes just
// stand in for it, exactly like the real DOM class would).
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  addMapListenerOnce,
  isObservableElement,
  observeResize,
} from "./mapObserverLifecycle";

class FakeElement {}
class NotAnElement {}

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observed: unknown[] = [];
  disconnected = false;
  callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }
  observe(target: unknown) {
    this.observed.push(target);
  }
  disconnect() {
    this.disconnected = true;
  }
}

beforeEach(() => {
  FakeResizeObserver.instances = [];
});

describe("isObservableElement", () => {
  it("is true for a real Element instance", () => {
    vi.stubGlobal("Element", FakeElement);
    expect(isObservableElement(new FakeElement())).toBe(true);
  });

  it("is false for null, undefined, and a plain object shaped like an element", () => {
    vi.stubGlobal("Element", FakeElement);
    expect(isObservableElement(null)).toBe(false);
    expect(isObservableElement(undefined)).toBe(false);
    expect(isObservableElement({ tagName: "DIV" })).toBe(false);
  });

  it("is false for an instance of an unrelated class", () => {
    vi.stubGlobal("Element", FakeElement);
    expect(isObservableElement(new NotAnElement())).toBe(false);
  });

  it("is false (not a throw) when Element itself doesn't exist in this environment", () => {
    vi.stubGlobal("Element", undefined);
    expect(isObservableElement({})).toBe(false);
  });
});

describe("observeResize — the ResizeObserver production error", () => {
  // "Failed to execute 'observe' on 'ResizeObserver': parameter 1 is not
  // of type 'Element'" — reproduces MapResizeHandler calling
  // observer.observe(map.getDiv()) at the exact moment map.getDiv() isn't
  // a live Element (the torn-down-map race described in
  // mapObserverLifecycle.ts). The real ResizeObserver throws synchronously
  // inside .observe(); this proves the wrapper never reaches that call at
  // all for a bad target, rather than merely swallowing that throw.
  beforeEach(() => {
    vi.stubGlobal("Element", FakeElement);
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });

  it("observer target absent during mount: does not call .observe() and does not throw", () => {
    expect(() => observeResize(null, () => {})).not.toThrow();
    expect(() => observeResize(undefined, () => {})).not.toThrow();
    expect(FakeResizeObserver.instances).toHaveLength(0);
  });

  it("existing behavior still works with a valid Element: observes it and disconnects on stop()", () => {
    const target = new FakeElement();
    const handle = observeResize(target, () => {});

    expect(FakeResizeObserver.instances).toHaveLength(1);
    expect(FakeResizeObserver.instances[0].observed).toEqual([target]);
    expect(FakeResizeObserver.instances[0].disconnected).toBe(false);

    handle.stop();
    expect(FakeResizeObserver.instances[0].disconnected).toBe(true);
  });

  it("observer target disappearing during cleanup/unmount: stop() is safe to call more than once", () => {
    const handle = observeResize(new FakeElement(), () => {});
    expect(() => {
      handle.stop();
      handle.stop();
      handle.stop();
    }).not.toThrow();
    expect(FakeResizeObserver.instances[0].disconnected).toBe(true);
  });

  it("a no-op handle's stop() is also always safe to call", () => {
    const handle = observeResize(null, () => {});
    expect(() => handle.stop()).not.toThrow();
  });

  it("falls back to a no-op when ResizeObserver doesn't exist in this environment", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    expect(() => observeResize(new FakeElement(), () => {})).not.toThrow();
  });
});

describe("addMapListenerOnce — the `.remove()` production error", () => {
  // "Cannot read properties of undefined (reading 'remove')" —
  // TilesLoadedHandler's original `listener.remove()` assumed
  // map.addListener() always hands back something with a callable
  // .remove(). This proves cleanup never reads .remove() off an undefined
  // value, regardless of why one was never assigned.
  function fakeMap(addListenerImpl?: () => { remove: () => void } | undefined) {
    return {
      addListener: vi.fn(addListenerImpl ?? (() => ({ remove: vi.fn() }))),
    } as unknown as google.maps.Map;
  }

  it("observer target absent during mount: a null map does not call addListener and stop() never throws", () => {
    const handle = addMapListenerOnce(null, "tilesloaded", () => {});
    expect(() => handle.stop()).not.toThrow();
  });

  it("existing behavior still works with a valid map: fires the handler once and removes the listener", () => {
    const remove = vi.fn();
    let registeredHandler: (() => void) | undefined;
    const map = fakeMap(() => {
      return { remove };
    });
    (map.addListener as ReturnType<typeof vi.fn>).mockImplementation(
      (_event: string, handler: () => void) => {
        registeredHandler = handler;
        return { remove };
      },
    );

    const onLoaded = vi.fn();
    addMapListenerOnce(map, "tilesloaded", onLoaded);

    expect(map.addListener).toHaveBeenCalledWith("tilesloaded", expect.any(Function));
    registeredHandler?.();

    expect(onLoaded).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it("observer target disappearing during cleanup/unmount: stop() is safe even if addListener returns undefined", () => {
    const map = fakeMap(() => undefined);
    const handle = addMapListenerOnce(map, "tilesloaded", () => {});
    expect(() => handle.stop()).not.toThrow();
  });

  it("calling stop() twice (event firing, then unmount cleanup racing it) removes the listener exactly once", () => {
    const remove = vi.fn();
    const map = fakeMap(() => ({ remove }));
    const handle = addMapListenerOnce(map, "tilesloaded", () => {});

    handle.stop();
    handle.stop();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
