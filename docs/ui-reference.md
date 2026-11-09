# Bilunex Design System Reference

This document records the exact foundational design system tokens, components, breakpoints, and styling standards of the Bilunex frontend as established in `client/css/`.

---

## 1. Color Palette & Contrast Ratios

### Brand Palette

| Token                     | Value     | Description                                                          |
| ------------------------- | --------- | -------------------------------------------------------------------- |
| `--color-primary`         | `#102746` | Deep navy; main brand color for headers, primary CTAs, text contrast |
| `--color-primary-hover`   | `#091a30` | Darker navy for interactive hover states                             |
| `--color-primary-light`   | `#eef2f7` | Soft navy tint for subtle backgrounds and button outline hovers      |
| `--color-primary-subtle`  | `#dce4ed` | Muted navy tint for borders and dividers                             |
| `--color-secondary`       | `#29415f` | Slate navy; secondary buttons and accent copy                        |
| `--color-secondary-hover` | `#1b304b` | Darker slate navy for hover states                                   |
| `--color-secondary-light` | `#f1f4f8` | Background tint for secondary panels                                 |
| `--color-accent`          | `#c59a43` | Warm amber gold; high-visibility primary actions and highlights      |
| `--color-accent-hover`    | `#d2aa5a` | Lighter gold hover state                                             |
| `--color-accent-light`    | `#f7f0e2` | Warm parchment tint for badges and highlights                        |

### Neutral Surfaces & Typography

| Token                    | Value     | Contrast Ratio / WCAG Standard                                                     |
| ------------------------ | --------- | ---------------------------------------------------------------------------------- |
| `--color-bg`             | `#f8fafc` | Slate-50: crisp, clean page background                                             |
| `--color-surface`        | `#ffffff` | Pure white: card, drawer, and input surfaces                                       |
| `--color-surface-subtle` | `#f1f5f9` | Slate-100: alternating section backgrounds (`.bg-alt`)                             |
| `--color-text-main`      | `#0f172a` | Slate-900: primary text (**14:1** contrast ratio against `#ffffff`, AAA compliant) |
| `--color-text-muted`     | `#475569` | Slate-600: secondary text (**7:1** contrast ratio against `#ffffff`, AA compliant) |
| `--color-text-inverse`   | `#ffffff` | Pure white text on dark primary backgrounds                                        |
| `--color-border`         | `#cbd5e1` | Slate-300: distinct field and card borders (**3:1** non-text contrast)             |
| `--color-border-hover`   | `#94a3b8` | Slate-400: interactive hover border                                                |
| `--color-border-focus`   | `#1d4ed8` | Blue-700: high-visibility focus ring (**3px solid** outline)                       |

### Semantic Feedback

| Token          | Text / Icon                             | Background                    | Border                            |
| -------------- | --------------------------------------- | ----------------------------- | --------------------------------- |
| Success        | `--color-success: #15803d` (Green-700)  | `--color-success-bg: #f0fdf4` | `--color-success-border: #bbf7d0` |
| Danger / Error | `--color-danger: #b91c1c` (Red-700)     | `--color-danger-bg: #fef2f2`  | `--color-danger-border: #fecaca`  |
| Warning        | `--color-warning: #a16207` (Yellow-700) | `--color-warning-bg: #fefce8` | `--color-warning-border: #fef08a` |
| Info           | `--color-info: #0369a1` (Sky-700)       | `--color-info-bg: #f0f9ff`    | `--color-info-border: #bae6fd`    |

---

## 2. Typography Scale

### Font Family

