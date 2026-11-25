/**
 * Экспорт и импорт конфигурации балки в формате JSON, а также константы формы.
 *
 * Схема файла версии `1.0`: блок `parameters` (длина [мм], момент инерции [мм⁴],
 * модуль Юнга [МПа], плотность [кг/мм³], площадь [мм²] и прочие скаляры);
 * необязательный блок калькулятора сечения; массивы опор, сосредоточенных
 * и распределённых нагрузок.
 *
 * При восстановлении из истории вид опоры принимается из полей
 * `species` | `bc_type` | `type` через {@link canonicalizeBoundarySpecies}.
 * При импорте JSON приводится к канону только поле `species`.
 */
import { setValues, type FormStore } from "@modular-forms/solid"
import {
    beamModel,
    replaceBeamModel,
    setBeamLength,
    setBindEnabled,
} from "~/store/beam"
import {
    canonicalizeBoundarySpecies,
    type BeamBoundaryCondition,
    type BeamSetup,
    type SectionCalculatorParams,
    type SolverMethod,
} from "~/core/types"

/** Число конечных элементов по умолчанию. */
export const DEFAULT_SECTIONS = 10
/** Наибольшее допустимое число конечных элементов. */
export const MAX_SECTIONS = 200
/** Длина балки по умолчанию [мм]. */
export const DEFAULT_LENGTH = 1.0
/** Параметр плотности интерполяции по умолчанию. */
export const DEFAULT_QUALITY = 100
/** Наибольшее допустимое значение параметра интерполяции. */
export const MAX_QUALITY = 500
/** Момент инерции сечения по умолчанию [мм⁴]. */
export const DEFAULT_INERTIA = 1.0
/** Модуль Юнга по умолчанию [МПа]. */
export const DEFAULT_YOUNG = 2e11
/** Плотность материала по умолчанию [кг/мм³]. */
export const DEFAULT_DENSITY = 7850
/** Площадь поперечного сечения по умолчанию [мм²]. */
export const DEFAULT_AREA = 0.01
/** Метод решения системы уравнений по умолчанию. */
export const DEFAULT_SOLVER_METHOD: SolverMethod = "cholesky"

type FormValues = {
    sections?: number
    length?: number
    quality?: number
    inertia?: number
    young?: number
    density?: number
    area?: number
    bind?: boolean
    solver_method?: SolverMethod
}

/**
 * Зависимости процедур импорта и экспорта: хранилище формы,
 * состояние калькулятора сечения, вывод сообщений об ошибках.
 */
export type TransferDeps = {
    form: FormStore<BeamSetup, undefined>
    setSectionCalculatorInertia: (value: number) => void
    setSectionCalculatorArea: (value: number) => void
    setSectionCalculatorParams: (
        value: SectionCalculatorParams | undefined
    ) => void
    showAppAlert: (title: string, description: string) => void
}

/**
 * Формирует объект конфигурации версии `1.0` по параметрам формы
 * и состоянию {@link beamModel}.
 */
export const buildExportPayload = (
    formValues: FormValues,
    sectionCalculator: SectionCalculatorParams | undefined
) => ({
    version: "1.0",
    timestamp: new Date().toISOString(),
    parameters: {
        sections: formValues.sections ?? DEFAULT_SECTIONS,
        length: formValues.length ?? DEFAULT_LENGTH,
        quality: formValues.quality ?? DEFAULT_QUALITY,
        inertia: formValues.inertia ?? DEFAULT_INERTIA,
        young: formValues.young ?? DEFAULT_YOUNG,
        density: formValues.density ?? DEFAULT_DENSITY,
        area: formValues.area ?? DEFAULT_AREA,
        bind: formValues.bind ?? false,
        solver_method: formValues.solver_method ?? DEFAULT_SOLVER_METHOD,
    },
    section_calculator: sectionCalculator,
    boundary_conditions: beamModel.bc,
    point_loads: beamModel.pl,
    distributed_loads: beamModel.dl,
})

