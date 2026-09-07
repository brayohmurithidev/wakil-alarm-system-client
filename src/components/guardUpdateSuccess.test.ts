import { describe, expect, it, vi } from "vitest";

import { handleGuardUpdateSuccess } from "./EditGuardDialog";

// Guard Onboarding Acceptance Fix (Failure 3) - "after changing the email
// of a Guard who is still mustChangePassword=true, the administrator was
// not told to resend the login code", confirmed by physical staging
// testing. Traced end-to-end (PATCH -> API response -> useUpdateGuard ->
// EditGuardDialog -> toast) before making any change: both the API's
// emailChangeNotice field and this component's handling of it were
// already correct and covered by the API-side tests
// (guardLifecycleNotifications.test.ts) - what these tests add is the
// actual frontend response-handling behavior itself (extracted as
// handleGuardUpdateSuccess so it's testable without a component-render
// harness, which this repo doesn't have), plus the one concrete
// improvement made here: the notice no longer auto-dismisses.

function mockDeps() {
  const notifyMock = vi.fn();
  return {
    notifyMock,
    notify: notifyMock as unknown as typeof import("@/components/Alert/notify").notify,
    onOpenChange: vi.fn(),
  };
}

describe("handleGuardUpdateSuccess", () => {
  it("always shows the success message first", () => {
    const deps = mockDeps();
    handleGuardUpdateSuccess({ message: "Guard updated successfully", guard: {} as any }, deps);

    expect(deps.notifyMock).toHaveBeenCalledWith("Guard updated successfully", { type: "success" });
  });

  it("shows no second toast when emailChangeNotice is absent (unrelated edit, e.g. name/phone/rank only)", () => {
    const deps = mockDeps();
    handleGuardUpdateSuccess({ message: "Guard updated successfully", guard: {} as any }, deps);

    expect(deps.notifyMock).toHaveBeenCalledTimes(1);
  });

  it("shows no second toast for an already-onboarded guard (API never sends emailChangeNotice for one)", () => {
    const deps = mockDeps();
    // Simulates exactly what the API returns for an onboarded guard's
    // email edit - no emailChangeNotice key at all.
    handleGuardUpdateSuccess(
      { message: "Guard updated successfully", guard: {} as any },
      deps,
    );

    expect(deps.notifyMock).toHaveBeenCalledTimes(1);
    expect(deps.notifyMock).not.toHaveBeenCalledWith(
      expect.stringContaining("previous email"),
      expect.anything(),
    );
  });

  it("shows a distinct, persistent warning toast when a pending guard's email actually changed", () => {
    const deps = mockDeps();
    const notice =
      "This guard's login code was already sent to their previous email address. Use Resend Login Code to send a new one to the updated address.";

    handleGuardUpdateSuccess(
      { message: "Guard updated successfully", guard: {} as any, emailChangeNotice: notice },
      deps,
    );

    expect(deps.notifyMock).toHaveBeenCalledTimes(2);
    expect(deps.notifyMock).toHaveBeenNthCalledWith(1, "Guard updated successfully", {
      type: "success",
    });
    // The acceptance criteria requires a "clearly visible" message -
    // autoClose: false is what makes this toast stay until the admin
    // explicitly dismisses it, rather than fading with the default 6s
    // every other toast uses.
    expect(deps.notifyMock).toHaveBeenNthCalledWith(2, notice, {
      type: "warning",
      autoClose: false,
    });
  });

  it("mentions the previous destination and points at Resend Login Code - not a generic message", () => {
    const deps = mockDeps();
    const notice =
      "This guard's login code was already sent to their previous email address. Use Resend Login Code to send a new one to the updated address.";

    handleGuardUpdateSuccess(
      { message: "Guard updated successfully", guard: {} as any, emailChangeNotice: notice },
      deps,
    );

    const warningCall = deps.notifyMock.mock.calls.find(
      (call) => call[1]?.type === "warning",
    );
    expect(warningCall?.[0]).toMatch(/previous email/i);
    expect(warningCall?.[0]).toMatch(/resend login code/i);
  });

  it("does not treat an empty-string emailChangeNotice as present (defensive - the API only ever sends a real sentence or omits the key)", () => {
    const deps = mockDeps();
    handleGuardUpdateSuccess(
      { message: "Guard updated successfully", guard: {} as any, emailChangeNotice: "" },
      deps,
    );

    expect(deps.notifyMock).toHaveBeenCalledTimes(1);
  });

  it("always closes the dialog, regardless of whether a notice was shown", () => {
    const withNotice = mockDeps();
    handleGuardUpdateSuccess(
      { message: "Guard updated successfully", guard: {} as any, emailChangeNotice: "x" },
      withNotice,
    );
    expect(withNotice.onOpenChange).toHaveBeenCalledWith(false);

    const withoutNotice = mockDeps();
    handleGuardUpdateSuccess({ message: "Guard updated successfully", guard: {} as any }, withoutNotice);
    expect(withoutNotice.onOpenChange).toHaveBeenCalledWith(false);
  });
});
