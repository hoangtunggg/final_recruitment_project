import defaultTheme from "tailwindcss/defaultTheme";

/**
 * JobPortal design tokens (Figma "AI Video Interview App" palette).
 *
 * - `primary-*`  : teal scale. 500 = brand #00a398 (fills without text, rings, top bar);
 *                  600/700 = AA-contrast steps for filled buttons and text on white.
 * - `brand-*`    : the 5 top-bar colours (red, orange, parrot, green, teal).
 * - semantic     : canvas / surface / tint / ink / muted / line / primary-text / danger / warning / success
 *                  are CSS variables (see src/index.css) so `bg-surface text-ink border-line`
 *                  flips automatically in dark mode and still supports opacity modifiers.
 * - legacy       : `blue-*` is aliased to the teal scale so pages not yet redesigned follow the palette.
 */
const primary = {
  50: "#f7fcfc",
  100: "#e6f6f5",
  200: "#d1eeec",
  300: "#8fd5d0",
  400: "#4dbdb5",
  500: "#00a398",
  600: "#008077",
  700: "#006b64",
  800: "#00524d",
  900: "#003b37",
  950: "#00282a",
};

// Colour backed by an "R G B" CSS variable so Tailwind opacity modifiers keep working.
const cssVar = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { ...primary, DEFAULT: primary[600] },
        blue: primary, // legacy alias, prefer `primary`
        secondary: primary[700],
        brand: {
          red: "#e0302d",
          orange: "#f5901d",
          parrot: "#d5de23",
          green: "#8ac43f",
          teal: primary[500],
        },
        canvas: cssVar("canvas"),
        surface: cssVar("surface"),
        tint: cssVar("tint"),
        ink: cssVar("ink"),
        muted: cssVar("muted"),
        line: cssVar("line"),
        "line-strong": cssVar("line-strong"),
        "tint-line": cssVar("tint-line"),
        "primary-text": cssVar("primary-text"),
        danger: cssVar("danger"),
        warning: cssVar("warning"),
        success: cssVar("success"),
        dark: "#1f2937",
        light: "#f9fafb",
      },
      fontFamily: {
        sans: ["Overpass", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        control: "6px",
        card: "12px 12px 6px 12px", // Figma card: one softer corner
        pill: "70px",
      },
      boxShadow: {
        card: "5px 5px 0 0 var(--shadow-offset)",
        "card-hover": "7px 7px 0 0 var(--shadow-offset)",
        focus: "0 0 0 3px rgb(0 163 152 / 0.36)",
      },
      maxWidth: {
        page: "1250px",
      },
    },
  },
  plugins: [],
};
