/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = {
  "color": {
    "light": {
      "background": "#eef0f6",
      "foreground": "#1a1f2e",
      "card": "#ffffff",
      "cardForeground": "#1a1f2e",
      "popover": "#ffffff",
      "popoverForeground": "#1a1f2e",
      "primary": "#c47a10",
      "primaryForeground": "#ffffff",
      "secondary": "#2a3044",
      "secondaryForeground": "#eef0f6",
      "muted": "#dde1ec",
      "mutedForeground": "#4a5578",
      "accent": "#fde8b0",
      "accentForeground": "#8a5a0a",
      "destructive": "#d94040",
      "destructiveForeground": "#ffffff",
      "border": "#b8c2d8",
      "input": "#b8c2d8",
      "ring": "#c47a10",
      "chart1": "#c47a10",
      "chart2": "#3a7fd4",
      "chart3": "#2e9e5e",
      "chart4": "#d94040",
      "chart5": "#7c5cbf",
      "sidebar": "#e4e8f2",
      "sidebarForeground": "#1a1f2e",
      "sidebarBorder": "#b8c2d8",
      "sidebarPrimary": "#c47a10",
      "sidebarPrimaryForeground": "#ffffff",
      "sidebarAccent": "#d4d9e8",
      "sidebarAccentForeground": "#1a1f2e",
      "sidebarRing": "#c47a10"
    },
    "dark": {
      "background": "#1a1f2e",
      "foreground": "#e0e4f0",
      "card": "#222840",
      "cardForeground": "#e0e4f0",
      "popover": "#222840",
      "popoverForeground": "#e0e4f0",
      "primary": "#e8a020",
      "primaryForeground": "#1a1f2e",
      "secondary": "#2a3352",
      "secondaryForeground": "#c0c8e0",
      "muted": "#252c42",
      "mutedForeground": "#6a78a0",
      "accent": "#f0c060",
      "accentForeground": "#1a1f2e",
      "destructive": "#e04040",
      "destructiveForeground": "#ffffff",
      "border": "#303858",
      "input": "#2a3352",
      "ring": "#e8a020",
      "chart1": "#e8a020",
      "chart2": "#4a90d9",
      "chart3": "#48bb78",
      "chart4": "#fc6868",
      "chart5": "#9f7aea",
      "sidebar": "#141726",
      "sidebarForeground": "#a8b4cc",
      "sidebarBorder": "#252c42",
      "sidebarPrimary": "#e8a020",
      "sidebarPrimaryForeground": "#1a1f2e",
      "sidebarAccent": "#252c42",
      "sidebarAccentForeground": "#e0e4f0",
      "sidebarRing": "#e8a020"
    }
  },
  "fontFamily": {
    "sans": [
      "Inter",
      "sans-serif"
    ],
    "serif": [
      "Georgia",
      "serif"
    ],
    "mono": [
      "JetBrains Mono",
      "monospace"
    ]
  },
  "radius": "0.25rem",
  "spacing": "0.25rem"
} as const;

export type Tokens = typeof tokens;
export default tokens;