/** Сохраняет произвольный JSON-объект в файл через браузер. */
export const downloadJsonFile = (payload: unknown, filename: string): void => {
    const jsonString = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/** Выгружает текущую конфигурацию в файл с меткой даты и времени. */
export const exportBeamConfigFromValues = (
    formValues: FormValues,
    sectionCalculator: SectionCalculatorParams | undefined
): void => {
    const exportData = buildExportPayload(formValues, sectionCalculator)
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    downloadJsonFile(exportData, `beam-config-${dateStr}_${timeStr}.json`)
}

/**
 * Восстанавливает форму и {@link beamModel} из записи истории.
 * Вид опоры приводится к канону из `species` | `bc_type` | `type`;
 * при отсутствии допустимых опор подставляется заделка при x = 0.
 */
export const applyRestoredSetup = (
    setup: BeamSetup,
    deps: Omit<TransferDeps, "showAppAlert">
): void => {
    setValues(deps.form, {
        sections: setup.sections,
        length: setup.length,
        quality: setup.quality,
        inertia: setup.inertia,
        young: setup.young,
        density: setup.density,
        area: setup.area,
        bind: setup.bind,
        solver_method:
            (setup.solver_method as SolverMethod) || DEFAULT_SOLVER_METHOD,
    })

    deps.setSectionCalculatorInertia(setup.inertia)
    deps.setSectionCalculatorArea(setup.area)
    if (setup.section_calculator) {
        deps.setSectionCalculatorParams(setup.section_calculator)
    }

    let restoredBc: BeamBoundaryCondition[] = [{ species: "seal", coord: 0 }]
    if (setup.bc && Array.isArray(setup.bc) && setup.bc.length > 0) {
        const validBC: BeamBoundaryCondition[] = setup.bc.flatMap(
            (bc: {
                species?: unknown
                bc_type?: unknown
                type?: unknown
                coord?: unknown
            }) => {
                if (!bc || typeof bc !== "object") {
                    return []
                }
                const species = canonicalizeBoundarySpecies(
                    bc.species ?? bc.bc_type ?? bc.type
                )
                if (species === null || typeof bc.coord !== "number") {
                    return []
                }
                return [{ species, coord: bc.coord }]
            }
        )

        if (validBC.length > 0) {
            restoredBc = validBC
        }
    }

    replaceBeamModel({
        length: setup.length,
        sections: setup.sections || 10,
        bind: setup.bind,
        bc: restoredBc,
        pl: setup.pl || [],
        dl: setup.dl || [],
    })
}

/** Переносит длину [мм] и флаг привязки к узлам из формы в модель. */
export const applyDefaultLengthBind = (formValues: FormValues): void => {
    if (formValues.length !== undefined) {
        setBeamLength(formValues.length)
    }
    if (formValues.bind !== undefined) {
        setBindEnabled(formValues.bind)
    }
}

/**
 * Классы сетки аккордеона нагрузок: раскрытая секция занимает
 * оставшуюся высоту контейнера.
 */
export const loadsAccordionGridClass = (
    open: "bc" | "point" | "distributed" | null
): string => {
    const base =
        "gap-gutter-sm lg:flex-1 lg:min-h-0 lg:overflow-hidden lg:content-start grid grid-cols-1"
    if (open === "bc") return `${base} lg:grid-rows-[minmax(0,1fr)_auto_auto]`
    if (open === "point")
        return `${base} lg:grid-rows-[auto_minmax(0,1fr)_auto]`
    if (open === "distributed")
        return `${base} lg:grid-rows-[auto_auto_minmax(0,1fr)]`
    return `${base} lg:grid-rows-[auto_auto_auto]`
}

/**
 * Обработчики перетаскивания файла для импорта конфигурации.
 * Допускается тип `application/json` либо расширение `.json`.
 */
export const createJsonDragDrop = (options: {
    setDragOver: (value: boolean) => void
    onFile: (file: File) => void
    onInvalidType: () => void
}) => {
    let dragCounter = 0

    const handleDragEnter = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter++
        if (e.dataTransfer?.types.includes("Files")) {
            options.setDragOver(true)
        }
    }

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = "copy"
        }
    }

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter--
        if (dragCounter === 0) {
            options.setDragOver(false)
        }
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounter = 0
        options.setDragOver(false)
        const files = e.dataTransfer?.files
        if (!files || files.length === 0) return
        const file = files[0]
        if (file.type === "application/json" || file.name.endsWith(".json")) {
            options.onFile(file)
        } else {
            options.onInvalidType()
        }
    }

    return { handleDragEnter, handleDragOver, handleDragLeave, handleDrop }
}

/**
 * Импорт конфигурации из файла JSON версии `1.0`.
 *
 * Налагаемые ограничения: число элементов и параметр интерполяции —
 * в допустимых диапазонах; L ≥ 0,001 [мм]; E ≥ 10^6 [МПа];
 * I, A ≥ 10^-10; ρ ≥ 1. Опоры — только с каноническим `species`
 * и координатой ∈ [0, L]; при отсутствии допустимых сил подставляется
 * нулевая сила в начале балки. Ошибки разбора сообщаются через `showAppAlert`.
 */
