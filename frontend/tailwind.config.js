/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sentinel: {
          dark: "#0a0f1d",
          card: "#111827",
          border: "#1f293d",
          accent: "#3b82f6",
        },
        risk: {
          safe: "#10b981",       // emerald-500
          watch: "#f59e0b",      // amber-500
          warning: "#f97316",    // orange-500
          critical: "#ef4444",   // red-500
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
