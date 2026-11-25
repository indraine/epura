import { type Component, type JSX, splitProps } from "solid-js"
import { cn } from "~/lib/cn"

export interface CheckboxProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
    label?: string
}

const Checkbox: Component<CheckboxProps> = props => {
    const [local, rest] = splitProps(props, ["label", "class", "id"])
    const fieldId = () =>
        local.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`

    return (
        <div class="flex items-center gap-gutter-sm min-w-0">
            <input
                id={fieldId()}
                type="checkbox"
                class={cn(
                    "peer h-4 w-4 shrink-0 rounded-sm border border-outline-variant bg-surface-container-lowest text-primary accent-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
                    local.class
                )}
                {...rest}
            />
            {local.label && (
                <label
                    for={fieldId()}
                    class="font-body text-body-md text-on-surface whitespace-nowrap peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    {local.label}
                </label>
            )}
        </div>
    )
}

export { Checkbox }