- **Base & Headings**: `system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`
- Rendering optimizations: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`

### Type Scale

| Token              | Size              | Line Height    | Usage                                            |
| ------------------ | ----------------- | -------------- | ------------------------------------------------ |
| `--font-size-xs`   | `0.75rem` (12px)  | `1.25` / `1.6` | Captions, helper hints, form step numbers        |
| `--font-size-sm`   | `0.875rem` (14px) | `1.25` / `1.6` | Labels, navigation links, secondary metadata     |
| `--font-size-base` | `1rem` (16px)     | `1.6`          | Body text, input values (prevents iOS auto-zoom) |
| `--font-size-md`   | `1.125rem` (18px) | `1.6`          | Lead paragraphs, card headings                   |
| `--font-size-lg`   | `1.25rem` (20px)  | `1.25`         | Subheadings, card titles                         |
| `--font-size-xl`   | `1.5rem` (24px)   | `1.25`         | `<h3>` headings, section subtitles               |
| `--font-size-2xl`  | `1.875rem` (30px) | `1.25`         | `<h2>` section headings                          |
| `--font-size-3xl`  | `2.25rem` (36px)  | `1.25`         | `<h1>` page titles, hero headlines               |
| `--font-size-4xl`  | `2.75rem` (44px)  | `1.25`         | Large desktop hero headlines                     |

### Font Weights

- Normal: `400`
- Medium: `500`
- Semibold: `600`
- Bold: `700`
- Extrabold: `800`

---

## 3. Spacing Scale

Base modular scale:

- `--space-1`: `0.25rem` (4px)
- `--space-2`: `0.5rem` (8px)
- `--space-3`: `0.75rem` (12px)
- `--space-4`: `1rem` (16px)
- `--space-5`: `1.25rem` (20px)
- `--space-6`: `1.5rem` (24px)
- `--space-8`: `2rem` (32px)
- `--space-10`: `2.5rem` (40px)
- `--space-12`: `3rem` (48px)
- `--space-16`: `4rem` (64px)
- `--space-20`: `5rem` (80px)
- `--space-24`: `6rem` (96px)

### Radii & Elevation

- `--radius-sm`: `0.25rem` (4px)
- `--radius-md`: `0.375rem` (6px)
- `--radius-lg`: `0.5rem` (8px)
- `--radius-xl`: `0.75rem` (12px)
- `--radius-full`: `9999px`
- `--shadow-sm`: `0 1px 2px 0 rgb(15 23 42 / 0.05)`
- `--shadow-md`: `0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.04)`
- `--shadow-lg`: `0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.04)`

---

## 4. Breakpoints & Responsive Architecture

- Mobile-first CSS structure.
- **Narrow Mobile (< 360px)**: Compact padding, reduced wordmark sizes (`--brand-mark-size-compact: 44px`).
- **Standard Mobile (360px – 599px)**: Single column layouts, mobile hamburger navigation drawer (`.primary-nav.is-open`), sticky header with `z-index: 100`.
- **Tablet (600px / 640px / 768px)**: 2-column grids, increased container horizontal padding (`--space-6`), expanded card padding (`--space-8`).
- **Desktop (960px / 1140px / 1200px)**: Full multi-column grids (3-column service cards, 2-column intake forms), hamburger nav hidden and horizontal desktop nav shown (`min-width: 1200px`), container `max-width: 1140px`.

---

## 5. UI Components

### Buttons (`.btn`)

- **Minimum Touch Target**: `min-height: 2.75rem` (44px) meeting WCAG 2.1 mobile touch requirements.
- **Variants**:
  - `.btn-primary`: `#102746` navy background, white text.
  - `.btn-secondary`: `#29415f` slate background, white text.
  - `.btn-accent`: `#c59a43` amber gold background, `#102746` deep navy text.
  - `.btn-outline`: Transparent background, `#102746` border and text.
  - `.btn-ghost`: Transparent, zero border, navy text.
- **Loading State**: `.btn-spinner` (1.125rem rotating circular spinner with transparent border and white border-top). Button has `pointer-events: none` and `opacity: 0.65`.

### Cards (`.card`)

- Clean white surface (`--color-surface: #ffffff`) with 1px border (`--color-border: #cbd5e1`), rounded corners (`--radius-xl: 0.75rem`), and light shadow (`--shadow-sm`). Hover elevation transitions smoothly to `--shadow-md`.

### Form Controls

- Labels (`.form-label`): `font-weight: 600`, with required indicator `<span class="required">*</span>`.
- Hints (`.form-hint`): Small muted helper text directly below the label.
- Inputs & Selects (`.form-control`): `min-height: 2.75rem` (44px), `1rem` (16px) font-size to prevent iOS safari viewport zooming on focus.
- Validation Feedback:
  - Valid field: Default border `#cbd5e1`.
  - Focused field: 3px solid `--color-border-focus` (`#1d4ed8`).
  - Invalid field: `aria-invalid="true"`, border-color `#b91c1c`.
  - Inline error message: `<span class="form-error" role="alert">`, red text `#b91c1c`, displayed directly beneath the field.

---

## 6. Motion & Animations

- Standard transitions: `150ms` (fast) and `250ms` (base) using `cubic-bezier(0.4, 0, 0.2, 1)`.
- Keyframe animations: `btn-spin` (spinner rotation), `reveal-on-scroll` (fade and slide in).
- **Reduced Motion Support**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
