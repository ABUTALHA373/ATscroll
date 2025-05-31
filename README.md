# ATscroll

> Custom JavaScript library to replace native scrollbars with fully customizable scrollbars — supports light/dark modes, auto-hide, and dynamic resizing. Built to work seamlessly with Tailwind CSS overflow utilities.

---

## Features

- Hide native scrollbars on `body` and all elements with Tailwind overflow classes globally
- Customizable scrollbar color for light and dark modes
- Adjustable scrollbar width
- Optional auto-hide behavior when mouse leaves the scroll container
- Supports dynamic content changes and window resizing
- Drag to scroll functionality
- Zero dependencies, pure vanilla JavaScript

---


## Installation

### Via npm

```bash
npm install atscroll

```
Import and initialize in your project:

```bash
import ATscroll from "atscroll";

ATscroll({
  color: {
    light: "#d1d5db",
    dark: "#4b5563",
  },
  autoHide: "leave",      // 'none' or 'leave'
  scrollbarWidth: "6px",
});
```
## Usage
Just call ATscroll() with options. It automatically finds:

- The <body> element
- All elements with Tailwind overflow classes (overflow-auto, overflow-scroll, etc.) and replaces native scrollbars with custom ones.

```bash
import ATscroll from 'atscroll';

ATscroll({
  color: {
    light: "#aabbcc",  // light mode scrollbar color
    dark: "#334455",   // dark mode scrollbar color
  },
  autoHide: "none",    // "none" or "leave"
  scrollbarWidth: "8px"
});
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `{ light: string, dark: string }` | `{ light: "#00000033", dark: "#ffffff33" }` | Scrollbar colors for light/dark modes (supports any CSS color value) |
| `autoHide` | `"none"` \| `"leave"` | `"leave"` | `"none"` = always visible, `"leave"` = hides when mouse leaves container |
| `scrollbarWidth` | `string` | `"6px"` | Width of the scrollbar track (must include px/rem units) |

## Tailwind CSS Integration
Make sure you enable class-based dark mode in your Tailwind config:
```bash
// tailwind.config.js
module.exports = {
  darkMode: "class",
  // other configs...
}
```
Use the dark class on <html> or <body> to enable dark mode:
```bash
<html class="dark">
```

## How It Works
- Wraps each scrollable element (body and any with Tailwind overflow classes) in a container
- Hides native scrollbar via CSS globally
- Adds a custom scrollbar element absolutely positioned on the right side
- Calculates scrollbar size and position based on scrollable content
- Updates dynamically on scroll, resize, or content mutation using ResizeObserver and MutationObserver
- Supports drag to scroll by dragging the scrollbar thumb
- Changes scrollbar color automatically according to light/dark mode

## License
MIT © [Abu Talha](https://github.com/ABUTALHA373)

## Contact
- GitHub: [Abu Talha](https://github.com/ABUTALHA373)
