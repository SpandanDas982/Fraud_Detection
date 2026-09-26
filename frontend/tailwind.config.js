/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "#1C3145",
          active: "#15293B",
          soft: "#E7EDF2",
          muted: "#AEC2D0",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        canvas: "#F4F6F8",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F8FAFB",
          raised: "#FFFFFF",
        },
        ink: {
          DEFAULT: "#17232F",
          secondary: "#52616E",
          tertiary: "#74818C",
        },
        steel: {
          50: "#F4F6F8",
          100: "#E7EDF2",
          200: "#D9E0E6",
          300: "#BEC9D2",
          400: "#AEC2D0",
          500: "#74818C",
          600: "#52616E",
          700: "#315F82",
          800: "#243C53",
          900: "#17232F",
        },
        review: {
          DEFAULT: "var(--review)",
          soft: "var(--review-soft)",
          border: "var(--review-border)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
          border: "var(--success-border)",
        },
        error: {
          DEFAULT: "var(--error)",
          soft: "var(--error-soft)",
          border: "var(--error-border)",
        },
        info: {
          DEFAULT: "var(--info)",
          soft: "var(--info-soft)",
          border: "var(--info-border)",
        },
        duplicate: {
          DEFAULT: "var(--duplicate)",
          soft: "var(--duplicate-soft)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(23, 35, 47, 0.05)",
        sm: "0 4px 14px rgba(23, 35, 47, 0.07)",
        overlay: "0 18px 50px rgba(15, 27, 38, 0.18)",
      },
    },
  },
  plugins: [],
}
