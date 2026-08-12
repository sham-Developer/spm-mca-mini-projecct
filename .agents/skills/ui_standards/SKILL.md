---
name: ui_standards
description: UI standards and styling guidelines for NexTask frontend components
---

# UI Styling Standards for NexTask

This document defines the interface styling rules, color constraints, card visibility guidelines, and typography requirements for NexTask. Future AI agents must follow these patterns strictly to maintain design consistency.

## 1. Color Palette & Branding
* **Primary Branding Accent**: Orange (`#ea580c` / `bg-orange-600` / `text-orange-600`) should be used **only** for essential brand elements, primary buttons, and alerts.
* **Canvas Background**: High-contrast neutral slate/gray (`bg-slate-50` or `bg-slate-100`).
* **Text Color**: Dark neutral shades (**`text-slate-900`**, **`text-slate-950`**, or **`text-black`**). Never use light gray or faint colors for body text or labels.
* **No Faint Backgrounds / Text**: Do not use very light colors (such as slate-50/100 for texts, or extremely low-contrast elements) anywhere in the project.

## 2. Card & Table Boundaries (High Visibility)
* **Borders**: All cards, metrics panels, forms, and tables must use solid neutral borders:
  ```html
  className="bg-white border border-slate-400 rounded-xl shadow-md"
  ```
  *Do not use `border-2` (too clunky) or light transparent borders like `border-orange-200/60` (insufficient contrast).*
* **Table Headers**: Dividers must be clear and contrastive:
  ```html
  className="border-b border-slate-400 bg-slate-100"
  ```
* **Table Cells**: Table views must contain clear borders for individual table cells to distinguish columns and rows cleanly (use `border border-slate-300` or a consistent grid line border for cells).
* **Table Rows**: Divide items using:
  ```html
  className="divide-y divide-slate-300"
  ```

## 3. Formatting & Content Rules
* **No Eclipsed/Truncated Text**: Text content must never be truncated or eclipsed (do not use CSS classes like `truncate`, `text-ellipsis`, or `overflow-hidden` that hide text). All information must remain fully visible and wrap properly.
* **Date Format**: All dates shown in the system must be formatted explicitly as **`dd-mm-yyyy`**.

## 4. Typography & Weights (Balanced Legibility)
* **Headers/Titles**: Use **`font-bold`** or **`font-extrabold`** for main section headers, metric totals, and active navigation links.
* **Labels / Sub-details**: Use **`font-semibold`** or **`font-medium`** for form labels, table cells, dates, emails, and small status pills.
* **Body / Paragraphs**: Use **`font-medium`** (minimum) or **`font-normal`** (regular) for descriptions, reports, and italic quotes.
* **NO Thin Weights**: Never use `font-light` or thin text styles.
