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
        // PathQuest "retro topographic" palette - dark mode values
        // (We force dark mode in the app)
        background: "#25221E",
        foreground: "#EDE5D8",
        
        card: {
          DEFAULT: "rgba(22, 17, 7, 0.92)",
          foreground: "#EDE5D8",
        },
        
        popover: {
          DEFAULT: "rgba(22, 17, 7, 0.92)",
          foreground: "#EDE5D8",
        },
        
        primary: {
          DEFAULT: "#5B9167",
          foreground: "#F5F2ED",
        },
        
        secondary: {
          DEFAULT: "#B8845A",
          foreground: "#EDE5D8",
        },
        
        muted: {
          DEFAULT: "#37342F",
          foreground: "#A9A196",
        },
        
        accent: {
          DEFAULT: "#4A5541",
          foreground: "#EDE5D8",
        },
        
        destructive: {
          DEFAULT: "#C44536",
          foreground: "#FAF8F5",
        },
        
        summited: {
          DEFAULT: "#4A8BC4",
          foreground: "#F5F2ED",
        },
        
        border: "rgba(69, 65, 60, 0.7)",
        input: "#3A3632",
        ring: "rgba(91, 145, 103, 0.5)",
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
