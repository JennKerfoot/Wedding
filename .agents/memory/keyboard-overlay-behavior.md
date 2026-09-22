---
name: Keyboard overlay behavior
description: Accessibility constraint for responsive navigation overlays.
---

Responsive overlays that are visually closed must also be removed from the keyboard tab order. `pointer-events: none` blocks pointer interaction but does not stop keyboard focus from reaching descendant links.

**Why:** A keyboard user can otherwise land on invisible navigation controls and lose context, even though pointer users cannot open the same controls.

**How to apply:** Pair the visual closed state with `aria-hidden` and an explicit `tabIndex={-1}` (or an equivalent inert mechanism) for descendants, then test opening, closing, and tabbing out of the overlay.