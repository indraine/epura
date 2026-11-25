/**
 * Решатель балки на WebAssembly (основной поток).
 * Устаревший ответ отбрасывает вызывающий код по номеру прогона;
 * промис расчёта всегда завершается.
 */
import type { BeamSetup, PlotData } from "./types"
import init, { calculate_beam as wasmCalculateBeam } from "../pkg/euler_beam"

let wasmReady = false
let initPromise: Promise<void> | null = null

/** Однократная загрузка модуля WebAssembly. */
const ensureWasm = async (): Promise<void> => {
    if (wasmReady) return
    if (!initPromise) {
        initPromise = init().then(() => {
            wasmReady = true
        })
    }
    await initPromise
}

/**
 * Индекс ближайшего узла сетки к координате нагрузки x [мм].
 * При пустом массиве координат возвращает 0.
 */
const findNearestNodeIndex = (coords: number[], x: number): number => {
    if (coords.length === 0) return 0
    let bestIdx = 0
    let bestDist = Math.abs(coords[0] - x)
    for (let i = 1; i < coords.length; i++) {
        const d = Math.abs(coords[i] - x)
        if (d < bestDist) {
            bestDist = d
            bestIdx = i
        }
    }
    return bestIdx
}

/**
 * Синхронный расчёт после {@link ensureWasm}.
 * `point_loads` пересобираются по координатам из `setup.pl`.
 */
const runCalculation = (setup: BeamSetup): PlotData => {
    const result = wasmCalculateBeam(setup) as PlotData

    if (result?.stress_state?.coords?.length) {
        const coords = result.stress_state.coords
        result.point_loads = setup.pl.map(pl => ({
            node_index: findNearestNodeIndex(coords, pl.coord),
            value: pl.value,
        }))
    }

    return result
}

/** Инициализация WASM. */
export const initWasm = async (): Promise<void> => {
    await ensureWasm()
}

/** Расчёт {@link BeamSetup} → {@link PlotData}. */
export const calculateBeam = async (setup: BeamSetup): Promise<PlotData> => {
    await ensureWasm()
    return runCalculation(setup)
}
