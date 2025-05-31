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
