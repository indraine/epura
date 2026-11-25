import {
    createSignal,
    createEffect,
    createMemo,
    Show,
    For,
    onCleanup,
    type Component,
} from "solid-js"
import { Portal } from "solid-js/web"
import { Popover } from "@kobalte/core"
import { Button } from "../ui/button"
import { cn } from "~/lib/cn"
import { useI18N } from "~/i18n"

interface TourGuideProps {
    open: boolean
    onOpenChange?: (open: boolean) => void
}

type TourStepType = "dialog" | "tooltip"
type TourPlacement = "top" | "bottom" | "left" | "right"

interface TourStep {
    id: string
    type: TourStepType
    title: string
    description: string
    target?: () => HTMLElement | null
    placement?: TourPlacement
    actions: Array<{
        label: string
        action: "next" | "prev" | "dismiss" | "skip"
    }>
}

const getTourSteps = (t: ReturnType<typeof useI18N>): TourStep[] => [
    {
        id: "welcome",
        type: "dialog",
        title: t("tour.welcome.title"),
        description: t("tour.welcome.description"),
        actions: [{ label: t("tour.welcome.start"), action: "next" }],
    },
    {
        id: "form",
        type: "tooltip",
        placement: "right",
        target: () =>
            document.querySelector('[data-tour="form-section"]') as HTMLElement,
        title: t("tour.form.title"),
        description: t("tour.form.description"),
        actions: [
            { label: t("tour.form.prev"), action: "prev" },
            { label: t("tour.form.next"), action: "next" },
        ],
    },
    {
        id: "plots",
        type: "tooltip",
        placement: "left",
        target: () =>
            document.querySelector(
                '[data-tour="plots-section"]'
            ) as HTMLElement,
        title: t("tour.plots.title"),
        description: t("tour.plots.description"),
        actions: [
            { label: t("tour.plots.prev"), action: "prev" },
            { label: t("tour.plots.next"), action: "next" },
        ],
    },
    {
        id: "settings",
        type: "tooltip",
        placement: "bottom",
        target: () =>
            document.querySelector(
                '[data-tour="settings-toggle"]'
            ) as HTMLElement,
        title: t("tour.settings.title"),
        description: t("tour.settings.description"),
        actions: [
            { label: t("tour.settings.prev"), action: "prev" },
            { label: t("tour.settings.next"), action: "next" },
        ],
    },
    {
        id: "theme",
        type: "tooltip",
        placement: "bottom",
        target: () =>
            document.querySelector('[data-tour="theme-toggle"]') as HTMLElement,
        title: t("tour.theme.title"),
        description: t("tour.theme.description"),
        actions: [
            { label: t("tour.theme.prev"), action: "prev" },
            { label: t("tour.theme.next"), action: "next" },
        ],
    },
    {
        id: "complete",
        type: "dialog",
        title: t("tour.complete.title"),
        description: t("tour.complete.description"),
        actions: [{ label: t("tour.complete.close"), action: "dismiss" }],
    },
]

