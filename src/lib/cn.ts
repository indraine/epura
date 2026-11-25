import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * DS typography tokens (`text-label-lg`, `text-headline-sm`, …) must live in the
 * font-size group. Otherwise twMerge treats them as text-color utilities and
 * drops `text-primary-foreground` / `text-on-surface` — washing out active tabs
 * and primary buttons on cobalt fills.
 */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                "text-display-md",
                "text-display-md-mobile",
                "text-headline-lg",
                "text-headline-md",
                "text-headline-sm",
                "text-body-md",
                "text-body-sm",
                "text-label-lg",
                "text-label-md",
                "text-label-sm",
                "text-mono-md",
                "text-mono-sm",
            ],
        },
    },
})

export const cn = (...inputs: ClassValue[]) => {
    return twMerge(clsx(inputs))
}
