"use client";

import { useEffect } from "react";
import { useDataStore } from "@/stores/data-store";
import { THEME_PRESETS, type ThemePreset, type ThemeColors } from "@/types";

// Validate hex color format
function isValidHex(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  return /^[0-9A-Fa-f]{6}$/.test(cleaned);
}

// Convert hex color to oklch CSS string
function hexToOklch(hex: string): string | null {
  // Validate hex format
  if (!isValidHex(hex)) {
    return null;
  }

  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Convert RGB to linear RGB
  const toLinear = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // Convert to XYZ (D65 illuminant)
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const z = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  // Convert XYZ to OKLab
  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z);

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // Convert OKLab to OKLCH
  const C = Math.sqrt(a * a + bVal * bVal);
  let H = Math.atan2(bVal, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  // Format: oklch(L C H)
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(3)})`;
}

// Generate a contrasting foreground color (light or dark)
function getContrastForeground(hex: string): string | null {
  // Validate hex format
  if (!isValidHex(hex)) {
    return null;
  }

  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return dark or light foreground
  return luminance > 0.5 ? "oklch(0.145 0 0)" : "oklch(0.985 0 0)";
}

// CSS variable mapping for theme colors
const CSS_VAR_MAPPING: Record<keyof ThemeColors, { primary: string; foreground?: string }> = {
  primary: { primary: "--primary", foreground: "--primary-foreground" },
  secondary: { primary: "--secondary", foreground: "--secondary-foreground" },
  accent: { primary: "--accent", foreground: "--accent-foreground" },
  card: { primary: "--card", foreground: "--card-foreground" },
  background: { primary: "--background", foreground: "--foreground" },
  muted: { primary: "--muted", foreground: "--muted-foreground" },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useDataStore((state) => state.settings);
  const theme = settings.theme;
  const themePreset = settings.themePreset || "default";
  const customTheme = settings.customTheme;

  // Handle light/dark/system theme class
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Check system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // Listen for system theme changes when theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Apply custom theme colors
  useEffect(() => {
    // Get the theme colors to apply
    const getThemeColors = (mode: "light" | "dark"): ThemeColors => {
      if (themePreset === "custom" && customTheme) {
        return customTheme[mode];
      }
      return THEME_PRESETS[themePreset as ThemePreset]?.[mode] || {};
    };

    const lightColors = getThemeColors("light");
    const darkColors = getThemeColors("dark");

    // Build CSS rules
    let lightCSS = "";
    let darkCSS = "";

    // Process light mode colors
    for (const [key, hex] of Object.entries(lightColors)) {
      if (hex) {
        const mapping = CSS_VAR_MAPPING[key as keyof ThemeColors];
        const oklch = hexToOklch(hex);
        if (mapping && oklch) {
          lightCSS += `${mapping.primary}: ${oklch};\n`;
          if (mapping.foreground) {
            const foreground = getContrastForeground(hex);
            if (foreground) {
              lightCSS += `${mapping.foreground}: ${foreground};\n`;
            }
          }
        }
      }
    }

    // Process dark mode colors
    for (const [key, hex] of Object.entries(darkColors)) {
      if (hex) {
        const mapping = CSS_VAR_MAPPING[key as keyof ThemeColors];
        const oklch = hexToOklch(hex);
        if (mapping && oklch) {
          darkCSS += `${mapping.primary}: ${oklch};\n`;
          if (mapping.foreground) {
            const foreground = getContrastForeground(hex);
            if (foreground) {
              darkCSS += `${mapping.foreground}: ${foreground};\n`;
            }
          }
        }
      }
    }

    // Create or update style element
    const styleId = "custom-theme-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // Only add CSS if there are customizations
    if (lightCSS || darkCSS) {
      styleEl.textContent = `
        :root {
          ${lightCSS}
        }
        .dark {
          ${darkCSS}
        }
      `;
    } else {
      styleEl.textContent = "";
    }
  }, [themePreset, customTheme]);

  return <>{children}</>;
}
