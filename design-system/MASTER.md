# JobPortal design system

Approved visual direction for the existing React recruitment platform. Preserve its routes, behavior, data, and light/dark themes.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| Primary / focus | `#1D4ED8` | `#93C5FD` |
| Background | `#F8FAFC` | `#111827` |
| Surface | `#FFFFFF` | `#1F2937` |
| Primary text | `#0F172A` | `#F9FAFB` |
| Secondary text | `#475569` | `#D1D5DB` |
| Border | `#CBD5E1` | `#4B5563` |
| Success | `#15803D` | `#86EFAC` |
| Warning | `#B45309` | `#FCD34D` |
| Error | `#DC2626` | `#FCA5A5` |

Primary actions use blue with white text. Semantic colors communicate status alongside text or an icon. Do not use a semantic color as decoration. Evaluate every foreground/background pair in both themes; body text targets at least 4.5:1 contrast.

## Typography and spacing

Use Inter with Vietnamese glyph support, then system sans-serif fallback. Body text is 16px with approximately 1.5 line-height. Use 14px for secondary labels, 18–20px for card titles, and 24–32px for page headings. Avoid tiny status labels and truncated job titles where wrapping is possible.

Use a 4px base spacing scale: 4, 8, 12, 16, 24, 32, 48. Page gutters are 16px on mobile, 24px on tablet, and 32px on desktop. Keep a consistent desktop maximum width near 1280px. Radius is 8px for controls and 12px for cards; prefer borders over heavy shadows.

## Component standards

- Buttons: one clear primary action per region; visible hover, pressed, disabled, and keyboard focus states; 44px minimum height where practical.
- Inputs and filters: persistent accessible names, clear selected state, readable labels, 44px minimum height, and errors adjacent to their field.
- Job cards: prioritize title, company, location, employment type and salary; keep date and skills secondary; the entire card may remain a single link.
- Tables: readable headers, clear row boundaries, responsive overflow strategy, and explicit loading, empty and error states.
- Navigation: stable active state and predictable paths; mobile controls stay discoverable without relying on hover.
- Dashboards: reuse a compact KPI card pattern, status badges, tables and section headings; avoid nested cards and decorative effects.
- Feedback: skeletons while loading, a specific recovery action on errors, an actionable empty state, and restrained success confirmation.
- Icons: reuse the installed `react-icons` package with consistent size and visual weight; decorative icons are hidden from assistive technology.

## Responsive and accessibility

Review at 390, 768, 1024 and 1440px widths. On mobile, place search and job results early; allow filters to wrap or stack, and prevent horizontal page overflow. At tablet widths, avoid cramped multi-column job cards. Preserve keyboard tab order and visible focus rings; do not depend on color alone or hover-only interaction. Respect reduced motion preferences and keep interactions usable without animation.

## Theme rules

The light theme is the visual baseline. Maintain the existing class-based dark mode and theme switch. Map all core surfaces, borders, text, control and feedback states to a dark equivalent. Do not invert images, reuse light shadows blindly, or assume light-mode contrast holds in dark mode.
