/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
        },
        brand: {
          from: "hsl(var(--brand-from))",
          to: "hsl(var(--brand-to))",
          accent: "hsl(var(--brand-accent))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, hsl(var(--brand-from)) 0%, hsl(var(--brand-to)) 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, hsl(var(--brand-from) / 0.15), hsl(var(--brand-to) / 0.15))",
        mesh: "radial-gradient(at 12% 18%, hsl(var(--brand-from) / 0.22) 0px, transparent 50%), radial-gradient(at 88% 12%, hsl(var(--brand-accent) / 0.18) 0px, transparent 55%), radial-gradient(at 60% 100%, hsl(var(--brand-to) / 0.18) 0px, transparent 60%)",
        "shimmer-line":
          "linear-gradient(90deg, transparent, hsl(var(--brand-from) / 0.6), transparent)",
      },
      boxShadow: {
        "card-lift":
          "0 10px 25px -10px hsl(var(--brand-from) / 0.25), 0 4px 10px -4px hsl(var(--brand-to) / 0.18)",
        glow: "0 0 0 1px hsl(var(--brand-from) / 0.35), 0 8px 30px -6px hsl(var(--brand-from) / 0.45)",
      },
      keyframes: {
        "row-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%,-1%,0) scale(1.05)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "border-beam": {
          "100%": { "offset-distance": "100%" },
        },
      },
      animation: {
        "row-in": "row-in 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) both",
        aurora: "aurora 14s ease-in-out infinite",
        shimmer: "shimmer 2.6s linear infinite",
        "border-beam": "border-beam calc(var(--duration) * 1s) infinite linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
