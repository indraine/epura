/**
 * Оболочка одной диаграммы: заголовок, выгрузка в растр, развёртывание.
 *
 * В свёрнутом виде на узких экранах высота области построения — 280 [пкс];
 * в развёрнутом — фиксированное заполнение окна просмотра.
 */
import { Show, type Accessor, type JSX } from "solid-js"
import { Button } from "~/ui/button"
import type { ExpandedPlotId } from "./types"

type CardProps = {
    id: ExpandedPlotId
    title: JSX.Element
    /** Подзаголовок с указанием размерностей величин на осях. */
    subtitle?: string
    expandedPlot: Accessor<ExpandedPlotId | null>
    onToggleExpand: (id: ExpandedPlotId) => void
    onExportPng: () => void
    children: JSX.Element
}

/**
 * Карточка результата расчёта: заголовок, выгрузка изображения,
 * переключение полноэкранного режима.
 */
export const Card = (props: CardProps): JSX.Element => {
    const isExpanded = () => props.expandedPlot() === props.id

    const cardClass = () =>
        [
            "plot-card min-h-[300px] lg:flex-1 lg:min-h-0 flex flex-col overflow-hidden rounded-md bg-surface-container border border-outline-variant p-gutter-lg gap-gutter-md",
            isExpanded()
                ? "fixed inset-0 z-50 !min-h-0 rounded-none border-0 bg-surface p-gutter-lg"
                : "",
        ]
            .filter(Boolean)
            .join(" ")

    const shellClass = () =>
        [
            "rounded bg-surface-container-lowest border border-outline-variant p-gutter-sm overflow-hidden",
            isExpanded()
                ? "flex-1 min-h-0"
                : "flex-none h-[280px] min-h-[280px] lg:flex-1 lg:h-auto lg:min-h-0",
        ].join(" ")

    const expandLabel = () => (isExpanded() ? "Свернуть" : "Развернуть")

    return (
        <article class={cardClass()}>
            <header class="flex flex-wrap items-center justify-between gap-gutter-sm flex-shrink-0 relative z-10">
                <div>
                    <h3 class="font-headline text-headline-sm text-on-surface">
                        {props.title}
                    </h3>
                    <Show when={props.subtitle}>
                        <p class="font-body text-body-sm text-outline">
                            {props.subtitle}
                        </p>
                    </Show>
                </div>
                <div class="flex items-center gap-gutter-xs">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        class="h-8 px-gutter-sm text-label-md bg-surface-container-high border-outline-variant"
                        onClick={() => props.onExportPng()}
                    >
                        PNG
                    </Button>
                    <div class="relative group/expand">
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            class="h-8 w-8 bg-surface-container-high border-outline-variant text-primary"
                            aria-label={expandLabel()}
                            title={expandLabel()}
                            aria-pressed={isExpanded()}
                            onClick={() => props.onToggleExpand(props.id)}
                        >
                            <Show
                                when={isExpanded()}
                                fallback={
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        class="size-4"
                                        aria-hidden="true"
                                    >
                                        <polyline points="15 3 21 3 21 9" />
                                        <polyline points="9 21 3 21 3 15" />
                                        <line x1="21" y1="3" x2="14" y2="10" />
                                        <line x1="3" y1="21" x2="10" y2="14" />
                                    </svg>
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
                                    class="size-4"
                                    aria-hidden="true"
                                >
                                    <polyline points="4 14 10 14 10 20" />
                                    <polyline points="20 10 14 10 14 4" />
                                    <line x1="14" y1="10" x2="21" y2="3" />
                                    <line x1="3" y1="21" x2="10" y2="14" />
                                </svg>
                            </Show>
                        </Button>
                        <span
                            role="tooltip"
                            class="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-surface-container-highest border border-outline-variant px-gutter-sm py-gutter-xs font-body text-body-sm text-on-surface opacity-0 shadow-sm transition-opacity group-hover/expand:opacity-100 group-focus-within/expand:opacity-100"
                        >
                            {expandLabel()}
                        </span>
                    </div>
                </div>
            </header>
            <div class={shellClass()}>{props.children}</div>
        </article>
    )
}
