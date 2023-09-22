const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          foreground: {
            DEFAULT: "rgba(var(--color-primary-foreground), 1)",
            hover: "rgba(var(--color-primary-foreground), 0.9)",
            muted: "rgba(var(--color-primary-foreground), 0.6)",
          },
          background: {
            DEFAULT: "rgba(var(--color-primary-background), 1)",
            hover: "rgba(var(--color-primary-foreground), 0.1)",
            muted: "rgba(var(--color-primary-background), 0.6)",
          },
        },
        accent: {
          foreground: {
            DEFAULT: "rgba(var(--color-accent-foreground), 1)",
            hover: "rgba(var(--color-accent-foreground), 0.9)",
            muted: "rgba(var(--color-accent-foreground), 0.6)",
          },
          background: {
            DEFAULT: "rgba(var(--color-accent-background), 1)",
            hover: "rgba(var(--color-accent-background), 0.85)",
            muted: "rgba(var(--color-accent-background), 0.6)",
          },
        },
      },
      fontFamily: {
        sans: ["Mona Sans", ...fontFamily.sans],
        mono: ["Fragment Mono", ...fontFamily.mono],
        logo: ["Martian Mono", ...fontFamily.mono],
      },
      keyframes: {
        slideUpAndFade: {
          from: { opacity: 0, transform: "translateY(2px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        slideRightAndFade: {
          from: { opacity: 0, transform: "translateX(-2px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        slideDownAndFade: {
          from: { opacity: 0, transform: "translateY(-2px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        slideLeftAndFade: {
          from: { opacity: 0, transform: "translateX(2px)" },
          to: { opacity: 1, transform: "translateX(0)" },
        },
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        slideUpAndFade: "slideUpAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideRightAndFade:
          "slideRightAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideDownAndFade:
          "slideDownAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        slideLeftAndFade:
          "slideLeftAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("tailwindcss-animate"),
  ],
};
