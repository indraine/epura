import {
    For,
    Show,
    batch,
    createEffect,
    createResource,
    createSignal,
    onCleanup,
    onMount,
    type Accessor,
    type JSX,
} from "solid-js"
import { Popover } from "@kobalte/core"
import type { BeamSetup, PlotData } from "~/core/types"
import { Button } from "~/ui/button"
import { Dialog } from "~/ui/dialog"
import { Field } from "~/ui/field"
import { Alert } from "~/ui/alert"
import {
    getAllCalculations,
    getMaxCalculations,
    setMaxCalculations,
    clearAllCalculations,
    DEFAULT_MAX_CALCULATIONS,
    MAX_MAX_CALCULATIONS,
} from "~/core/db"
import {
    formatElapsedTime,
    formatDateTime,
    formatCalculationTime,
} from "./format"
import {
    downloadCurrentAsXLSX,
    downloadAsXLSX,
    downloadAsJSON,
    downloadStackedEpuresPng,
} from "./exports"
import { Plotly, isPlotlyReady } from "./Canvas"
import type { PlotTheme } from "./theme"

export type TabsProps = {
    plotData: Accessor<PlotData | null>
    isCalculating: Accessor<boolean | undefined>
    calculationError: Accessor<string | null | undefined>
    hasValidationError: Accessor<boolean | undefined>
    plotTheme: Accessor<PlotTheme>
    stressHost: Accessor<HTMLDivElement | null>
    shearHost: Accessor<HTMLDivElement | null>
    momentHost: Accessor<HTMLDivElement | null>
    onApplyHistorySetup?: (setup: BeamSetup) => void
}