// Компонент для tooltip шагов
const TooltipStep: Component<{
    step: TourStep
    currentStepIndex: number
    totalSteps: number
    onAction: (action: "next" | "prev" | "dismiss" | "skip") => void
}> = props => {
    const t = useI18N()
    const targetElement = () => props.step.target?.()

    // Создаем виртуальный якорь для позиционирования
    const updateAnchorPosition = (
        anchorEl: HTMLElement,
        target: HTMLElement
    ) => {
        const rect = target.getBoundingClientRect()
        anchorEl.style.position = "fixed"
        anchorEl.style.left = `${rect.left}px`
        anchorEl.style.top = `${rect.top}px`
        anchorEl.style.width = `${rect.width}px`
        anchorEl.style.height = `${rect.height}px`
        anchorEl.style.pointerEvents = "none"
        anchorEl.style.zIndex = "9999"
    }

    return (
        <Show when={targetElement()}>
            {target => (
                <Popover.Root open={true} modal={false}>
                    <Popover.Anchor
                        ref={el => {
                            const element = target()
                            if (el && element) {
                                updateAnchorPosition(el, element)
                                // Обновляем позицию при скролле или изменении размера
                                const updatePosition = () =>
                                    updateAnchorPosition(el, element)
                                // Используем passive для улучшения производительности
                                window.addEventListener(
                                    "scroll",
                                    updatePosition,
                                    {
                                        capture: true,
                                        passive: true,
                                    }
                                )
                                window.addEventListener(
                                    "resize",
                                    updatePosition,
                                    {
                                        passive: true,
                                    }
                                )

                                // Cleanup при размонтировании
                                onCleanup(() => {
                                    window.removeEventListener(
                                        "scroll",
                                        updatePosition,
                                        {
                                            capture: true,
                                        } as EventListenerOptions
                                    )
                                    window.removeEventListener(
                                        "resize",
                                        updatePosition
                                    )
                                })
                            }
                        }}
                    />
                    <Popover.Portal>
                        <Popover.Content
                            class={cn(
                                "z-[10000] w-80 rounded-lg border border-border bg-card text-card-foreground shadow-lg p-6",
                                "data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0",
                                props.step.placement === "right" &&
                                    "data-[side=right]:slide-in-from-left-2",
                                props.step.placement === "left" &&
                                    "data-[side=left]:slide-in-from-right-2",
                                props.step.placement === "top" &&
                                    "data-[side=top]:slide-in-from-bottom-2",
                                props.step.placement === "bottom" &&
                                    "data-[side=bottom]:slide-in-from-top-2"
                            )}
                        >
                            <Popover.Arrow />
                            <Popover.Title class="text-lg font-semibold mb-2">
                                {props.step.title}
                            </Popover.Title>
                            <Popover.Description class="text-sm text-muted-foreground mb-4">
                                {props.step.description}
                            </Popover.Description>
                            <div class="flex items-center justify-between gap-2">
                                <div class="text-xs text-muted-foreground">
                                    {t("tour.stepCounter", {
                                        current: props.currentStepIndex + 1,
                                        total: props.totalSteps,
                                    })}
                                </div>
                                <div class="flex gap-2">
                                    <For each={props.step.actions}>
                                        {action => (
                                            <Button
                                                variant={
                                                    action.action ===
                                                        "dismiss" ||
                                                    action.action === "skip" ||
                                                    action.action === "prev"
                                                        ? "outline"
                                                        : "default"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    props.onAction(
                                                        action.action
                                                    )
                                                }
                                            >
                                                {action.label}
                                            </Button>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Popover.Content>
                    </Popover.Portal>
                </Popover.Root>
            )}
        </Show>
    )
}

const Tour: Component<TourGuideProps> = props => {
    const [currentStepIndex, setCurrentStepIndex] = createSignal<number>(-1)
    const [isOpen, setIsOpen] = createSignal(false)
    const t = useI18N()
    const tourSteps = createMemo(() => getTourSteps(t))

    const currentStep = createMemo(() => {
        const index = currentStepIndex()
        const steps = tourSteps()
        return index >= 0 && index < steps.length ? steps[index] : null
    })

    const isDialog = createMemo(() => currentStep()?.type === "dialog")
    const totalSteps = createMemo(() => tourSteps().length)

    // Синхронизация с внешним состоянием
    createEffect(() => {
        const shouldOpen = props.open
        const currentlyOpen = isOpen()

        if (shouldOpen && !currentlyOpen) {
            startTour()
        } else if (!shouldOpen && currentlyOpen) {
            closeTour()
        }
    })

    const startTour = () => {
        setCurrentStepIndex(0)
        setIsOpen(true)
    }

    const handleAction = (action: "next" | "prev" | "dismiss" | "skip") => {
        const current = currentStepIndex()

        if (action === "dismiss" || action === "skip") {
            closeTour()
            return
        }

        if (action === "next") {
            const steps = tourSteps()
            if (current < steps.length - 1) {
                setCurrentStepIndex(current + 1)
            } else {
                closeTour()
            }
        } else if (action === "prev") {
            if (current > 0) {
                setCurrentStepIndex(current - 1)
            }
        }
    }

    const closeTour = () => {
        setIsOpen(false)
        setCurrentStepIndex(-1)
        props.onOpenChange?.(false)
    }

    const step = currentStep()

    return (
        <>
            {/* Backdrop */}
            <Show when={isOpen()}>
                <div
                    class="fixed inset-0 z-[9998] bg-black/50 dark:bg-black/70"
                    onClick={() => {
                        // Не закрываем при клике на backdrop для тура
                    }}
                />
            </Show>

            {/* Dialog шаги */}
            <Show when={isOpen() && isDialog() && step}>
                <Portal>
                    <div class="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
                        <div
                            class={cn(
                                "pointer-events-auto w-96 rounded-lg border border-border bg-card text-card-foreground shadow-lg p-6",
                                "animate-in fade-in-0 zoom-in-95"
                            )}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="tour-dialog-title"
                            aria-describedby="tour-dialog-description"
                            onKeyDown={e => {
                                if (e.key === "Escape") {
                                    e.preventDefault()
                                    // Не закрываем по Escape для тура
                                }
                            }}
                        >
                            <h2
                                id="tour-dialog-title"
                                class="text-lg font-semibold mb-2"
                            >
                                {step?.title}
                            </h2>
                            <p
                                id="tour-dialog-description"
                                class="text-sm text-muted-foreground mb-4"
                            >
                                {step?.description}
                            </p>
                            <div class="flex items-center justify-between gap-2">
                                <div class="text-xs text-muted-foreground">
                                    {t("tour.stepCounter", {
                                        current: currentStepIndex() + 1,
                                        total: totalSteps(),
                                    })}
                                </div>
                                <div class="flex gap-2">
                                    <For each={step?.actions}>
                                        {action => (
                                            <Button
                                                variant={
                                                    action.action ===
                                                        "dismiss" ||
                                                    action.action === "skip" ||
                                                    action.action === "prev"
                                                        ? "outline"
                                                        : "default"
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    handleAction(action.action)
                                                }
                                            >
                                                {action.label}
                                            </Button>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            </Show>

            {/* Tooltip шаги */}
            <Show when={isOpen() && !isDialog() && currentStep()}>
                <TooltipStep
                    step={currentStep()!}
                    currentStepIndex={currentStepIndex()}
                    totalSteps={totalSteps()}
                    onAction={handleAction}
                />
            </Show>
        </>
    )
}

export default Tour
