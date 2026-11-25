import { splitProps, createContext } from "solid-js"
import { Dialog as KobalteDialog } from "@kobalte/core"
import { cn } from "../lib/cn"

interface DialogContextValue {
    isOpen: () => boolean
}

const DialogContext = createContext<DialogContextValue>()

interface DialogProps {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (isOpen: boolean) => void
    modal?: boolean
    children: any
}

interface DialogTriggerProps {
    as?: string | any
    children: any
    class?: string
}

interface DialogContentProps {
    children: any
    class?: string
    onEscapeKeyDown?: (event: KeyboardEvent) => void
    onPointerDownOutside?: (event: PointerEvent) => void
}

interface DialogHeaderProps {
    children: any
    class?: string
}

interface DialogTitleProps {
    children: any
    class?: string
}

interface DialogDescriptionProps {
    children: any
    class?: string
}

interface DialogFooterProps {
    children: any
    class?: string
}

const DialogRoot = (props: DialogProps) => {
    const [local, others] = splitProps(props, [
        "children",
        "open",
        "defaultOpen",
        "onOpenChange",
        "modal",
    ])
    const isOpen = () => local.open ?? false

    return (
        <DialogContext.Provider value={{ isOpen }}>
            <KobalteDialog.Root
                open={local.open}
                defaultOpen={local.defaultOpen}
                onOpenChange={local.onOpenChange}
                modal={local.modal ?? true}
                {...others}
            >
                {local.children}
            </KobalteDialog.Root>
        </DialogContext.Provider>
    )
}

const DialogTrigger = (props: DialogTriggerProps) => {
    const [local, others] = splitProps(props, ["as", "children", "class"])

    return (
        <KobalteDialog.Trigger
            as={local.as || "button"}
            class={cn("outline-none", local.class)}
            {...others}
        >
            {local.children}
        </KobalteDialog.Trigger>
    )
}

const DialogPortal = (props: { children: any }) => {
    return <KobalteDialog.Portal>{props.children}</KobalteDialog.Portal>
}

const DialogOverlay = (props: { class?: string }) => {
    return (
        <KobalteDialog.Overlay
            class={cn(
                // Mobile: full-page sheets have no dimmed backdrop (mockup)
                "fixed inset-0 z-50 bg-black/50 max-lg:hidden data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
                props.class
            )}
        />
    )
}

const DialogContent = (props: DialogContentProps) => {
    const [local, others] = splitProps(props, [
        "children",
        "class",
        "onEscapeKeyDown",
        "onPointerDownOutside",
    ])

    return (
        <KobalteDialog.Content
            class={cn(
                // Mobile (<lg): full-viewport page with own header/close (Stitch mockup)
                // Desktop: centered modal card
                "fixed z-50 flex flex-col gap-gutter-lg border-outline-variant bg-surface-container-low text-on-surface shadow-none outline-none",
                "inset-0 w-full h-[100dvh] max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0",
                "lg:inset-auto lg:left-[50%] lg:top-[50%] lg:h-auto lg:max-h-[90vh] lg:w-full lg:max-w-lg lg:translate-x-[-50%] lg:translate-y-[-50%] lg:rounded-md lg:border lg:p-gutter-xl",
                "data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
                "data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95",
                local.class
            )}
            onEscapeKeyDown={local.onEscapeKeyDown}
            on:pointerdown={local.onPointerDownOutside}
            {...others}
        >
            {local.children}
        </KobalteDialog.Content>
    )
}

const DialogHeader = (props: DialogHeaderProps) => {
    const [local, others] = splitProps(props, ["children", "class"])
    return (
        <div
            class={cn(
                "flex flex-col space-y-1.5 text-center sm:text-left",
                local.class
            )}
            {...others}
        >
            {local.children}
        </div>
    )
}

const DialogTitle = (props: DialogTitleProps) => {
    const [local, others] = splitProps(props, ["children", "class"])
    return (
        <KobalteDialog.Title
            class={cn(
                "font-headline text-headline-md text-on-surface",
                local.class
            )}
            {...others}
        >
            {local.children}
        </KobalteDialog.Title>
    )
}

const DialogDescription = (props: DialogDescriptionProps) => {
    const [local, others] = splitProps(props, ["children", "class"])
    return (
        <KobalteDialog.Description
            class={cn("font-body text-body-sm text-outline", local.class)}
            {...others}
        >
            {local.children}
        </KobalteDialog.Description>
    )
}

const DialogFooter = (props: DialogFooterProps) => {
    const [local, others] = splitProps(props, ["children", "class"])
    return (
        <div
            class={cn(
                "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
                local.class
            )}
            {...others}
        >
            {local.children}
        </div>
    )
}

const DialogClose = (props: {
    children: any
    class?: string
    as?: string | any
}) => {
    const [local, others] = splitProps(props, ["children", "class", "as"])
    return (
        <KobalteDialog.CloseButton
            as={local.as || "button"}
            class={cn("outline-none", local.class)}
            {...others}
        >
            {local.children}
        </KobalteDialog.CloseButton>
    )
}

export const Dialog = {
    Root: DialogRoot,
    Trigger: DialogTrigger,
    Portal: DialogPortal,
    Overlay: DialogOverlay,
    Content: DialogContent,
    Header: DialogHeader,
    Title: DialogTitle,
    Description: DialogDescription,
    Footer: DialogFooter,
    Close: DialogClose,
}
