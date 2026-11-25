import {
    type Component,
    type JSX,
    splitProps,
    For,
    createEffect,
} from "solid-js"
import { cn } from "~/lib/cn"

export interface SelectOption {
    value: string
    label: string
}

export interface SelectProps extends Omit<
    JSX.SelectHTMLAttributes<HTMLSelectElement>,
    "value"
> {
    label?: string
    error?: string
    helperText?: string
    options: SelectOption[]
    compact?: boolean
    value?: string | (() => string | undefined)
}

const Select: Component<SelectProps> = props => {
    const [local, rest] = splitProps(props, [
        "label",
        "error",
        "helperText",
        "options",
        "class",
        "id",
        "compact",
        "value",
    ])
    const fieldId = () =>
        local.id || `select-${Math.random().toString(36).substr(2, 9)}`
    let selectElement: HTMLSelectElement | undefined

    // Принудительно обновляем значение select при изменении value
    createEffect(() => {
        const currentValue =
            typeof local.value === "function" ? local.value() : local.value
        if (
            selectElement &&
            currentValue !== undefined &&
            currentValue !== null
        ) {
            selectElement.value = String(currentValue)
        }
    })

    return (
        <div class="flex flex-col gap-gutter-xs">
            {local.label && (
                <label
                    for={fieldId()}
                    class="font-label text-label-sm text-on-surface-variant peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {local.label}
                </label>
            )}
            <select
                ref={selectElement}
                id={fieldId()}
                class={cn(
                    "flex w-full rounded border border-outline-variant bg-surface-container-lowest px-gutter-sm font-body text-body-md text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                    local.compact
                        ? "h-11 lg:h-8 py-gutter-sm lg:py-gutter-xs text-body-md lg:text-body-sm"
                        : "h-12 lg:h-9 py-gutter-md lg:py-gutter-sm",
                    local.error &&
                        "border-destructive focus-visible:border-destructive focus-visible:ring-destructive",
                    local.class
                )}
                value={
                    typeof local.value === "function"
                        ? local.value()
                        : local.value
                }
                {...rest}
            >
                <For each={local.options}>
                    {option => {
                        const currentValue =
                            typeof local.value === "function"
                                ? local.value()
                                : local.value
                        const isSelected =
                            String(option.value) === String(currentValue ?? "")
                        return (
                            <option value={option.value} selected={isSelected}>
                                {option.label}
                            </option>
                        )
                    }}
                </For>
            </select>
            {local.error && (
                <p class="font-label text-label-sm text-destructive">
                    {local.error}
                </p>
            )}
            {local.helperText && !local.error && (
                <p class="font-body text-body-sm text-outline">
                    {local.helperText}
                </p>
            )}
        </div>
    )
}

export { Select }
