# Plan: Square Image Format Without Deformation

## Overview

Transform the gift image display from the current flexible aspect ratio (`h-auto`) to a fixed square format (1:1 aspect ratio) while ensuring images are properly fitted without deformation. This will create a more uniform and visually consistent gift card grid.

**Current Issue**: Images use `object-contain` with `h-auto`, causing varying heights across the grid and inconsistent card sizes.

**Solution**: Apply a fixed square aspect ratio container with `object-cover` to maintain image proportions while filling the square space.

---

## Files to Modify

### 1. `/src/components/KdosList.tsx`

**Location**: Lines 129-144 (Image container and Next.js Image component)

**Changes Required**:
- Modify the image container `div` to enforce square aspect ratio
- Change Image component from `object-contain` with `h-auto` to `object-cover` with fixed square dimensions
- Ensure the container maintains 1:1 aspect ratio using `aspect-square` utility class
- Update width/height props on the Image component to reflect square format

---

## Implementation Details

### Component Changes

#### `KdosList.tsx` - Image Container
**Current behavior**:
- Container uses `relative overflow-hidden rounded-xl` without height constraint
- Image uses `object-contain w-full h-auto` causing variable heights

**New behavior**:
- Container enforces square aspect ratio using `aspect-square` class
- Image uses `object-cover` to fill the square without deformation
- Image is centered within the square container

**CSS Classes to Update**:
- Container: Add `aspect-square` to maintain 1:1 ratio
- Image: Change from `object-contain h-auto` to `object-cover h-full`

---

## Visual Impact

### Before
- Images with varying aspect ratios (portrait, landscape, square)
- Cards have inconsistent heights
- Some images appear small, others large
- Grid appears unbalanced

### After
- All images displayed in uniform square format
- Cards have consistent heights across the grid
- Images are cropped to fit square while maintaining center focus
- Grid appears balanced and professional

---

## CSS Properties Explained

### `aspect-square`
Tailwind utility class that sets `aspect-ratio: 1 / 1`, ensuring the container maintains a perfect square regardless of content.

### `object-cover`
CSS property that scales the image to fill the container while maintaining aspect ratio. The image may be clipped to fit the square.

### `object-center` (implicit default)
Ensures the image is centered within the square container, so cropping happens equally from all sides.

---

## Potential Considerations

### Image Cropping
- Images with extreme aspect ratios (very wide or very tall) will be cropped
- The center of the image remains visible, edges may be cut off
- This is expected behavior for maintaining square format

### Hover Effects
- The existing `group-hover:scale-105` effect will continue to work
- Scaling happens within the square container
- No changes needed to hover animations

### Theme Compatibility
- Changes apply to both `default` and `christmas` themes
- No theme-specific modifications required

---

## Testing Checklist

### Visual Testing
- [ ] Verify all images display in perfect square format
- [ ] Check that images are not stretched or deformed
- [ ] Test with various image aspect ratios (portrait, landscape, square)
- [ ] Confirm hover scale effect still works properly
- [ ] Verify grayscale/blur effect on unavailable items

### Responsive Testing
- [ ] Test on mobile viewport (320px-640px)
- [ ] Test on tablet viewport (640px-1024px)
- [ ] Test on desktop viewport (1024px+)
- [ ] Verify grid layout remains responsive

### Theme Testing
- [ ] Test with `NEXT_PUBLIC_THEME=default`
- [ ] Test with `NEXT_PUBLIC_THEME=christmas`
- [ ] Verify no theme-specific visual regressions

### Edge Cases
- [ ] Test with very wide images (e.g., 1200x400)
- [ ] Test with very tall images (e.g., 400x1200)
- [ ] Test with very small images (e.g., 100x100)
- [ ] Test with missing/broken images

---

## Implementation Steps

1. **Modify Image Container** in `KdosList.tsx`
   - Add `aspect-square` class to the container div
   - Ensure container maintains square dimensions

2. **Update Image Component**
   - Change `object-contain` to `object-cover`
   - Change `h-auto` to `h-full`
   - Keep `w-full` to fill container width

3. **Test Visual Output**
   - Run dev server and navigate to `/list`
   - Inspect multiple gift cards
   - Verify square format and proper image fitting

4. **Browser Testing**
   - Test across different viewports
   - Verify responsive behavior
   - Check both themes

---

## Rollback Plan

If issues arise, the change is isolated to 2 CSS classes in one component. Simple rollback:
- Revert `aspect-square` addition to container
- Revert `object-cover h-full` back to `object-contain h-auto`

---

## Estimated Impact

- **Lines of code changed**: ~4-5 lines
- **Files modified**: 1 file
- **Testing time**: 10-15 minutes
- **Risk level**: Low (CSS-only change, no logic modification)
