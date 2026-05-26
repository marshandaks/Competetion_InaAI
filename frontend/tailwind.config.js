/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#00ed64",
          "green-dark": "#00684a",
          "green-mid": "#00a35c",
          "green-soft": "#c3f0d2",
          "teal-deep": "#001e2b",
          teal: "#003d4f",
          "teal-mid": "#00684a",
        },
        accent: {
          purple: "#7b3ff2",
          orange: "#fa6e39",
          pink: "#f06bb8",
          blue: "#3d4f9f",
        },
        canvas: {
          DEFAULT: "#ffffff",
          dark: "#001e2b",
        },
        surface: {
          DEFAULT: "#f9fbfa",
          soft: "#f4f7f6",
          feature: "#e3fcef",
        },
        hairline: {
          DEFAULT: "#e1e5e8",
          soft: "#eceff1",
          strong: "#c1ccd6",
          dark: "#1c2d38",
        },
        ink: "#001e2b",
        charcoal: "#1c2d38",
        slate: "#3d4f5b",
        steel: "#5c6c7a",
        stone: "#7c8c9a",
        muted: "#a8b3bc",
        "on-dark": {
          DEFAULT: "#ffffff",
          muted: "#a8b3bc",
        },
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "24px",
      },
      fontFamily: {
        sans: ["'Euclid Circular A'", "'Plus Jakarta Sans'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["'Source Code Pro'", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        xxl: "32px",
        xxxl: "40px",
      },
      boxShadow: {
        subtle: "rgba(0, 30, 43, 0.04) 0px 1px 2px 0px",
        card: "rgba(0, 30, 43, 0.08) 0px 4px 12px 0px",
        mockup: "rgba(0, 30, 43, 0.12) 0px 12px 24px -4px",
        modal: "rgba(0, 30, 43, 0.16) 0px 16px 48px -8px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
}

