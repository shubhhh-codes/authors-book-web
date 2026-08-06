# Mobile Vertical Scroll: Deep-Dive Root Cause Audit & Handoff Guide

## Executive Summary
This document provides a comprehensive technical audit and handoff guide detailing why vertical touch scrolling (swiping UP/DOWN from bottom-to-top on mobile screens) fails inside the 3D bookshelf experience (`authorsbook-web`), and how each system component (`page.tsx`, `ProgressLibrary.tsx`, `ShelfEngine.ts`, `globals.css`) contributes to the issue.

---

## 1. System Architecture & Affected Files

The 3D hero section is composed of four interconnected layers:

| Layer / File | Responsibility | Role in Mobile Touch Issue |
| :--- | :--- | :--- |
| `app/page.tsx` | Root layout wrapper & page section orchestration | Defines viewport height (`h-[100dvh]`) and scroll container rules (`overflow`) |
| `app/ProgressLibrary.tsx` | Client UI state, header, caption overlay & 3D canvas mount | Layers absolute HTML text overlays over the full-bleed `<canvas>` |
| `app/ShelfEngine.ts` | Three.js WebGL rendering, raycasting, camera & input listeners | Binds `pointerdown`, `pointermove`, `wheel` handlers directly to canvas |
| `app/globals.css` | Global styling, responsive breakpoints, CSS `touch-action` & `pointer-events` | Controls gesture interception, overlay pointer behavior, and `100dvh` layout bounds |

---

## 2. Deep Root-Cause Analysis

### Root Cause 1: WebKit & Blink Touch Gesture State Machine Locking
- **Files Affected**: `app/ShelfEngine.ts` (`bindEvents`, `handlePointerDown`, `handlePointerMove`)
- **Technical Breakdown**:
  1. When a user places their finger on the mobile screen, WebKit (iOS Safari) and Blink (Android Chrome) dispatch a `pointerdown` / `touchstart` event to the target element (`<canvas class="shelf-canvas">`).
  2. Because `ShelfEngine.ts` has an active `pointerdown` listener, WebKit enters its **JS Gesture Disambiguation Phase**, waiting to determine whether the gesture belongs to JavaScript or native browser window scrolling.
  3. In `handlePointerMove`, the engine attempts to detect swipe direction:
     ```ts
     if (totalY >= totalX * 0.7) {
       this.isVerticalScroll = true;
       this.pointerDown = false;
       return;
     }
     ```
  4. **Why this fails on mobile**: WebKit and Blink's gesture engine locks touch tracking to the target DOM node at `pointerdown`. Returning early from JS `pointermove` after 4–6px of touch travel does **not** hand touch control back to native window scrolling once the gesture lifecycle has started on a `<canvas>` element without a passive touch delegate.

---

### Root Cause 2: Viewport Height Constraints & Nested Overflow Containers
- **Files Affected**: `app/page.tsx`, `app/globals.css` (`.press-experience`)
- **Technical Breakdown**:
  1. `.press-experience` and the outer wrapper in `page.tsx` are constrained to `height: 100dvh`.
  2. In CSS box model semantics, setting `height: 100dvh` alongside `overflow: hidden` creates a **non-scrollable viewport boundary**.
  3. When a mobile browser's compositor evaluates a touch gesture starting inside a `100dvh` element, it queries parent nodes for scroll capability. If it finds a `100dvh` non-scrollable box, it suppresses the window's vertical scroll gesture recognizer.

---

### Root Cause 3: Overlay Text Node Pointer Trapping (`.browse-caption`)
- **Files Affected**: `app/ProgressLibrary.tsx`, `app/globals.css` (`.browse-caption`)
- **Technical Breakdown**:
  1. On mobile viewports (`max-width: 760px`), `.browse-caption` covers up to 85% of the lower screen (`left: 0`, `right: 0`, `bottom: 106px`).
  2. Inside `.browse-caption`, text elements (`h1` shortTitle, `p` author, `.eyebrow`) are rendered as static block nodes.
  3. Even when `.browse-caption` has `pointer-events: none`, child elements without explicit `pointer-events: none` and `touch-action: pan-y` create hit-test regions in mobile WebKit. Touching down on "Think Like a Monk" or "Jay Shetty" starts a touch sequence on HTML text nodes that lack window scroll propagation rules.

---

### Root Cause 4: Raycast Frame Delay on Touch Start
- **Files Affected**: `app/ShelfEngine.ts` (`raycastBook`, `updatePointer`)
- **Technical Breakdown**:
  1. In `handlePointerDown`:
     ```ts
     if (event.pointerType === "touch") {
       this.updatePointer(event);
       const hit = this.raycastBook();
       if (hit === null) {
         this.pointerDown = false;
         return;
       }
     }
     ```
  2. On mobile touch-down, `event.clientX` and `event.clientY` are evaluated through Three.js camera projection (`raycaster.setFromCamera`).
  3. Due to viewport scaling on high-DPI mobile screens (`window.devicePixelRatio`), the bounding box of `pickTargets` during canvas resize or scroll can misalign slightly with CSS pixel coordinates, resulting in false `null` or false `hit` returns on touch start.

---

## 3. Comprehensive Handoff & Solution Architecture

To permanently guarantee smooth mobile vertical scrolling while retaining 3D horizontal shelf browsing, apply the following 3 architectural patterns:

### Pattern A: Decouple Mobile Touch Handling (Native Touch Delegation)
- **Strategy**:
  On mobile devices (`pointerType === 'touch'`), do **not** capture or track `pointerdown` on canvas areas outside explicit 3D book bounding boxes.
- **Code Reference**: `app/ShelfEngine.ts`
  - Binds passive `touchstart` / `touchmove` listeners specifically for mobile swipe direction detection.
  - Ensures `preventDefault()` is **never** invoked for vertical touch vectors.

### Pattern B: Window-Level Native Scroll Container
- **Strategy**:
  Remove nested `overflow-y-auto` divs and ensure `window` / `document.body` is the sole vertical scroll container during browsing mode.
- **Code Reference**: `app/page.tsx`
  - Body overflow is locked (`document.body.style.overflow = "hidden"`) **only** when a book is in full-screen inspection mode (`isFocused === true`).

### Pattern C: Strict Touch-Action & Pointer-Events Inheritance
- **Strategy**:
  Enforce `touch-action: pan-y` and `pointer-events: none` across all non-interactive overlay text nodes on mobile.
- **Code Reference**: `app/globals.css`
  ```css
  .press-experience,
  .browse-caption,
  .browse-caption > * {
    touch-action: pan-y;
    pointer-events: none;
  }

  .browse-caption .inspect-button,
  .shelf-arrow,
  .shelf-index {
    pointer-events: auto;
  }
  ```

---

## 4. Verification Checklist for Developers

When testing changes on iOS Safari and Android Chrome (or Chrome DevTools Mobile Emulation):

- [ ] **Touch Title Text**: Dragging UP starting on `Think Like a Monk` text smoothly scrolls down to `EditorialShowcase`.
- [ ] **Touch 3D Book**: Dragging UP starting on the book cover smoothly scrolls down to `EditorialShowcase`.
- [ ] **Horizontal Shelf Drag**: Dragging LEFT/RIGHT across books scrolls between 3D volumes.
- [ ] **Pinch Gesture**: Two-finger pinch zooming does not freeze or trigger 3D shelf jumps.
- [ ] **Inspect Mode**: Clicking "Inspect volume" locks body scroll and enables 3D orbit controls cleanly.
