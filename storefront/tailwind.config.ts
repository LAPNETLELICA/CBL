import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        sky: "#8ECAE6",
        blush: "#FFB5C8",
        mist: "#E8F1F5",
      },
      boxShadow: {
        glass: "0 24px 70px rgba(27, 48, 73, 0.14)",
      },
      opacity: {
        4: "0.04",
        8: "0.08",
        12: "0.12",
        15: "0.15",
        16: "0.16",
        18: "0.18",
        22: "0.22",
        28: "0.28",
        35: "0.35",
        38: "0.38",
        45: "0.45",
        46: "0.46",
        48: "0.48",
        52: "0.52",
        55: "0.55",
        56: "0.56",
        58: "0.58",
        62: "0.62",
        65: "0.65",
        66: "0.66",
        68: "0.68",
        72: "0.72",
        76: "0.76",
        78: "0.78",
        82: "0.82",
        86: "0.86",
        92: "0.92",
      },
    },
  },
  plugins: [],
};

export default config;
