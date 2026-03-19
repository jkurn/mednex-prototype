import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      /* --- Once UI border radius (playful scale) --- */
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },

      /* --- Once UI shadow system (3-layer) --- */
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "primary-glow": "0 1px 3px rgba(253,99,37,0.2), 0 4px 12px rgba(253,99,37,0.15)",
        "primary-glow-lg": "0 4px 8px rgba(253,99,37,0.2), 0 8px 24px rgba(253,99,37,0.15)",
      },

      /* --- Color tokens --- */
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          bg: "var(--primary-bg)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        /* Status colors */
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        error: {
          DEFAULT: "var(--error)",
          foreground: "var(--error-foreground)",
        },

        /* Chart colors */
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },

        /* Sidebar (dark) */
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },

        /* Once UI sand scale (direct access) */
        sand: {
          100: "var(--sand-100)",
          200: "var(--sand-200)",
          300: "var(--sand-300)",
          400: "var(--sand-400)",
          500: "var(--sand-500)",
          600: "var(--sand-600)",
          700: "var(--sand-700)",
          800: "var(--sand-800)",
          900: "var(--sand-900)",
          1000: "var(--sand-1000)",
          1100: "var(--sand-1100)",
          1200: "var(--sand-1200)",
        },

        /* Once UI orange scale (direct access) */
        orange: {
          100: "var(--orange-100)",
          200: "var(--orange-200)",
          300: "var(--orange-300)",
          400: "var(--orange-400)",
          500: "var(--orange-500)",
          600: "var(--orange-600)",
          700: "var(--orange-700)",
          800: "var(--orange-800)",
          900: "var(--orange-900)",
          1000: "var(--orange-1000)",
          1100: "var(--orange-1100)",
          1200: "var(--orange-1200)",
        },
      },

      /* --- Typography (Once UI font stacks) --- */
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        serif: ["var(--font-serif)"],
      },

      /* --- Once UI font size scale --- */
      fontSize: {
        "display-xl": ["5rem", { lineHeight: "5rem", letterSpacing: "-0.04em" }],
        "display-l": ["4rem", { lineHeight: "4.25rem", letterSpacing: "-0.03em" }],
        "display-m": ["3rem", { lineHeight: "3.25rem", letterSpacing: "-0.02em" }],
        "display-s": ["2.5rem", { lineHeight: "3rem", letterSpacing: "-0.02em" }],
        "display-xs": ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.01em" }],
        "heading-xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.01em" }],
        "heading-l": ["1.33rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        "heading-m": ["1.25rem", { lineHeight: "1.5rem" }],
        "heading-s": ["1.125rem", { lineHeight: "1.5rem" }],
        "heading-xs": ["1rem", { lineHeight: "1.25rem" }],
        "body-xl": ["1.25rem", { lineHeight: "1.75rem" }],
        "body-l": ["1.125rem", { lineHeight: "1.5rem" }],
        "body-m": ["1rem", { lineHeight: "1.5rem" }],
        "body-s": ["0.875rem", { lineHeight: "1.125rem" }],
        "body-xs": ["0.75rem", { lineHeight: "1rem" }],
        "label-l": ["1rem", { lineHeight: "1.25rem" }],
        "label-m": ["0.925rem", { lineHeight: "1.25rem" }],
        "label-s": ["0.825rem", { lineHeight: "1rem" }],
      },

      /* --- Transitions (Once UI timing) --- */
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        "once-ui": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },

      /* --- Animations --- */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
