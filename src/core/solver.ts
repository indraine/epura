/**
 * Организация численного расчёта балки на основном потоке приложения.
 *
 * Связывает проверенные параметры формы и модель нагружения {@link beamModel}
 * с решателем на WebAssembly, отложенным автопересчётом
 * и записью результатов в IndexedDB.
 */
import {
    batch,
    createEffect,
    createMemo,
    createSignal,
    type Accessor,
} from "solid-js"
import { calculateBeam } from "./wasm"
import {
    saveCalculation,
    getLastCalculation,
    type CalculationRecord,
} from "./db"
import { beamModel } from "../store/beam"
import { debounce } from "../lib/debounce"
import { isInvalid, type FormScalars } from "../form/validate"
import {
    DEFAULT_AREA,
    DEFAULT_DENSITY,
    DEFAULT_INERTIA,
    DEFAULT_LENGTH,
    DEFAULT_QUALITY,
    DEFAULT_SECTIONS,
    DEFAULT_SOLVER_METHOD,
    DEFAULT_YOUNG,
    MAX_QUALITY,
    MAX_SECTIONS,
} from "../form/transfer"
import type { BeamSetup, PlotData, SolverMethod } from "./types"

export type { FormScalars }

/**
 * Задержка отложенного автопересчёта [мс].
 * Сглаживает частые изменения полей формы в режиме непрерывного пересчёта.
 */
const CALCULATION_DEBOUNCE_MS = 100

/**
 * Параметры создания решателя.
 *
 * В режиме `auto` пересчёт выполняется при каждом допустимом изменении
 * параметров (с задержкой {@link CALCULATION_DEBOUNCE_MS}).
 * В режиме `manual` расчёт запускается только по переднему фронту
 * сигнала `manualTrigger` (false → true).
 */
export type SolverOptions = {
    getScalars: Accessor<FormScalars>
    /**
     * Признак готовности интерфейса и модуля WebAssembly;
     * при false источник постановки задачи обнуляется.
     */
    ready?: Accessor<boolean>
    mode?: Accessor<"auto" | "manual">
    manualTrigger?: Accessor<boolean>
}

/**
 * Нулевой результат для начального состояния ресурса
 * (длина оси диаграммы [мм]).
 */
const createEmptyPlotData = (length: number = DEFAULT_LENGTH): PlotData => {
    const coords = [0, length]
    return {
        stress_state: {
            coords,
            interpolate_points: coords,
            interpolated_curve: [0, 0],
            node_values: [0, 0],
            min_value: 0,
            max_value: 0,
        },
        modes: {
            coords,
            interpolate_points: coords,
            modes: [],
        },
        shear_force: {
            coords,
            interpolate_points: coords,
            interpolated_curve: [0, 0],
            node_values: [0, 0],
            min_value: 0,
            max_value: 0,
        },
        bending_moment: {
            coords,
            interpolate_points: coords,
            interpolated_curve: [0, 0],
            node_values: [0, 0],
            min_value: 0,
            max_value: 0,
        },
        boundary_conditions: [],
        point_loads: [],
        distributed_loads: [],
        reactions: [],
    }
}

/**
 * Приведение значения к конечному числу двойной точности;
 * `NaN` и ±∞ заменяются нулём.
 */
const toF64 = (value: unknown): number => {
    const num = typeof value === "number" ? value : Number(value)
    if (isNaN(num) || !isFinite(num)) {
        return 0
    }
    return Number(num)
}

/**
 * Формирование постановки {@link BeamSetup} по параметрам формы
 * и актуальному состоянию {@link beamModel}.
 *
 * Ограничения, накладываемые непосредственно перед передачей в решатель
 * (не следует смешивать с проверкой формы {@link isInvalid}):
 * - число элементов ∈ [1, MAX_SECTIONS],
 *  параметр интерполяции ∈ [1, MAX_QUALITY];
 * - L ≥ 0,001 [мм], E ≥ 10^6 [МПа], ρ ≥ 1 [кг/мм³];
 * - I ≥ 10^-10 [мм⁴], A ≥ 10^-10 [мм²];
 * - координаты опор и нагрузок ограничиваются отрезком [0, L];
 * - отрезки распределённой нагрузки сохраняются лишь при
 *  `start_coord` < `end_coord`.
 */
