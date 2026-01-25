/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // PathQuest "retro topographic" palette - VIBRANT dark mode values
        // (We force dark mode in the app)
        background: "#1A1816",
        foreground: "#F5F0E6",
        
        card: {
          DEFAULT: "rgba(28, 24, 20, 0.95)",
          foreground: "#F5F0E6",
        },
        
        popover: {
          DEFAULT: "rgba(28, 24, 20, 0.95)",
          foreground: "#F5F0E6",
        },
        
        primary: {
          DEFAULT: "#34D399",
          foreground: "#0F1F17",
        },
        
        secondary: {
          DEFAULT: "#F59E0B",
          foreground: "#1A1408",
        },
        
        muted: {
          DEFAULT: "#2D2A26",
          foreground: "#B8AFA3",
        },
        
        accent: {
          DEFAULT: "#22C55E",
          foreground: "#0A1F0F",
        },
        
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FEF2F2",
        },
        
        summited: {
          DEFAULT: "#38BDF8",
          foreground: "#0C1929",
        },
        
        border: "rgba(82, 76, 68, 0.8)",
        input: "#3D3833",
        ring: "rgba(52, 211, 153, 0.5)",
      },
      fontFamily: {
        // Fraunces - display/heading font (serif)
        display: ["Fraunces_400Regular"],
        "display-medium": ["Fraunces_500Medium"],
        "display-semibold": ["Fraunces_600SemiBold"],
        "display-bold": ["Fraunces_700Bold"],
        // IBM Plex Mono - body/data font
        mono: ["IBMPlexMono_400Regular"],
        "mono-medium": ["IBMPlexMono_500Medium"],
        "mono-semibold": ["IBMPlexMono_600SemiBold"],
        // System fallback
        sans: ["System"],
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};
