import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ngsrn: {
          primary: '#003366', // Deep Blue
          secondary: '#2E8B57', // Emerald Green
          accent: '#FFD700', // Gold
          blue: '#003366', // Deep Blue (alias)
          green: '#2E8B57', // Emerald Green (alias)
          gold: '#FFD700', // Gold (alias)
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-merriweather)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} satisfies Config;