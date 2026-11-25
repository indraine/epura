import { type Component, type JSX, splitProps } from "solid-js"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/lib/cn"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-gutter-sm whitespace-nowrap font-label ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-[1.125rem] [&_svg]:shrink-0 select-none",
    {
        variants: {
            variant: {
                default:
                    "rounded border border-transparent bg-primary text-primary-foreground hover:bg-primary-container hover:text-primary-on-container",
                destructive:
                    "rounded bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "rounded border border-outline-variant bg-surface-container-high text-on-surface hover:bg-surface-bright",
                secondary:
                    "rounded-sm bg-secondary-container text-secondary-on-container hover:bg-primary hover:text-primary-foreground",
                ghost: "rounded-sm text-on-surface hover:bg-surface-container-high",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                // Mockup primary: px-gutter-lg py-gutter-sm + label-lg (~36px)
                default: "h-9 px-gutter-lg py-gutter-sm text-label-lg",
                // Compact / secondary actions
                sm: "h-8 px-gutter-md py-gutter-xs text-label-md rounded-sm",
                lg: "h-10 px-gutter-xl py-gutter-md text-label-lg",
                // Mockup icon: p-gutter-sm + headline-md glyph (~36px)
                icon: "h-9 w-9 p-gutter-sm rounded-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends
        JSX.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button: Component<ButtonProps> = props => {
    const [, rest] = splitProps(props, ["variant", "size", "class"])
    return (
        <button
            class={cn(
                buttonVariants({ variant: props.variant, size: props.size }),
                props.class
            )}
            {...rest}
        />
    )
}

export { Button, buttonVariants }
