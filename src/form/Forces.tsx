import { createEffect, createMemo, For, Show, type JSX } from "solid-js"
import { Chevron } from "~/ui/icons"
import { DecimalField } from "~/ui/decimal-field"
import { useI18N } from "~/i18n"
import { beamModel, removePointLoad, updatePointLoad } from "~/store/beam"
import { Add, Delete } from "./Controls"

type ForcesProps = {
    open: boolean
    onToggle: () => void
    onAdd: () => void
}

/**
 * Секция сосредоточенных сил: координата приложения [мм], величина [Н].
 * При включённой привязке к узлам координата недоступна для правки.
 */
export const Forces = (props: ForcesProps): JSX.Element => {
    const t = useI18N()
    let scrollContainer: HTMLDivElement | undefined
    let prevLength = beamModel.pl.length

    createEffect(() => {
        const plLength = beamModel.pl.length
        if (plLength > prevLength && scrollContainer) {
            setTimeout(() => {
                scrollContainer?.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: "smooth",
                })
            }, 50)
        }
        prevLength = plLength
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
                        {t("form.pointLoads.title")}
                    </h3>
                    <span class="font-body text-body-sm text-outline tabular-nums shrink-0">
                        {t("form.itemsCount", {
                            n: beamModel.pl.length,
                        })}
                    </span>
                </button>
                <Add
                    label={t("form.pointLoads.addTitle")}
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
                            beamModel.pl.length === 0
                                ? "flex items-center justify-center"
                                : "grid grid-cols-1 sm:grid-cols-2 content-start gap-gutter-sm"
                        }`}
                    >
                        <Show when={beamModel.pl.length === 0}>
                            <p class="font-body text-body-sm text-outline text-center px-gutter-md">
                                {t("form.pointLoads.empty")}
                            </p>
                        </Show>
                        <For each={beamModel.pl}>
                            {(pl, index) => {
                                const coordError = createMemo(() => {
                                    // Читаем текущее значение из сигнала для реактивности
                                    const currentPl = beamModel.pl[index()]
                                    const coord = currentPl?.coord
                                    const length = beamModel.length
                                    const currentIndex = index()
                                    const allPl = beamModel.pl

                                    // Проверка на обязательность заполнения
                                    if (
                                        coord === undefined ||
                                        coord === null ||
                                        (typeof coord === "number" &&
                                            isNaN(coord))
                                    ) {
                                        return t("form.requiredFieldError")
                                    }

                                    // Проверка на выход за границы
                                    const isOut = coord < 0 || coord > length
                                    if (isOut) {
                                        return t("form.coordRangeError", {
                                            length: length.toFixed(2),
                                        })
                                    }

                                    // Проверка на занятость координаты другой нагрузкой
                                    const isOccupied = allPl.some(
                                        (otherPl, idx) =>
                                            idx !== currentIndex &&
                                            !isNaN(otherPl.coord) &&
                                            Math.abs(otherPl.coord - coord) <
                                                1e-6
                                    )
                                    if (isOccupied) {
                                        return t(
                                            "form.pointLoads.coordOccupiedError"
                                        )
                                    }

                                    return undefined
                                })

                                const valueError = createMemo(() => {
                                    // Читаем текущее значение из сигнала для реактивности
                                    const currentPl = beamModel.pl[index()]
                                    const value = currentPl?.value

                                    // Проверка на обязательность заполнения
                                    if (
                                        value === undefined ||
                                        value === null ||
                                        (typeof value === "number" &&
                                            isNaN(value))
                                    ) {
                                        return t("form.requiredFieldError")
                                    }

                                    return undefined
                                })

                                return (
                                    <div class="rounded bg-surface-container-low border border-outline-variant p-gutter-md flex flex-col gap-gutter-sm">
                                        <div class="flex items-center justify-between gap-gutter-xs">
                                            <span class="font-label text-label-sm text-outline">
                                                {t(
                                                    "form.pointLoads.itemLabel",
                                                    {
                                                        n: index() + 1,
                                                    }
                                                )}
                                            </span>
                                            <Delete
                                                label={t("form.deleteButton")}
                                                onClick={() =>
                                                    removePointLoad(index())
                                                }
                                            />
                                        </div>
                                        <div class="grid grid-cols-2 gap-gutter-sm">
                                            <DecimalField
                                                step="0.01"
                                                label={t(
                                                    "form.pointLoads.coord.label"
                                                )}
                                                compact
                                                max={beamModel.length}
                                                value={pl.coord}
                                                error={coordError()}
                                                disabled={beamModel.bind}
                                                onValueChange={val => {
                                                    updatePointLoad(index(), {
                                                        coord: val ?? NaN,
                                                    })
                                                }}
                                            />
                                            <DecimalField
                                                step="0.01"
                                                label={t(
                                                    "form.pointLoads.value.label"
                                                )}
                                                compact
                                                value={pl.value}
                                                error={valueError()}
                                                onValueChange={val => {
                                                    updatePointLoad(index(), {
                                                        value: val ?? NaN,
                                                    })
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
