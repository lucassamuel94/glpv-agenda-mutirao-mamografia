import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Cores customizadas do projeto (mantidas como variáveis CSS)
        // Usar via var(--color-primary) quando necessário

        // Cores do shadcn/ui
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width)",
        prominent: "var(--border-width)",
        thick: "var(--border-width-thick)",
      },
      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
      },
      height: {
        // Classes semânticas para inputs e botões
        input: "var(--input-height)", // 40px (2.5rem) - padrão
        "input-md": "var(--input-height-md)", // 44px (2.75rem)
        "input-lg": "var(--input-height-lg)", // 48px (3rem)
        "input-xl": "var(--input-height-xl)", // 52px (3.25rem)
        "input-2xl": "var(--input-height-2xl)", // 56px (3.5rem)
        btn: "var(--input-height)", // 40px (2.5rem) - padrão
        "btn-md": "var(--input-height-md)", // 44px (2.75rem)
        "btn-lg": "var(--input-height-lg)", // 48px (3rem)
        "btn-xl": "var(--input-height-xl)", // 52px (3.25rem)
        "btn-2xl": "var(--input-height-2xl)", // 56px (3.5rem)
      },
      minHeight: {
        // Classes semânticas para inputs e botões
        input: "var(--input-height)",
        "input-md": "var(--input-height-md)",
        "input-lg": "var(--input-height-lg)",
        "input-xl": "var(--input-height-xl)",
        "input-2xl": "var(--input-height-2xl)",
      },
      maxHeight: {
        // Classes semânticas para inputs e botões (se necessário)
        input: "var(--input-height)",
        "input-md": "var(--input-height-md)",
        "input-lg": "var(--input-height-lg)",
        "input-xl": "var(--input-height-xl)",
        "input-2xl": "var(--input-height-2xl)",
      },
      gap: {
        tight: "var(--gap-tight)",
        relaxed: "var(--gap-relaxed)",
        loose: "var(--gap-loose)",
      },
      boxShadow: {
        // Shadows minimalistas - apenas quando realmente necessário
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        md: "0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        // Popover com shadow bem sutil
        popover: "0 2px 8px -2px rgba(0, 0, 0, 0.04)",
        // Sem shadow para preferir borders
        none: "none",
      },
      letterSpacing: {
        tighter: "-0.022em",
        tight: "-0.011em",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out forwards",
        slideInRight: "slideInRight 0.3s ease-out forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
