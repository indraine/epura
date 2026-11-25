import { createEffect, createMemo, For, onCleanup, Show, type JSX } from "solid-js"
import { Chevron } from "~/ui/icons"
import { Select } from "~/ui/select"
import { DecimalField } from "~/ui/decimal-field"
import { useI18N } from "~/i18n"
import {
    beamModel,
    removeBoundaryCondition,
    updateBoundaryCondition,
} from "~/store/beam"
import { canonicalizeBoundarySpecies } from "~/core/types"
import { Add, Delete } from "./Controls"

type SupportsProps = {
    open: boolean
    onToggle: () => void
    onAdd: () => void
}

/**
 * Секция граничных условий: вид опоры (заделка / шарнир; выбор проходит
 * через {@link canonicalizeBoundarySpecies}) и координата [мм].
 * При включённой привязке к узлам координата недоступна для правки.
 */
export const Supports = (props: SupportsProps): JSX.Element => {
    const t = useI18N()
    let scrollContainer: HTMLDivElement | undefined
    let prevLength = beamModel.bc.length

    createEffect(() => {
        const bcLength = beamModel.bc.length
        if (bcLength > prevLength && scrollContainer) {
            setTimeout(() => {
                scrollContainer?.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: "smooth",
                })
            }, 50)
        }
        prevLength = bcLength
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
                        {t("form.boundaryConditions.title")}
                    </h3>
                    <span class="font-body text-body-sm text-outline tabular-nums shrink-0">
                        {t("form.itemsCount", {
                            n: beamModel.bc.length,
                        })}
                    </span>
                </button>
                <Add
                    label={t("form.boundaryConditions.addTitle")}
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
                            beamModel.bc.length === 0
                                ? "flex items-center justify-center"
                                : "grid grid-cols-1 sm:grid-cols-2 content-start gap-gutter-sm"
                        }`}
                    >
                        <Show when={beamModel.bc.length === 0}>
                            <p class="font-body text-body-sm text-outline text-center px-gutter-md">
                                {t("form.boundaryConditions.empty")}
                            </p>
                        </Show>
                        <For each={beamModel.bc}>
                            {(_bc, index) => {
                                let disposed = false
                                onCleanup(() => {
                                    disposed = true
                                })

                                // Создаем реактивное значение для текущего граничного условия
                                const currentBc = () => beamModel.bc[index()]

                                const coordError = createMemo(() => {
                                    // Читаем текущее значение из сигнала для реактивности
                                    const bc = currentBc()
                                    const coord = bc?.coord
                                    const length = beamModel.length
                                    const currentIndex = index()
                                    const allBc = beamModel.bc

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

                                    // Проверка на занятость координаты другим ГУ
                                    const isOccupied = allBc.some(
                                        (otherBc, idx) =>
                                            idx !== currentIndex &&
                                            !isNaN(otherBc.coord) &&
                                            Math.abs(otherBc.coord - coord) <
                                                1e-6
                                    )
                                    if (isOccupied) {
                                        return t(
                                            "form.boundaryConditions.coordOccupiedError"
                                        )
                                    }

                                    return undefined
                                })

                                const currentSpecies = () => {
                                    const bc = currentBc()
                                    const species = bc?.species || "seal"
                                    return species
                                }

                                return (
                                    <div class="rounded bg-surface-container-low border border-outline-variant p-gutter-md flex flex-col gap-gutter-sm">
                                        <div class="flex items-center justify-between gap-gutter-xs">
                                            <span class="font-label text-label-sm text-outline">
                                                {t(
                                                    "form.boundaryConditions.itemLabel",
                                                    {
                                                        n: index() + 1,
                                                    }
                                                )}
                                            </span>
                                            <Delete
                                                label={t(
                                                    "form.boundaryConditions.deleteTitle"
                                                )}
                                                onClick={() =>
                                                    removeBoundaryCondition(
                                                        index()
                                                    )
                                                }
                                            />
                                        </div>
                                        <div class="grid grid-cols-2 gap-gutter-sm">
                                            <Select
                                                label={t(
                                                    "form.boundaryConditions.type.label"
                                                )}
                                                compact
                                                value={currentSpecies()}
                                                onInput={e => {
                                                    if (disposed) return
                                                    const species =
                                                        canonicalizeBoundarySpecies(
                                                            e.currentTarget
                                                                .value
                                                        )
                                                    if (species === null) {
                                                        return
                                                    }
                                                    updateBoundaryCondition(
                                                        index(),
                                                        {
                                                            species,
                                                        }
                                                    )
                                                }}
                                                options={[
                                                    {
                                                        value: "seal",
                                                        label: t(
                                                            "form.boundaryConditions.type.seal"
                                                        ),
                                                    },
                                                    {
                                                        value: "hindle",
                                                        label: t(
                                                            "form.boundaryConditions.type.hindle"
                                                        ),
                                                    },
                                                ]}
                                            />
                                            <DecimalField
                                                step="0.01"
                                                label={t(
                                                    "form.boundaryConditions.coord.label"
                                                )}
                                                compact
                                                max={beamModel.length}
                                                value={currentBc()?.coord}
                                                error={coordError()}
                                                disabled={beamModel.bind}
                                                onValueChange={val => {
                                                    if (disposed) return
                                                    updateBoundaryCondition(
                                                        index(),
                                                        {
                                                            coord: val ?? NaN,
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