export const importBeamConfigJson = async (
    file: File,
    deps: TransferDeps
): Promise<void> => {
    try {
        const text = await file.text()
        const importData = JSON.parse(text)

        if (!importData.parameters) {
            throw new Error("Неверный формат файла")
        }

        const params = importData.parameters

        const sections = Math.max(
            1,
            Math.min(
                MAX_SECTIONS,
                Math.round(params.sections ?? DEFAULT_SECTIONS)
            )
        )
        const length = Math.max(0.001, params.length ?? DEFAULT_LENGTH)
        const quality = Math.max(
            1,
            Math.min(MAX_QUALITY, Math.round(params.quality ?? DEFAULT_QUALITY))
        )
        const inertia = Math.max(1e-10, params.inertia ?? DEFAULT_INERTIA)
        const young = Math.max(1e6, params.young ?? DEFAULT_YOUNG)
        const density = Math.max(1, params.density ?? DEFAULT_DENSITY)
        const area = Math.max(1e-10, params.area ?? DEFAULT_AREA)
        const bind = params.bind ?? false
        const solver_method = ["cholesky", "lu", "qr", "sparselu"].includes(
            params.solver_method
        )
            ? params.solver_method
            : DEFAULT_SOLVER_METHOD

        setValues(deps.form, {
            sections,
            length,
            quality,
            inertia,
            young,
            density,
            area,
            bind,
            solver_method,
        })

        deps.setSectionCalculatorInertia(inertia)
        deps.setSectionCalculatorArea(area)

        if (
            importData.section_calculator &&
            typeof importData.section_calculator === "object"
        ) {
            deps.setSectionCalculatorParams(
                importData.section_calculator as SectionCalculatorParams
            )
        }

        let nextBc = beamModel.bc.map(bc => ({
            species: bc.species,
            coord: bc.coord,
        }))
        let nextPl = beamModel.pl.map(pl => ({
            coord: pl.coord,
            value: pl.value,
        }))
        let nextDl = beamModel.dl.map(dl => ({
            start_coord: dl.start_coord,
            end_coord: dl.end_coord,
            value: dl.value,
        }))

        if (Array.isArray(importData.boundary_conditions)) {
            const validBC: BeamBoundaryCondition[] =
                importData.boundary_conditions.flatMap(
                    (bc: { species?: unknown; coord?: unknown }) => {
                        if (!bc || typeof bc !== "object") {
                            return []
                        }
                        const species = canonicalizeBoundarySpecies(bc.species)
                        if (
                            species === null ||
                            typeof bc.coord !== "number" ||
                            bc.coord < 0 ||
                            bc.coord > length
                        ) {
                            return []
                        }
                        return [
                            {
                                species,
                                coord: Math.max(0, Math.min(length, bc.coord)),
                            },
                        ]
                    }
                )

            if (validBC.length > 0) {
                nextBc = validBC
            }
        }

        if (Array.isArray(importData.point_loads)) {
            const validPL = importData.point_loads
                .filter(
                    (pl: { coord?: unknown; value?: unknown }) =>
                        pl &&
                        typeof pl === "object" &&
                        typeof pl.coord === "number" &&
                        pl.coord >= 0 &&
                        pl.coord <= length &&
                        typeof pl.value === "number"
                )
                .map((pl: { coord: number; value: number }) => ({
                    coord: Math.max(0, Math.min(length, pl.coord)),
                    value: pl.value,
                }))

            nextPl = validPL.length > 0 ? validPL : [{ coord: 0, value: 0 }]
        }

        if (Array.isArray(importData.distributed_loads)) {
            nextDl = importData.distributed_loads
                .filter(
                    (dl: {
                        start_coord?: unknown
                        end_coord?: unknown
                        value?: unknown
                    }) =>
                        dl &&
                        typeof dl === "object" &&
                        typeof dl.start_coord === "number" &&
                        typeof dl.end_coord === "number" &&
                        dl.start_coord >= 0 &&
                        dl.end_coord <= length &&
                        dl.start_coord < dl.end_coord &&
                        typeof dl.value === "number"
                )
                .map(
                    (dl: {
                        start_coord: number
                        end_coord: number
                        value: number
                    }) => ({
                        start_coord: Math.max(
                            0,
                            Math.min(length, dl.start_coord)
                        ),
                        end_coord: Math.max(0, Math.min(length, dl.end_coord)),
                        value: dl.value,
                    })
                )
                .filter(
                    (dl: { start_coord: number; end_coord: number }) =>
                        dl.start_coord < dl.end_coord
                )
        }

        replaceBeamModel({
            length,
            sections,
            bind,
            bc: nextBc,
            pl: nextPl,
            dl: nextDl,
        })
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : "Ошибка при импорте файла"
        deps.showAppAlert("Ошибка импорта", errorMessage)
    }
}
