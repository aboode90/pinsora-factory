# Category Page Image Alignment Fix

The goal is to ensure that the `/categories` page displays relevant images for each category. Currently, parent categories may show an emoji or a "wrong" image if they don't have images directly assigned to them. We will update the system to pull the latest image from the category's own hierarchy (including subcategories) to use as its cover image.

## Proposed Changes

### [Frontend] Category Page Improvements

#### [page.tsx](file:///C:/pannitrest/pixelvault/src/app/categories/page.tsx)

- Update the Prisma query to fetch:
    - Images directly in the parent category.
    - Child categories.
    - Images directly in those child categories.
- Improve the display logic:
    - Calculate total image count across the entire hierarchy (parent + all children).
    - Select a cover image with the following priority:
        1. `category.coverImage` (field in DB).
        2. Latest image directly in the parent category.
        3. Latest image from any of the child categories.
    - Fallback to an improved emoji/gradient only if no images exist in the entire hierarchy.

#### [category-card.tsx](file:///C:/pannitrest/pixelvault/src/components/categories/category-card.tsx)

- Update to match the "Smart Cover Image" logic if used elsewhere.

### [Backend] Admin Category Management

#### [category-manager.tsx](file:///C:/pannitrest/pixelvault/src/components/admin/category-manager.tsx)

- Add a `coverImage` input field to the category edit/create forms.
- This allows administrators to manually override the automatically selected image for any category.

#### [route.ts](file:///C:/pannitrest/pixelvault/src/app/api/categories/route.ts)

- Ensure `coverImage` is correctly handled in the POST/PATCH handlers.

---

### [Utility] Data Maintenance (Optional)

#### [NEW] [sync-covers.ts](file:///C:/pannitrest/pixelvault/src/app/api/admin/sync-covers/route.ts)

- Create a one-time API route to iterate through all categories and set their `coverImage` field in the database based on the latest image in their hierarchy. This "fixes" existing categories immediately.

## Verification Plan

### Manual Verification
- Navigate to `/categories` and verify:
    - Every category has a relevant image if it contains images (even if they are in subcategories).
    - Image counts are correct (e.g., "Nature" includes "Mountains", "Forests", etc.).
    - Hover effects and links still work correctly.
- Test the Admin panel:
    - Try setting a specific `coverImage` for a category and verify it appears on the main page.
