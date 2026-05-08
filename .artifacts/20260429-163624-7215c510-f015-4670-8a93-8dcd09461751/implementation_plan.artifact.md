# Fix React Hook Violation (Error #310)

Comprehensive fix for "Minified React error #310" (Rendered more hooks than during the previous render) across multiple pages. This error is caused by early returns (Auth Guards) placed before hook declarations (like `useCallback`, `useQuery`, or `useMutation`).

## User Review Required

> [!NOTE]
> This change is purely structural and does not affect the functionality of the app. It ensures compliance with React's Rules of Hooks.

## Proposed Changes

### Core Pages

Refactor the following pages to move all Hook declarations to the top-level of the component, before any conditional logic or early returns.

#### [Settings Page](file:///C:/pinsora/pixelvault/src/app/settings/page.tsx)
- Move `checkUsername` (useCallback) to the top, before the `status === "unauthenticated"` check.

#### [Upload Page](file:///C:/pinsora/pixelvault/src/app/upload/page.tsx)
- Move `updateAlbumItem`, `removeAlbumItem`, and `handleDrop` (useCallback) to the top.

#### [Profile Page](file:///C:/pinsora/pixelvault/src/app/profile/page.tsx)
- Move the two `useQuery` calls to the top, before the auth guard.

#### [Boards Page](file:///C:/pinsora/pixelvault/src/app/boards/page.tsx)
- Move `useQuery`, `createMutation`, and `deleteMutation` to the top.

#### [Notifications Page](file:///C:/pinsora/pixelvault/src/app/notifications/page.tsx)
- Move `fetchPage` (useCallback) to the top.

---

### Components

#### [Infinite Scroll](file:///C:/pinsora/pixelvault/src/components/images/infinite-scroll.tsx)
- Perform a final check to ensure no hidden hook violations exist in the prefetching logic.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure the project compiles without errors.
- (Note: Error #310 is a runtime error, so build won't catch it unless there are static analysis rules for hooks).

### Manual Verification
1. Navigate to the Home page.
2. Click on the Profile, Boards, and Settings pages while logged in.
3. Refresh these pages multiple times.
4. Try to access these pages while logged out (should redirect correctly).
5. Verify that the "This page couldn’t load" error no longer appears in the console.
