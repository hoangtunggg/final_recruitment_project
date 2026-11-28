# JobPortal design system

Visual direction taken from the Figma "AI Video Interview App" (the AI interview page): teal brand, Overpass type, pill buttons, 5-colour top bar, soft offset card shadows, generous whitespace. The whole app follows it. Preserve routes, behavior, data, and the light/dark themes. UI text is Vietnamese first with an English toggle (see Language below).

## Tokens

Defined in `tailwind.config.js` (static scales) and `src/index.css` (theme variables, `:root` / `.dark`). Prefer the semantic classes: they flip with the theme, so no `dark:` variant is needed.

| Role | Tailwind class | Light | Dark |
| --- | --- | --- | --- |
| Brand teal (fills without text, rings, top bar, icons) | `primary-500` / `brand-teal` | `#00A398` | `#00A398` |
| Filled button background | `primary-600` (`bg-primary` default) | `#008077` (white text 4.8:1) | `#008077` |
| Teal text / hover | `text-primary-text` | `#006B64` | `#4DBDB5` |
| Teal tint (cards, hover rows) | `bg-tint` / `primary-50` | `#F7FCFC` | `#172A29` |
| Teal line (card border) | `border-tint-line` | `#D1EEEC` | `#1F4A47` |
| Page background | `bg-canvas` | `#FFFFFF` | `#0E1717` |
| Surface (cards, inputs, menus) | `bg-surface` | `#FFFFFF` | `#142121` |
| Primary text | `text-ink` | `#1A1A1A` | `#F2F5F5` |
| Secondary text | `text-muted` | `#5F5F5F` (6.4:1) | `#A9B8B7` |
| Border (inputs, dividers) | `border-line` / `border-line-strong` | `#E4E4E4` / `#D6D6D6` | `#2C3F3E` / `#3D5251` |
| Success text | `text-success` | `#2F7A1A` | `#8AC43F` |
| Warning text | `text-warning` | `#9A5205` | `#F5901D` |
| Error text / field border | `text-danger` / `border-danger` | `#C5221F` | `#FF7A77` |
| Focus ring | global `:focus-visible` outline, `shadow-focus` on controls | `#00A398` | `#4DBDB5` |

Top-bar / accent colours (decorative, never the only signal): `brand-red #E0302D`, `brand-orange #F5901D`, `brand-parrot #D5DE23`, `brand-green #8AC43F`, `brand-teal #00A398`. `brand-red` with white text is 4.5:1, so it is used for the danger button fill.

Legacy: `blue-*` utilities are aliased to the teal scale so untouched pages follow the palette; write new code with `primary-*` and the semantic tokens. `bg-primary` is the filled-button teal (`primary-600`).

Never put white text on `primary-500` (3.1:1). Evaluate every foreground/background pair in both themes; body text targets at least 4.5:1 contrast.

## Typography and spacing

Overpass (weights 400-800, loaded from Google Fonts with the Vietnamese subset in `index.html`), then system sans-serif. Body is 16px / 1.5. Page titles 30-40px weight 800, card titles 20-28px bold, secondary labels 14px. Avoid tiny status labels and truncated titles where wrapping is possible.

4px spacing scale: 4, 8, 12, 16, 24, 32, 40, 48. Page gutters 16px mobile, 24px tablet, 32px desktop; content max width `max-w-7xl` (1280px). Radii: controls `rounded-control` 6px, cards `rounded-card` (12px 12px 6px 12px, the Figma soft corner), buttons and badges `rounded-pill` (70px). Cards use the offset shadow `shadow-card` (5px solid offset in teal-line, dark: teal-dark); the hover lift is `shadow-card-hover`.

## Components (`src/components/ui`)

Import from `src/components/ui`: `Button`, `Card`, `Badge`, `StatusBadge`, `TopBar`, `PageHeader`, `Input`, `Textarea`, `Select`, `Spinner`, `EmptyState`, `Brand`, `cx`. Also `LanguageToggle` and `ThemeToggle` in `src/components/common`.

- Buttons: pill, 44px (`md`), one clear primary action per region; visible hover, pressed, disabled, loading and keyboard focus states. Variants: primary, outline, ghost, danger, link.
- Inputs: persistent visible label, 44px height, error text adjacent to the field (`role="alert"`), hint text, teal border and soft ring on focus.
- Cards: `Card` with tone default / tint / grey; whole-card links use `interactive`.
- Badges: pill, text always accompanies colour; `StatusBadge` translates and colours API enum values without changing them.
- Navigation: sticky header with the 5-colour `TopBar`; the active link has a tint pill plus `aria-current`; mobile controls (language, bell, menu) stay one tap away.
- Tables: readable headers, clear row boundaries, responsive overflow, explicit loading/empty/error states (`Spinner`, `EmptyState`).
- Dashboards: compact KPI cards, status badges, tables, section headings; avoid nested cards and decorative effects.
- Feedback: skeletons while loading, a specific recovery action on errors, an actionable empty state, restrained success confirmation.
- Icons: reuse `react-icons` with consistent size; decorative icons are `aria-hidden`.

## Responsive and accessibility

Review at 390, 768, 1024 and 1440px widths. On mobile, place search and job results early; allow filters to wrap or stack; no horizontal page overflow. Touch targets are at least 44px where practical (40px for compact `sm` controls). Preserve keyboard tab order and visible focus rings; do not depend on colour alone or hover-only interaction. `prefers-reduced-motion` is honored globally in `index.css`.

## Language (i18n)

`react-i18next`, default `vi`, fallback `en`, stored in `localStorage.lang`, mirrored on `<html lang>`. Dictionaries live in `src/i18n/locales/{vi,en}/<namespace>.json`: common, public, auth, candidate, interview, employer, admin. Use `useTranslation("<ns>")`; API enum values are translated for display only (`useEnumLabel`, `StatusBadge`), never changed in requests. Vietnamese copy is natural, with diacritics. Dates and numbers use `useLocale()` (`vi-VN` / `en-US`).

## Theme rules

The light theme is the visual baseline. Class-based dark mode via `ThemeContext` stays. Every semantic token has a dark value; do not invert images, reuse light shadows blindly, or assume light-mode contrast holds in dark mode.
