/** @type {import("tailwindcss").Config} */
module.exports = {
    darkMode: ["variant", [".dark &", '[data-kb-theme="dark"] &']],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                headline: [
                    '"Mulish"',
                    "ui-sans-serif",
                    "system-ui",
                    "sans-serif",
                ],
                display: [
                    '"Mulish"',
                    "ui-sans-serif",
                    "system-ui",
                    "sans-serif",
                ],
                sans: ['"PT Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
                body: ['"PT Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
                label: [
                    '"PT Sans"',
                    "ui-sans-serif",
                    "system-ui",
                    "sans-serif",
                ],
                mono: ['"Source Code Pro"', "ui-monospace", "monospace"],
            },
            fontSize: {
                "display-md": [
                    "36px",
                    {
                        lineHeight: "42px",
                        letterSpacing: "-0.5px",
                        fontWeight: "700",
                    },
                ],
                "display-md-mobile": [
                    "28px",
                    {
                        lineHeight: "34px",
                        letterSpacing: "-0.25px",
                        fontWeight: "700",
                    },
                ],
                "headline-lg": [
                    "24px",
                    {
                        lineHeight: "30px",
                        letterSpacing: "-0.25px",
                        fontWeight: "700",
                    },
                ],
                "headline-md": [
                    "18px",
                    {
                        lineHeight: "24px",
                        letterSpacing: "-0.1px",
                        fontWeight: "700",
                    },
                ],
                "headline-sm": [
                    "15px",
                    {
                        lineHeight: "20px",
                        letterSpacing: "0px",
                        fontWeight: "600",
                    },
                ],
                "body-md": [
                    "14px",
                    {
                        lineHeight: "20px",
                        letterSpacing: "0px",
                        fontWeight: "400",
                    },
                ],
                "body-sm": [
                    "12px",
                    {
                        lineHeight: "16px",
                        letterSpacing: "0.1px",
                        fontWeight: "400",
                    },
                ],
                "label-lg": [
                    "14px",
                    {
                        lineHeight: "20px",
                        letterSpacing: "0.1px",
                        fontWeight: "700",
                    },
                ],
                "label-md": [
                    "12px",
                    {
                        lineHeight: "16px",
                        letterSpacing: "0.2px",
                        fontWeight: "700",
                    },
                ],
                "label-sm": [
                    "11px",
                    {
                        lineHeight: "14px",
                        letterSpacing: "0.25px",
                        fontWeight: "700",
                    },
                ],
                "mono-md": [
                    "14px",
                    {
                        lineHeight: "20px",
                        letterSpacing: "0px",
                        fontWeight: "500",
                    },
                ],
                "mono-sm": [
                    "12px",
                    {
                        lineHeight: "16px",
                        letterSpacing: "0px",
                        fontWeight: "500",
                    },
                ],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    container: "hsl(var(--primary-container))",
                    "on-container": "hsl(var(--on-primary-container))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                    container: "hsl(var(--secondary-container))",
                    "on-container": "hsl(var(--on-secondary-container))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                info: {
                    DEFAULT: "hsl(var(--info))",
                    foreground: "hsl(var(--info-foreground))",
                },
                success: {
                    DEFAULT: "hsl(var(--success))",
                    foreground: "hsl(var(--success-foreground))",
                },
                warning: {
                    DEFAULT: "hsl(var(--warning))",
                    foreground: "hsl(var(--warning-foreground))",
                },
                error: {
                    DEFAULT: "hsl(var(--error))",
                    foreground: "hsl(var(--error-foreground))",
                    container: "hsl(var(--error-container))",
                    "on-container": "hsl(var(--on-error-container))",
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
                surface: {
                    DEFAULT: "hsl(var(--surface))",
                    dim: "hsl(var(--surface-dim))",
                    bright: "hsl(var(--surface-bright))",
                    "container-lowest": "hsl(var(--surface-container-lowest))",
                    "container-low": "hsl(var(--surface-container-low))",
                    container: "hsl(var(--surface-container))",
                    "container-high": "hsl(var(--surface-container-high))",
                    "container-highest":
                        "hsl(var(--surface-container-highest))",
                },
                "on-surface": {
                    DEFAULT: "hsl(var(--on-surface))",
                    variant: "hsl(var(--on-surface-variant))",
                },
                outline: {
                    DEFAULT: "hsl(var(--outline))",
                    variant: "hsl(var(--outline-variant))",
                },
                chart: {
                    cyan: "hsl(var(--chart-cyan))",
                    amber: "hsl(var(--chart-amber))",
                    emerald: "hsl(var(--chart-emerald))",
                    rose: "hsl(var(--chart-rose))",
                },
            },
            borderRadius: {
                sm: "6px",
                DEFAULT: "8px",
                md: "12px",
                lg: "16px",
                xl: "calc(var(--radius) + 8px)",
                full: "9999px",
            },
            spacing: {
                "gutter-xs": "4px",
                "gutter-sm": "8px",
                "gutter-md": "12px",
                "gutter-lg": "16px",
                "gutter-xl": "24px",
                section: "32px",
                "page-margin": "24px",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--kb-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--kb-accordion-content-height)" },
                    to: { height: 0 },
                },
                "content-show": {
                    from: { opacity: 0, transform: "scale(0.96)" },
                    to: { opacity: 1, transform: "scale(1)" },
                },
                "content-hide": {
                    from: { opacity: 1, transform: "scale(1)" },
                    to: { opacity: 0, transform: "scale(0.96)" },
                },
                "flash-red": {
                    "0%, 100%": {
                        borderColor: "hsl(var(--destructive))",
                        boxShadow: "0 0 0 2px rgba(220, 38, 38, 0.2)",
                    },
                    "50%": {
                        borderColor: "hsl(var(--destructive))",
                        boxShadow: "0 0 0 4px rgba(220, 38, 38, 0.5)",
                        backgroundColor: "rgba(220, 38, 38, 0.05)",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "content-show": "content-show 0.2s ease-out",
                "content-hide": "content-hide 0.2s ease-out",
                "flash-red": "flash-red 1.5s ease-in-out infinite",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
