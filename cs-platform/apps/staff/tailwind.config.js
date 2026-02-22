/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { brand: { primary: "#15803d", secondary: "#d1fae5", dark: "#14532d" } },
      fontFamily: { sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"] },
      spacing: { sidebar: "16rem" },
      minHeight: { touch: "44px" },
      minWidth:  { touch: "44px" },
    },
  },
  plugins: [],
};