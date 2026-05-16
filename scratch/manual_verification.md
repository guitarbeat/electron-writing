# Smeemo Manual Verification Guide

This guide details how to verify the core tracker and auth functionality. Due to the refactor, the state is strictly owned by `App.tsx` and distributed via props, ensuring robust sync between dashboard UI and application-level auth routing.

## 1. Login Verification
**Goal:** Verify a valid passcode unlocks the dashboard and persists state.
- **Action:** Open the app and enter the shared passcode (e.g. `0000`).
- **Expected:** The app should transition from `PasscodeScreen` to `Dashboard`. The `useTracker` hook inside `App.tsx` correctly resolves `isAuthorized` as true.

## 2. Logout Verification
**Goal:** Verify that hitting "Logout" inside the Dashboard forces `App.tsx` to immediately render the `PasscodeScreen`.
- **Action:** Click "Logout" from the `DashboardHeader` menu.
- **Expected:** The server clears the session cookie, and `logout()` updates the `isAuthorized` state locally in `App.tsx` to `false`. The application should instantaneously animate back to `PasscodeScreen`. The dashboard unmounts, cleaning up all polling.

## 3. Saving Entries
**Goal:** Verify that when creating or editing an entry, the state updates within the tracker context.
- **Action:** In the `DailyTimelineLedger`, add a new word count for today.
- **Expected:** The data saves via the API. `saveEntry` calls `fetchEntries()`, causing `App.tsx` to receive updated `entries`. The `Dashboard` prop re-renders with new totals.

## 4. Settings Updates
**Goal:** Verify that the setup wizard / settings dialog correctly commits changes to state.
- **Action:** Open the setup wizard. Change "Person A Name" to a new value. Save.
- **Expected:** `updateSettings` patches the server and updates local `settings` via the shared tracker. The Dashboard Header and Goals Summary should instantly reflect the newly configured names/goals.
