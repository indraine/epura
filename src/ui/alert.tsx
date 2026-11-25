import type { Component } from "solid-js"
import { Dialog } from "./dialog"
import { Button } from "./button"

export type AlertProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmLabel?: string
}

/** Компактный модал для ошибок (вместо window.alert). */
export const Alert: Component<AlertProps> = props => {
    return (
        <Dialog.Root
            open={props.open}
            onOpenChange={props.onOpenChange}
            modal={true}
        >
            <Dialog.Portal>
                {/* Всегда видимый затемнённый фон (у sheet-диалогов на mobile он скрыт) */}
                <Dialog.Overlay class="!block max-lg:!block bg-black/45" />
                <Dialog.Content
                    class={[
                        // Оболочка на весь экран без translate — иначе zoom ломает центрирование
                        "!inset-0 !left-0 !top-0 !right-0 !bottom-0",
                        "!h-[100dvh] !w-full !max-w-none !translate-x-0 !translate-y-0",
                        "!rounded-none !border-0 !bg-transparent !p-0 !shadow-none",
                        "flex items-center justify-center",
                        // Только fade, без zoom/slide
                        "data-[expanded]:!zoom-in-100 data-[closed]:!zoom-out-100",
                        "data-[expanded]:[--tw-enter-scale:1] data-[closed]:[--tw-exit-scale:1]",
                        "data-[expanded]:fade-in-0 data-[closed]:fade-out-0",
                        "duration-150",
                    ].join(" ")}
                >
                    <div
                        class={[
                            "w-[min(100%-2rem,28rem)] max-h-[min(90dvh,32rem)]",
                            "flex flex-col gap-gutter-md rounded-md border border-error/40",
                            "bg-surface-container-low p-gutter-lg text-on-surface shadow-none",
                            "outline-none",
                        ].join(" ")}
                        role="presentation"
                    >
                        <Dialog.Header class="space-y-gutter-sm text-left">
                            <div class="flex items-start gap-gutter-md">
                                <div
                                    class="mt-0.5 size-10 shrink-0 rounded-full bg-error-container flex items-center justify-center text-error"
                                    aria-hidden="true"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="size-5"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line
                                            x1="12"
                                            y1="16"
                                            x2="12.01"
                                            y2="16"
                                        />
                                    </svg>
                                </div>
                                <div class="min-w-0 flex-1 space-y-gutter-xs">
                                    <Dialog.Title class="text-headline-sm text-error">
                                        {props.title}
                                    </Dialog.Title>
                                    <Dialog.Description class="text-body-md text-on-surface-variant whitespace-pre-wrap">
                                        {props.description}
                                    </Dialog.Description>
                                </div>
                            </div>
                        </Dialog.Header>
                        <Dialog.Footer class="mt-gutter-sm">
                            <Button
                                type="button"
                                variant="destructive"
                                class="cursor-pointer w-full sm:w-auto"
                                onClick={() => props.onOpenChange(false)}
                            >
                                {props.confirmLabel ?? "Закрыть"}
                            </Button>
                        </Dialog.Footer>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
