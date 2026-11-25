import { type Component, type JSX, splitProps } from "solid-js"
import { cn } from "~/lib/cn"

export interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {}

const Card: Component<CardProps> = props => {
    const [, rest] = splitProps(props, ["class"])
    return (
        <div
            class={cn(
                "rounded-md border border-outline-variant bg-surface-container-low text-on-surface shadow-none",
                props.class
            )}
            {...rest}
        />
    )
}

export interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {}

const CardHeader: Component<CardHeaderProps> = props => {
    const [, rest] = splitProps(props, ["class"])
    return (
        <div
            class={cn("flex flex-col gap-gutter-sm p-gutter-lg", props.class)}
            {...rest}
        />
    )
}

export interface CardTitleProps extends JSX.HTMLAttributes<HTMLHeadingElement> {}

const CardTitle: Component<CardTitleProps> = props => {
    const [, rest] = splitProps(props, ["class"])
    return (
        <h3
            class={cn(
                "font-headline text-headline-md text-on-surface",
                props.class
            )}
            {...rest}
        />
    )
}

export interface CardContentProps extends JSX.HTMLAttributes<HTMLDivElement> {}

const CardContent: Component<CardContentProps> = props => {
    const [, rest] = splitProps(props, ["class"])
    return <div class={cn("p-gutter-lg pt-0", props.class)} {...rest} />
}

export { Card, CardHeader, CardTitle, CardContent }
