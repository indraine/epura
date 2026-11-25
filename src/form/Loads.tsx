import { createEffect, createMemo, For, Show, type JSX } from "solid-js"
import { Chevron } from "~/ui/icons"
import { DecimalField } from "~/ui/decimal-field"
import { useI18N } from "~/i18n"
import {
    beamModel,
    removeDistributedLoad,
    updateDistributedLoad,
} from "~/store/beam"
import { Add, Delete } from "./Controls"

type LoadsProps = {
    open: boolean
    onToggle: () => void
    onAdd: () => void
}

/**
 * Секция распределённых нагрузок: границы отрезка [мм], интенсивность q [Н/мм].
 * Требуется строгое неравенство начала и конца; пересечение отрезков
 * формой не запрещается.
 */
export const Loads = (props: LoadsProps): JSX.Element => {
    const t = useI18N()
    let scrollContainer: HTMLDivElement | undefined
    let prevLength = beamModel.dl.length

    createEffect(() => {
        const dlLength = beamModel.dl.length
        if (dlLength > prevLength && scrollContainer) {
            setTimeout(() => {
                scrollContainer?.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: "smooth",
                })
            }, 50)
        }
        prevLength = dlLength
    })

    return (
        <div
            class={`rounded-md bg-surface-container border border-outline-variant flex flex-col ${
                props.open
                    ? "p-gutter-lg gap-gutter-md max-lg:min-h-[220px] max-lg:max-h-[min(55vh,520px)] flex flex-col overflow-hidden min-h-0 lg:h-full"
                    : "px-gutter-lg py-gutter-sm shrink-0"
            }`}
        >
            <div class="flex items-center gap-gutter-sm shrink-0">
                <button
                    type="button"
                    class="flex-1 min-w-0 flex items-center gap-gutter-sm text-left rounded-sm hover:bg-surface-container-high/60 transition-colors -mx-1 px-1 py-0.5"
                    aria-expanded={props.open}
                    onClick={() => props.onToggle()}
                >
                    <Chevron
                        class={`size-4 shrink-0 text-outline transition-transform ${
                            props.open ? "rotate-90" : ""
                        }`}
                    />
                    <h3 class="font-headline text-headline-sm text-on-surface truncate">
                        {t("form.distributedLoads.title")}
                    </h3>
                    <span class="font-body text-body-sm text-outline tabular-nums shrink-0">
                        {t("form.itemsCount", {
                            n: beamModel.dl.length,
                        })}
                    </span>
                </button>
                <Add
                    label={t("form.distributedLoads.addTitle")}
                    onClick={props.onAdd}
                />
            </div>
            <Show when={props.open}>
                <div class="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
                    <div
                        ref={el => {
                            scrollContainer = el
                        }}
                        class={`loads-accordion-scroll flex-1 min-h-0 h-full overscroll-contain ${
                            beamModel.dl.length === 0
                                ? "flex items-center justify-center"
                                : "grid grid-cols-1 sm:grid-cols-2 content-start gap-gutter-sm"
                        }`}
                    >
                        <Show when={beamModel.dl.length === 0}>
                            <p class="font-body text-body-sm text-outline text-center px-gutter-md">
                                {t("form.distributedLoads.empty")}
                            </p>
                        </Show>
                        <For each={beamModel.dl}>
                            {(dl, index) => {
                                const startCoordError = createMemo(() => {
                                    // Читаем текущее значение из сигнала для реактивности
                                    const currentDl = beamModel.dl[index()]
                                    const startCoord =
                                        currentDl?.start_coord ?? 0
                                    const length = beamModel.length
                                    const isOut =
                                        startCoord < 0 || startCoord > length
                                    return isOut
                                        ? t("form.coordRangeError", {
                                              length: length.toFixed(2),
                                          })
                                        : undefined
                                })

                                const endCoordError = createMemo(() => {
                                    // Читаем текущее значение из сигнала для реактивности
                                    const currentDl = beamModel.dl[index()]
                                    const coord = currentDl?.end_coord ?? 0
                                    const startCoord =
                                        currentDl?.start_coord ?? 0
                                    const length = beamModel.length
                                    if (coord < 0 || coord > length) {
                                        return t("form.coordRangeError", {
                                            length: length.toFixed(2),
                                        })
                                    }
                                    if (coord <= startCoord) {
                                        return t(
                                            "form.distributedLoads.endCoordError",
                                            {
                                                start: startCoord.toFixed(2),
                                            }
                                        )
                                    }
                                    return undefined
                                })

                                return (
                                    <div class="rounded bg-surface-container-low border border-outline-variant p-gutter-md flex flex-col gap-gutter-sm">
                                        <div class="flex items-center justify-between gap-gutter-xs">
                                            <span class="font-label text-label-sm text-outline">
                                                {t(
                                                    "form.distributedLoads.itemLabel",
                                                    {
                                                        n: index() + 1,
                                                    }
                                                )}
                                            </span>
                                            <Delete
                                                label={t("form.deleteButton")}
                                                onClick={() =>
                                                    removeDistributedLoad(
                                                        index()
                                                    )
                                                }
                                            />
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-gutter-sm">
                                            <DecimalField
                                                step="0.01"
                                                label={t(
                                                    "form.distributedLoads.start.label"
                                                )}
                                                compact
                                                max={beamModel.length}
                                                value={dl.start_coord}
                                                error={startCoordError()}
                                                disabled={beamModel.bind}
                                                onValueChange={val => {
                                                    updateDistributedLoad(
                                                        index(),
                                                        {
                                                            start_coord:
                                                                val ?? 0,
                                                        }
                                                    )
                                                }}
                                            />
                                            <DecimalField
                                                step="0.01"
                                                label={t(
                                                    "form.distributedLoads.end.label"
                                                )}
                                                compact
                                                max={beamModel.length}
                                                value={dl.end_coord}
                                                error={endCoordError()}
                                                disabled={beamModel.bind}
                                                onValueChange={val => {
                                                    updateDistributedLoad(
                                                        index(),
                                                        {
                                                            end_coord:
                                                                val ?? 0,
                                                        }
                                                    )
                                                }}
                                            />
                                            <DecimalField
                                                step="0.01"
                                                label={t(
                                                    "form.distributedLoads.value.label"
                                                )}
                                                compact
                                                value={dl.value}
                                                onValueChange={val => {
                                                    updateDistributedLoad(
                                                        index(),
                                                        {
                                                            value: val ?? 0,
                                                        }
                                                    )
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            }}
                        </For>
                    </div>
                </div>
            </Show>
        </div>
    )
}
