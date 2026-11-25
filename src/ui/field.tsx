import { type Component, type JSX, splitProps, createMemo } from "solid-js"
import { cn } from "~/lib/cn"

export interface FieldProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string | (() => string | undefined)
    helperText?: string
    compact?: boolean
    warning?: boolean
}

const Field: Component<FieldProps> = props => {
    const [local, rest] = splitProps(props, [
        "label",
        "error",
        "helperText",
        "class",
        "id",
        "compact",
        "warning",
    ])
    const fieldId = () =>
        local.id || `field-${Math.random().toString(36).substr(2, 9)}`

    const errorMessage = createMemo(() => {
        if (!local.error) return undefined
        return typeof local.error === "function" ? local.error() : local.error
    })

    const hasError = createMemo(() => !!errorMessage())

    return (
        <div
            class={cn(
                "flex flex-col",
                local.compact ? "gap-gutter-xs" : "gap-gutter-xs"
            )}
        >
            {local.label && (
                <label
                    for={fieldId()}
                    class={cn(
                        "font-label text-on-surface-variant peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                        local.compact ? "text-label-sm" : "text-label-sm"
                    )}
                >
                    {local.label}
                </label>
            )}
            <input
                id={fieldId()}
                class={cn(
                    "flex w-full rounded border border-outline-variant bg-surface-container-lowest px-gutter-sm font-mono tabular-nums text-on-surface ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-on-surface placeholder:text-outline focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                    local.compact
                        ? "h-11 lg:h-8 py-gutter-sm lg:py-gutter-xs text-mono-md lg:text-mono-sm"
                        : "h-12 lg:h-9 py-gutter-md lg:py-gutter-sm text-mono-md",
                    hasError() &&
                        "border-destructive focus-visible:border-destructive focus-visible:ring-destructive animate-flash-red",
                    local.warning &&
                        !hasError() &&
                        "border-warning focus-visible:border-warning focus-visible:ring-warning bg-warning/10",
                    local.class
                )}
                {...rest}
            />
            {errorMessage() && (
                <p class="font-label text-label-sm text-destructive">
                    {errorMessage()}
                </p>
            )}
            {local.helperText && !hasError() && (
                <p class="font-body text-body-sm text-outline">
                    {local.helperText}
                </p>
            )}
        </div>
    )
}

export { Field }
