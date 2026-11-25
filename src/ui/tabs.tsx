import { createContext, useContext, createSignal, splitProps } from "solid-js"
import { cn } from "../lib/cn"

interface TabsContextValue {
    value: () => string
    setValue: (value: string) => void
}

const TabsContext = createContext<TabsContextValue>()

interface TabsProps {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    children: any
    class?: string
}

interface TabsListProps {
    children: any
    class?: string
}

interface TabsTriggerProps {
    value: string
    children: any
    class?: string
    /** primary = workspace switcher; secondary = chart-type pills (mockup) */
    tone?: "primary" | "secondary"
}

interface TabsContentProps {
    value: string
    children: any
    class?: string
}

export const Tabs = (props: TabsProps) => {
    const [local] = splitProps(props, [
        "defaultValue",
        "value",
        "onValueChange",
        "children",
        "class",
    ])
    const [internalValue, setInternalValue] = createSignal(
        local.defaultValue || local.value || ""
    )
    const value = () =>
        local.value !== undefined ? local.value : internalValue()

    const handleValueChange = (newValue: string) => {
        if (local.value === undefined) {
            setInternalValue(newValue)
        }
        local.onValueChange?.(newValue)
    }

    return (
        <TabsContext.Provider value={{ value, setValue: handleValueChange }}>
            <div class={cn("w-full", local.class)}>{local.children}</div>
        </TabsContext.Provider>
    )
}

export const TabsList = (props: TabsListProps) => {
    const [local, others] = splitProps(props, ["children", "class"])
    return (
        <div
            class={cn(
                "inline-flex h-auto items-center justify-center rounded bg-surface-container-lowest border border-outline-variant p-gutter-xs text-on-surface-variant",
                local.class
            )}
            {...others}
        >
            {local.children}
        </div>
    )
}

export const TabsTrigger = (props: TabsTriggerProps) => {
    const [local, others] = splitProps(props, [
        "value",
        "children",
        "class",
        "tone",
    ])
    const context = useContext(TabsContext)

    if (!context) {
        return null
    }

    const isActive = () => context.value() === local.value
    const tone = () => local.tone ?? "primary"
    const isSecondary = () => tone() === "secondary"

    return (
        <button
            {...others}
            type="button"
            data-state={isActive() ? "active" : "inactive"}
            class={cn(
                "inline-flex items-center justify-center gap-gutter-xs whitespace-nowrap rounded-sm font-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isSecondary()
                    ? "px-gutter-sm py-gutter-xs text-label-md"
                    : "px-gutter-md py-gutter-sm text-label-lg",
                local.class
            )}
            classList={{
                "bg-primary text-primary-foreground":
                    isActive() && !isSecondary(),
                "bg-secondary-container text-secondary-on-container":
                    isActive() && isSecondary(),
                "text-on-surface-variant hover:bg-surface-container-high":
                    !isActive(),
            }}
            onClick={() => context.setValue(local.value)}
        >
            {local.children}
        </button>
    )
}

export const TabsContent = (props: TabsContentProps) => {
    const [local, others] = splitProps(props, ["value", "children", "class"])
    const context = useContext(TabsContext)

    if (!context) {
        return null
    }

    const isActive = () => context.value() === local.value

    // Всегда рендерим контент в DOM, но скрываем его через стили
    // Это необходимо для Plotly, который не может отрисовать графики в несуществующих контейнерах
    return (
        <div
            class={cn(
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                local.class
            )}
            style={!isActive() ? "display: none;" : ""}
            {...others}
        >
            {local.children}
        </div>
    )
}