const buildBeamSetup = (scalars: FormScalars): BeamSetup => {
    return batch(() => {
        const sections = Math.max(
            1,
            Math.min(
                MAX_SECTIONS,
                Math.round(toF64(scalars.sections ?? DEFAULT_SECTIONS))
            )
        )
        const length = toF64(Math.max(0.001, scalars.length ?? DEFAULT_LENGTH))
        const quality = Math.max(
            1,
            Math.min(
                MAX_QUALITY,
                Math.round(toF64(scalars.quality ?? DEFAULT_QUALITY))
            )
        )
        const inertia = toF64(
            Math.max(1e-10, scalars.inertia ?? DEFAULT_INERTIA)
        )
        const young = toF64(Math.max(1e6, scalars.young ?? DEFAULT_YOUNG))
        const density = toF64(Math.max(1, scalars.density ?? DEFAULT_DENSITY))
        const area = toF64(Math.max(1e-10, scalars.area ?? DEFAULT_AREA))

        const bc = beamModel.bc.map(bcItem => ({
            species: bcItem.species,
            coord: toF64(Math.max(0, Math.min(length, bcItem.coord))),
        }))

        const pl = beamModel.pl.map(plItem => ({
            coord: toF64(Math.max(0, Math.min(length, plItem.coord))),
            value: toF64(plItem.value),
        }))

        const dl = beamModel.dl
            .filter(dlItem => dlItem.start_coord < dlItem.end_coord)
            .map(dlItem => ({
                start_coord: toF64(
                    Math.max(0, Math.min(length, dlItem.start_coord))
                ),
                end_coord: toF64(
                    Math.max(0, Math.min(length, dlItem.end_coord))
                ),
                value: toF64(dlItem.value),
            }))
            .filter(dlItem => dlItem.start_coord < dlItem.end_coord)

        return {
            bind: scalars.bind ?? false,
            sections,
            length,
            quality,
            inertia,
            young,
            density,
            area,
            solver_method:
                (scalars.solver_method as SolverMethod) ||
                DEFAULT_SOLVER_METHOD,
            bc,
            pl,
            dl,
            section_calculator: scalars.section_calculator,
        }
    })
}

/**
 * Снимок результата. `latest` не бросает исключение при ошибке предыдущего
 * запуска: неудачный расчёт не блокирует следующий.
 */
export type SolverResult = {
    readonly loading: boolean
    readonly error: unknown
    readonly latest: PlotData | undefined
}

/**
 * Экземпляр решателя и восстановление последней записи из истории.
 */
export type Solver = {
    result: SolverResult
    /** Повторный запуск по текущим параметрам формы (и в auto, и в manual). */
    rerun: () => void
    restoreLast: () => Promise<CalculationRecord | null>
}

/**
 * Создаёт реактивный решатель.
 *
 * Последовательность расчёта: проверка {@link isInvalid} →
 * {@link buildBeamSetup} → {@link calculateBeam} → сохранение в историю.
 * В режиме `auto` источник постановки откладывается на
 * {@link CALCULATION_DEBOUNCE_MS} мс. Ошибка WASM не отменяет следующий
 * запуск: устаревший ответ отбрасывается по номеру прогона и не затирает
 * более новый.
 */
export const createSolver = (options: SolverOptions): Solver => {
    const [manualSetup, setManualSetup] = createSignal<BeamSetup | null>(null)
    const [autoKick, setAutoKick] = createSignal(0)
    let prevManualTrigger = false

    createEffect(() => {
        const mode = options.mode?.() ?? "auto"
        const trigger = options.manualTrigger?.() ?? false
        if (
            mode === "manual" &&
            trigger &&
            !prevManualTrigger &&
            options.ready?.() !== false
        ) {
            const scalars = options.getScalars()
            if (!isInvalid(scalars)) {
                setManualSetup(buildBeamSetup(scalars))
            }
        }
        prevManualTrigger = !!trigger
    })

    const setupSource = createMemo((): BeamSetup | null => {
        if (options.ready?.() === false) {
            return null
        }

        const mode = options.mode?.() ?? "auto"
        if (mode === "manual") {
            return manualSetup()
        }

        autoKick()
        const scalars = options.getScalars()
        if (isInvalid(scalars)) {
            return null
        }

        return buildBeamSetup(scalars)
    })

    const debouncedSetup = debounce(setupSource, CALCULATION_DEBOUNCE_MS)

    const [data, setData] = createSignal<PlotData | undefined>(undefined)
    const [error, setError] = createSignal<unknown>(undefined)
    const [loading, setLoading] = createSignal(false)
    let runId = 0

    const retire = () => {
        batch(() => {
            setData(undefined)
            setError(undefined)
            setLoading(false)
        })
    }

    createEffect(() => {
        const setup = debouncedSetup()
        const id = ++runId
        if (setup == null) {
            retire()
            return
        }

        batch(() => {
            setLoading(true)
            setError(undefined)
            setData(undefined)
        })
        const startTime = Date.now()
        void calculateBeam(setup).then(
            plot => {
                if (id !== runId) return
                void saveCalculation(
                    startTime,
                    Date.now(),
                    plot,
                    setup,
                    "Успешно"
                )
                batch(() => {
                    setData(() => plot)
                    setError(undefined)
                    setLoading(false)
                })
            },
            err => {
                if (id !== runId) return
                void saveCalculation(
                    startTime,
                    Date.now(),
                    null,
                    setup,
                    "Ошибка"
                )
                batch(() => {
                    setError(err)
                    setLoading(false)
                })
            }
        )
    })

    const result: SolverResult = {
        get loading() {
            return loading()
        },
        get error() {
            return error()
        },
        get latest() {
            return data()
        },
    }

    const rerun = () => {
        if (options.ready?.() === false) return
        const scalars = options.getScalars()
        if (isInvalid(scalars)) return
        const setup = buildBeamSetup(scalars)
        if ((options.mode?.() ?? "auto") === "manual") {
            setManualSetup(setup)
            return
        }
        setAutoKick(n => n + 1)
    }

    const restoreLast = async (): Promise<CalculationRecord | null> => {
        const record = await getLastCalculation()
        if (!record || !record.setup) {
            return null
        }
        setData(record.data ?? createEmptyPlotData())
        setError(undefined)
        return record
    }

    return { result, rerun, restoreLast }
}
