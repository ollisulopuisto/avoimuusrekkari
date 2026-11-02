## 2026-11-02 - Details overlay needs a keyboard boundary
**Learning:** A result card can open a visually modal overlay while keyboard focus stays on the card and Tab returns to obscured page controls. A close button and Escape handler alone do not make the overlay a dialog.
**Action:** Move focus inside on mount, bound forward/backward Tab, name the dialog, and restore the opener on unmount. Keep the keyboard-boundary regression alongside modal tests.