export const Tabs = (props: TabsProps): JSX.Element => {
    const [isHistoryOpen, setIsHistoryOpen] = createSignal(false)
    const [historyTrigger, setHistoryTrigger] = createSignal(0)
    const [history] = createResource(historyTrigger, async () => {
        const records = await getAllCalculations()
        records.sort((a, b) => b.startTime - a.startTime)
        return records
    })

    let historyUpdateTimer: number | null = null
    const debouncedUpdateHistory = () => {
        if (historyUpdateTimer !== null) {
            clearTimeout(historyUpdateTimer)
        }
        historyUpdateTimer = window.setTimeout(() => {
            setHistoryTrigger(t => t + 1)
            historyUpdateTimer = null
        }, 200)
    }

    onCleanup(() => {
        if (historyUpdateTimer !== null) {
            clearTimeout(historyUpdateTimer)
        }
    })

    const [isSettingsOpen, setIsSettingsOpen] = createSignal(false)
    const [maxCalculations, setMaxCalculationsValue] = createSignal<number>(
        DEFAULT_MAX_CALCULATIONS
    )
    const [maxCalculationsError, setMaxCalculationsError] = createSignal<
        string | undefined
    >(undefined)
    const [openDownloadMenuId, setOpenDownloadMenuId] = createSignal<
        string | null
    >(null)
    const [isExportingEpures, setIsExportingEpures] = createSignal(false)
    const [calculationStartTime, setCalculationStartTime] = createSignal<
        number | null
    >(null)
    const [elapsedTime, setElapsedTime] = createSignal(0)
    const [appAlert, setAppAlert] = createSignal<{
        title: string
        description: string
    } | null>(null)

    const showAppAlert = (title: string, description: string) => {
        setAppAlert({ title, description })
    }

    createEffect(() => {
        if (isHistoryOpen()) {
            queueMicrotask(() => {
                setHistoryTrigger(t => t + 1)
            })
        }
    })

    createEffect(() => {
        if (
            !props.isCalculating() &&
            (props.plotData() || props.calculationError())
        ) {
            debouncedUpdateHistory()
        }
    })

    createEffect(() => {
        if (isSettingsOpen()) {
            getMaxCalculations().then(value => {
                batch(() => {
                    setMaxCalculationsValue(value)
                    setMaxCalculationsError(undefined)
                })
            })
        }
    })

    createEffect(() => {
        if (props.isCalculating()) {
            const startTime = performance.now()
            batch(() => {
                setCalculationStartTime(startTime)
                setElapsedTime(0)
            })
            const intervalId = setInterval(() => {
                const elapsed = (performance.now() - startTime) / 1000
                setElapsedTime(elapsed)
            }, 100)
            onCleanup(() => {
                clearInterval(intervalId)
            })
        } else {
            if (calculationStartTime() !== null && props.plotData()) {
                batch(() => {
                    setElapsedTime(0)
                    setCalculationStartTime(null)
                })
                debouncedUpdateHistory()
            }
        }
    })

    onMount(() => {
        setHistoryTrigger(1)
    })

    const exportCombinedEpuresPng = async () => {
        const stress = props.stressHost()
        const shear = props.shearHost()
        const moment = props.momentHost()

        if (!props.plotData() || !stress || !shear || !moment) {
            showAppAlert(
                "Ошибка экспорта",
                "Нет данных расчёта или графики ещё не готовы"
            )
            return
        }

        if (![stress, shear, moment].every(isPlotlyReady)) {
            showAppAlert(
                "Ошибка экспорта",
                "Дождитесь отрисовки графиков НДС, Q и M"
            )
            return
        }

        if (isExportingEpures()) return
        setIsExportingEpures(true)

        try {
            const theme = props.plotTheme()
            const width = 1200
            const height = 420
            const scale = 2
            const toImageOpts = {
                format: "png" as const,
                width,
                height,
                scale,
            }

            const [ndsUrl, qUrl, mUrl] = await Promise.all([
                Plotly.toImage(stress, toImageOpts),
                Plotly.toImage(shear, toImageOpts),
                Plotly.toImage(moment, toImageOpts),
            ])

            await downloadStackedEpuresPng(
                [
                    { dataUrl: ndsUrl, label: "1. НДС (прогиб u)" },
                    { dataUrl: qUrl, label: "2. Эпюра Q" },
                    { dataUrl: mUrl, label: "3. Эпюра M" },
                ],
                {
                    filename: "beam-epures-nds-q-m",
                    background: theme.paperBg,
                    labelColor: theme.fontColor,
                }
            )
        } catch (e) {
            showAppAlert(
                "Ошибка экспорта",
                e instanceof Error
                    ? e.message
                    : "Не удалось сохранить объединённые эпюры"
            )
        } finally {
            setIsExportingEpures(false)
        }
    }

    const statusBadge = () => {
        if (props.isCalculating()) {
            return {
                label: props.plotData() ? "Обновление…" : "Выполняется…",
                tone: "busy" as const,
                textClass: "text-on-surface-variant",
            }
        }
        if (props.hasValidationError()) {
            return {
                label: "Ошибка валидации формы",
                tone: "warning" as const,
                textClass: "text-warning-foreground dark:text-warning",
            }
        }
        if (props.calculationError()) {
            return {
                label: props.calculationError()!,
                tone: "error" as const,
                textClass: "text-error",
            }
        }
        if (props.plotData()) {
            return {
                label: "Расчёт выполнен",
                tone: "success" as const,
                textClass: "text-on-surface-variant",
            }
        }
        return null
    }

    return (
        <>
            <Alert
                open={appAlert() !== null}
                onOpenChange={open => {
                    if (!open) setAppAlert(null)
                }}
                title={appAlert()?.title ?? ""}
                description={appAlert()?.description ?? ""}
            />

            <header class="flex-shrink-0">
                <div class="flex items-center justify-between gap-gutter-sm min-w-0">
                    <Show
                        when={statusBadge()}
                        fallback={<div class="min-w-0" />}
                    >
                        {badge => (
                            <p
                                class={`flex items-center gap-gutter-sm min-w-0 max-w-[50%] sm:max-w-none font-body text-body-md ${badge().textClass}`}
                                role="status"
                                aria-live="polite"
                                aria-busy={badge().tone === "busy"}
                            >
                                <Show when={badge().tone === "busy"}>
                                    <svg
                                        class="size-4 shrink-0 animate-spin text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            class="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            stroke-width="3"
                                        />
                                        <path
                                            class="opacity-90"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                                        />
                                    </svg>
                                </Show>
                                <Show when={badge().tone === "success"}>
                                    <svg
                                        class="size-4 shrink-0 text-success"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                </Show>
                                <Show when={badge().tone === "warning"}>
                                    <svg
                                        class="size-4 shrink-0 text-warning"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M12 9v4" />
                                        <path d="M12 17h.01" />
                                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                    </svg>
                                </Show>
                                <Show when={badge().tone === "error"}>
                                    <svg
                                        class="size-4 shrink-0 text-error"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        aria-hidden="true"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M15 9l-6 6" />
                                        <path d="M9 9l6 6" />
                                    </svg>
                                </Show>
                                <span class="truncate min-w-0">
                                    {badge().label}
                                </span>
                                <Show
                                    when={
                                        props.isCalculating() &&
                                        elapsedTime() >= 0.5
                                    }
                                >
                                    <span class="font-mono text-mono-sm tabular-nums text-outline shrink-0">
                                        {formatElapsedTime(elapsedTime())}
                                    </span>
                                </Show>
                            </p>
                        )}
                    </Show>
                    <div class="flex items-center gap-gutter-sm shrink-0">
                        <Show when={props.plotData()}>
                            <Button
                                type="button"
                                variant="outline"
                                class="cursor-pointer"
                                disabled={isExportingEpures()}
                                onClick={() => void exportCombinedEpuresPng()}
                                title="Скачать общую схему: НДС, Q и M"
                                aria-label="Общая схема"
                            >
                                <Show
                                    when={isExportingEpures()}
                                    fallback={
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            stroke-width="2"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            aria-hidden="true"
                                            class="size-4"
                                        >
                                            <rect
                                                x="3"
                                                y="3"
                                                width="18"
                                                height="18"
                                                rx="2"
                                            />
                                            <path d="M3 9h18" />
                                            <path d="M3 15h18" />
                                        </svg>
                                    }
                                >
                                    <svg
                                        class="size-4 animate-spin"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        aria-hidden="true"
                                    >
                                        <circle
                                            class="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            stroke-width="3"
                                        />
                                        <path
                                            class="opacity-90"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
                                        />
                                    </svg>
                                </Show>
                                <span class="hidden sm:inline">
                                    {isExportingEpures()
                                        ? "Сборка…"
                                        : "Общая схема"}
                                </span>
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                class="cursor-pointer"
                                onClick={async () => {
                                    if (!props.plotData()) {
                                        showAppAlert(
                                            "Ошибка скачивания",
                                            "Невозможно скачать: нет данных расчета"
                                        )
                                        return
                                    }
                                    await downloadCurrentAsXLSX(
                                        props.plotData()!
                                    )
                                }}
                                title="Скачать результаты в XLSX"
                                aria-label="Скачать результаты"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span class="hidden sm:inline">
                                    Скачать результаты
                                </span>
                            </Button>
                        </Show>
                        <Button
                            type="button"
                            variant="outline"
                            class="cursor-pointer"
                            onClick={() => setIsHistoryOpen(true)}
                            title="История расчётов"
                            aria-label="История расчётов"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span class="hidden sm:inline">
                                История расчётов
                            </span>
                        </Button>
                        <Dialog.Root
                            open={isHistoryOpen()}
                            onOpenChange={setIsHistoryOpen}
                            modal={true}
                        >
                            <Dialog.Portal>
                                <Dialog.Overlay />
                                <Dialog.Content class="lg:max-w-xl lg:h-[min(90vh,720px)] gap-0 p-0 overflow-hidden lg:rounded-lg flex flex-col">
                                    <Dialog.Header class="flex-shrink-0 px-gutter-lg py-gutter-md border-b border-outline-variant bg-surface-container flex flex-row items-center justify-between gap-gutter-md space-y-0 text-left">
                                        <div class="flex items-center gap-gutter-md min-w-0">
                                            <div class="w-9 h-9 rounded bg-secondary-container flex items-center justify-center shrink-0 text-secondary-on-container">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    stroke-width="2"
                                                    class="size-5"
                                                    aria-hidden="true"
                                                >
                                                    <circle
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                    />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <div class="flex flex-col min-w-0">
                                                <Dialog.Title class="font-headline text-headline-md text-on-surface truncate">
                                                    История расчётов
                                                </Dialog.Title>
                                                <Dialog.Description class="font-body text-body-sm text-outline truncate">
                                                    {(history()?.length ?? 0) >
                                                    0
                                                        ? `${history()!.length} сохранённых конфигураций`
                                                        : "Нет сохранённых конфигураций"}
                                                </Dialog.Description>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-gutter-xs shrink-0">
                                            <Popover.Root
                                                open={isSettingsOpen()}
                                                onOpenChange={setIsSettingsOpen}
                                                modal={false}
                                            >
                                                <Popover.Trigger
                                                    as="button"
                                                    class="outline-none"
                                                >
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        class="cursor-pointer h-7 w-7 sm:h-8 sm:w-8 p-0"
                                                    >
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            stroke-width="2"
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                            class="h-4 w-4"
                                                        >
                                                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                                            <circle
                                                                cx="12"
                                                                cy="12"
                                                                r="3"
                                                            />
                                                        </svg>
                                                    </Button>
                                                </Popover.Trigger>
                                                <Popover.Portal>
                                                    <Popover.Content class="z-50 w-[calc(100vw-2rem)] sm:w-80 rounded-md border bg-surface-container-low border-outline-variant p-2 sm:p-4 text-on-surface shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                                                        <Popover.Arrow />
                                                        <div class="space-y-2 sm:space-y-4">
                                                            <h3 class="font-semibold text-sm sm:text-lg">
                                                                Настройки
                                                            </h3>
                                                            <div class="space-y-2">
                                                                <Field
                                                                    type="number"
                                                                    label="Количество сохраняемых расчетов"
                                                                    value={String(
                                                                        maxCalculations()
                                                                    )}
                                                                    min={1}
                                                                    max={
                                                                        MAX_MAX_CALCULATIONS
                                                                    }
                                                                    error={maxCalculationsError()}
                                                                    onInput={e => {
                                                                        const inputValue =
                                                                            e
                                                                                .currentTarget
                                                                                .value
                                                                        if (
                                                                            inputValue ===
                                                                            ""
                                                                        ) {
                                                                            setMaxCalculationsError(
                                                                                "Обязательно к заполнению"
                                                                            )
                                                                            return
                                                                        }
                                                                        const value =
                                                                            parseInt(
                                                                                inputValue,
                                                                                10
                                                                            )
                                                                        if (
                                                                            isNaN(
                                                                                value
                                                                            )
                                                                        ) {
                                                                            setMaxCalculationsError(
                                                                                "Введите корректное число"
                                                                            )
                                                                            return
                                                                        }
                                                                        if (
                                                                            value <
                                                                            1
                                                                        ) {
                                                                            // Батчим обновления при валидации
                                                                            batch(
                                                                                () => {
                                                                                    setMaxCalculationsError(
                                                                                        "Значение должно быть не менее 1"
                                                                                    )
                                                                                    setMaxCalculationsValue(
                                                                                        value
                                                                                    )
                                                                                }
                                                                            )
                                                                        } else if (
                                                                            value >
                                                                            MAX_MAX_CALCULATIONS
                                                                        ) {
                                                                            // Батчим обновления при валидации максимального значения
                                                                            batch(
                                                                                () => {
                                                                                    setMaxCalculationsError(
                                                                                        `Значение не должно превышать ${MAX_MAX_CALCULATIONS}`
                                                                                    )
                                                                                    setMaxCalculationsValue(
                                                                                        value
                                                                                    )
                                                                                }
                                                                            )
                                                                        } else {
                                                                            // Батчим обновления при успешной валидации
                                                                            batch(
                                                                                () => {
                                                                                    setMaxCalculationsError(
                                                                                        undefined
                                                                                    )
                                                                                    setMaxCalculationsValue(
                                                                                        value
                                                                                    )
                                                                                }
                                                                            )
                                                                        }
                                                                    }}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="default"
                                                                    size="sm"
                                                                    class="w-full"
                                                                    onClick={async () => {
                                                                        const value =
                                                                            maxCalculations()
                                                                        if (
                                                                            value <
                                                                            1
                                                                        ) {
                                                                            setMaxCalculationsError(
                                                                                "Значение должно быть не менее 1"
                                                                            )
                                                                            return
                                                                        }
                                                                        if (
                                                                            value >
                                                                            MAX_MAX_CALCULATIONS
                                                                        ) {
                                                                            setMaxCalculationsError(
                                                                                `Значение не должно превышать ${MAX_MAX_CALCULATIONS}`
                                                                            )
                                                                            return
                                                                        }
                                                                        if (
                                                                            maxCalculationsError()
                                                                        ) {
                                                                            return
                                                                        }
                                                                        await setMaxCalculations(
                                                                            value
                                                                        )
                                                                        setMaxCalculationsError(
                                                                            undefined
                                                                        )
                                                                        setIsSettingsOpen(
                                                                            false
                                                                        )
                                                                        // Обновляем историю после сохранения настроек
                                                                        // с небольшой задержкой, чтобы enforceMaxCalculations успел отработать
                                                                        queueMicrotask(
                                                                            () => {
                                                                                setHistoryTrigger(
                                                                                    t =>
                                                                                        t +
                                                                                        1
                                                                                )
                                                                            }
                                                                        )
                                                                    }}
                                                                >
                                                                    Сохранить
                                                                </Button>
                                                                <div class="pt-2 border-t">
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        class="w-full"
                                                                        onClick={async () => {
                                                                            if (
                                                                                confirm(
                                                                                    "Вы уверены, что хотите полностью очистить базу данных? Это действие нельзя отменить."
                                                                                )
                                                                            ) {
                                                                                await clearAllCalculations()
                                                                                // Перезагружаем страницу после очистки БД
                                                                                window.location.reload()
                                                                            }
                                                                        }}
                                                                    >
                                                                        Очистить
                                                                        базу
                                                                        данных
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Popover.Content>
                                                </Popover.Portal>
                                            </Popover.Root>
                                            <Dialog.Close>
                                                <button
                                                    type="button"
                                                    class="inline-flex items-center justify-center p-gutter-sm rounded-sm text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors"
                                                    aria-label="Закрыть историю расчётов"
                                                    title="Закрыть"
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
                                                        <line
                                                            x1="18"
                                                            y1="6"
                                                            x2="6"
                                                            y2="18"
                                                        />
                                                        <line
                                                            x1="6"
                                                            y1="6"
                                                            x2="18"
                                                            y2="18"
                                                        />
                                                    </svg>
                                                </button>
                                            </Dialog.Close>
                                        </div>
                                    </Dialog.Header>
                                    <div class="flex-1 min-h-0 overflow-y-auto px-gutter-lg sm:px-gutter-xl py-gutter-md sm:py-gutter-lg">
                                        <div class="flex-1 overflow-auto min-h-0">
                                            <Show
                                                when={
                                                    history() &&
                                                    history()!.length > 0
                                                }
                                                fallback={
                                                    <p class="text-sm text-outline">
                                                        Нет сохраненных расчетов
                                                    </p>
                                                }
                                            >
                                                <div class="space-y-2">
                                                    <For each={history() || []}>
                                                        {record => (
                                                            <div class="border rounded-md p-3 space-y-1 text-sm">
                                                                <div class="flex items-center justify-between mb-2">
                                                                    <div class="flex items-center gap-2">
                                                                        <span class="text-outline font-mono text-xs">
                                                                            {
                                                                                record.id
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            class={`text-xs font-medium px-2 py-0.5 rounded ${
                                                                                record.status ===
                                                                                "Успешно"
                                                                                    ? "bg-success/15 text-success"
                                                                                    : "bg-error/15 text-error"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                record.status
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div class="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            class="h-7 px-gutter-sm"
                                                                            title="Подставить конфигурацию и повторить расчёт"
                                                                            onClick={() => {
                                                                                setIsHistoryOpen(
                                                                                    false
                                                                                )
                                                                                props.onApplyHistorySetup?.(
                                                                                    record.setup
                                                                                )
                                                                            }}
                                                                        >
                                                                            Повторить
                                                                        </Button>
                                                                        <Popover.Root
                                                                            open={
                                                                                openDownloadMenuId() ===
                                                                                record.id
                                                                            }
                                                                            onOpenChange={open =>
                                                                                setOpenDownloadMenuId(
                                                                                    open
                                                                                        ? record.id
                                                                                        : null
                                                                                )
                                                                            }
                                                                            modal={
                                                                                false
                                                                            }
                                                                        >
                                                                            <Popover.Trigger
                                                                                as="button"
                                                                                class="outline-none"
                                                                                disabled={
                                                                                    record.status ===
                                                                                    "Ошибка"
                                                                                }
                                                                            >
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    class="h-6 w-6 p-0"
                                                                                    disabled={
                                                                                        record.status ===
                                                                                        "Ошибка"
                                                                                    }
                                                                                >
                                                                                    <svg
                                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                                        viewBox="0 0 24 24"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        stroke-width="2"
                                                                                        stroke-linecap="round"
                                                                                        stroke-linejoin="round"
                                                                                        class="h-4 w-4"
                                                                                    >
                                                                                        <circle
                                                                                            cx="12"
                                                                                            cy="12"
                                                                                            r="1"
                                                                                        />
                                                                                        <circle
                                                                                            cx="12"
                                                                                            cy="5"
                                                                                            r="1"
                                                                                        />
                                                                                        <circle
                                                                                            cx="12"
                                                                                            cy="19"
                                                                                            r="1"
                                                                                        />
                                                                                    </svg>
                                                                                </Button>
                                                                            </Popover.Trigger>
                                                                            <Popover.Portal>
                                                                                <Popover.Content class="z-50 w-56 sm:w-64 rounded-md border bg-popover p-2 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                                                                                    <Popover.Arrow />
                                                                                    <div class="space-y-1">
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            class="w-full justify-start"
                                                                                            disabled={
                                                                                                record.status ===
                                                                                                "Ошибка"
                                                                                            }
                                                                                            onClick={async () => {
                                                                                                const ok =
                                                                                                    await downloadAsXLSX(
                                                                                                        record
                                                                                                    )
                                                                                                setOpenDownloadMenuId(
                                                                                                    null
                                                                                                )
                                                                                                if (
                                                                                                    !ok
                                                                                                ) {
                                                                                                    showAppAlert(
                                                                                                        "Ошибка скачивания",
                                                                                                        "Невозможно скачать: расчет завершился с ошибкой"
                                                                                                    )
                                                                                                }
                                                                                            }}
                                                                                        >
                                                                                            <svg
                                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                                viewBox="0 0 24 24"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                stroke-width="2"
                                                                                                stroke-linecap="round"
                                                                                                stroke-linejoin="round"
                                                                                                class="h-4 w-4 mr-2"
                                                                                            >
                                                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                                                <polyline points="7 10 12 15 17 10" />
                                                                                                <line
                                                                                                    x1="12"
                                                                                                    y1="15"
                                                                                                    x2="12"
                                                                                                    y2="3"
                                                                                                />
                                                                                            </svg>
                                                                                            Скачать
                                                                                            результаты
                                                                                            Excel
                                                                                        </Button>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            class="w-full justify-start"
                                                                                            disabled={
                                                                                                record.status ===
                                                                                                "Ошибка"
                                                                                            }
                                                                                            onClick={() => {
                                                                                                downloadAsJSON(
                                                                                                    record
                                                                                                )
                                                                                                setOpenDownloadMenuId(
                                                                                                    null
                                                                                                )
                                                                                            }}
                                                                                        >
                                                                                            <svg
                                                                                                xmlns="http://www.w3.org/2000/svg"
                                                                                                viewBox="0 0 24 24"
                                                                                                fill="none"
                                                                                                stroke="currentColor"
                                                                                                stroke-width="2"
                                                                                                stroke-linecap="round"
                                                                                                stroke-linejoin="round"
                                                                                                class="h-4 w-4 mr-2"
                                                                                            >
                                                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                                                <polyline points="7 10 12 15 17 10" />
                                                                                                <line
                                                                                                    x1="12"
                                                                                                    y1="15"
                                                                                                    x2="12"
                                                                                                    y2="3"
                                                                                                />
                                                                                            </svg>
                                                                                            Скачать
                                                                                            результаты
                                                                                            JSON
                                                                                        </Button>
                                                                                    </div>
                                                                                </Popover.Content>
                                                                            </Popover.Portal>
                                                                        </Popover.Root>
                                                                    </div>
                                                                </div>
                                                                <div class="border-b border-border mb-2"></div>
                                                                <div class="flex items-center justify-between">
                                                                    <span class="font-medium">
                                                                        Начало:
                                                                    </span>
                                                                    <span class="text-outline">
                                                                        {formatDateTime(
                                                                            record.startTime
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div class="flex items-center justify-between">
                                                                    <span class="font-medium">
                                                                        Завершение:
                                                                    </span>
                                                                    <span class="text-outline">
                                                                        {formatDateTime(
                                                                            record.endTime
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div class="flex items-center justify-between">
                                                                    <span class="font-medium">
                                                                        Время
                                                                        расчета:
                                                                    </span>
                                                                    <span class="text-primary font-medium">
                                                                        {formatCalculationTime(
                                                                            record.calculationTime
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </For>
                                                </div>
                                            </Show>
                                        </div>
                                    </div>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    </div>
                </div>
            </header>
        </>
    )
}
