/**
 * Реактивная модель граничных условий и нагрузок балки.
 *
 * Хранилище синхронизировано с формой ввода. Виды опор (`species`) хранятся
 * уже в каноническом виде (`seal` — заделка, `hindle` — шарнир);
 * приведение альтернативных наименований выполняется на границе импорта
 * и выбора в интерфейсе функцией {@link canonicalizeBoundarySpecies}.
 */
import { createStore, reconcile } from "solid-js/store"
import type {
    BeamBoundaryCondition,
    BeamPointLoad,
    BeamDistributedLoad,
} from "../core/types"

/**
 * Состояние модели: длина L [мм]; списки опор, сосредоточенных сил [Н]
 * и распределённых нагрузок [Н/мм]. При bind = true координаты при расчёте
 * проецируются на узлы конечноэлементной сетки.
 */
export interface BeamModelState {
    length: number
    /** Число конечных элементов. Узлы сетки на диаграмме: sections + 1. */
    sections: number
    bind: boolean
    bc: BeamBoundaryCondition[]
    pl: BeamPointLoad[]
    dl: BeamDistributedLoad[]
}

/**
 * Начальное состояние: L = 1 [мм], заделка при x = 0,
 * сила F = -1 [Н] при x = 1 [мм], без распределённых нагрузок.
 */
export const createInitialBeamModel = (): BeamModelState => ({
    length: 1.0,
    sections: 10,
    bind: false,
    bc: [{ species: "seal", coord: 0 }],
    pl: [{ coord: 1.0, value: -1.0 }],
    dl: [],
})

const [beamModel, setBeamModel] = createStore<BeamModelState>(
    createInitialBeamModel()
)

/** Текущее состояние модели и низкоуровневый установщик хранилища. */
export { beamModel, setBeamModel }

/** Задаёт длину балки L [мм], если значение изменилось. */
export const setBeamLength = (length: number): void => {
    if (beamModel.length !== length) {
        setBeamModel("length", length)
    }
}

/** Задаёт число конечных элементов, если значение изменилось. */
export const setBeamSections = (sections: number): void => {
    const next = Math.round(sections)
    if (!Number.isFinite(next) || next < 1) return
    if (beamModel.sections !== next) {
        setBeamModel("sections", next)
    }
}

/** Включает или отключает проекцию координат на узлы сетки. */
export const setBindEnabled = (bind: boolean): void => {
    if (beamModel.bind !== bind) {
        setBeamModel("bind", bind)
    }
}

/**
 * Добавляет опору-заделку с координатой `NaN`.
 * Значение `NaN` делает строку недопустимой в {@link isInvalid}
 * до заполнения координаты [мм].
 */
export const addBoundaryCondition = (): void => {
    setBeamModel("bc", beamModel.bc.length, {
        species: "seal",
        coord: NaN,
    })
}

/** Удаляет граничное условие по индексу в массиве `bc`. */
export const removeBoundaryCondition = (index: number): void => {
    setBeamModel(
        "bc",
        beamModel.bc.filter((_, i) => i !== index)
    )
}

/**
 * Частичное изменение опоры (вид и/или координата [мм]).
 * Приведение вида опоры к канону на стороне хранилища не выполняется.
 */
export const updateBoundaryCondition = (
    index: number,
    patch: Partial<Pick<BeamBoundaryCondition, "species" | "coord">>
): void => {
    if (index < 0 || index >= beamModel.bc.length) return
    if (patch.species !== undefined) {
        setBeamModel("bc", index, "species", patch.species)
    }
    if (patch.coord !== undefined) {
        setBeamModel("bc", index, "coord", patch.coord)
    }
}

/**
 * Добавляет сосредоточенную силу с координатой и величиной `NaN`
 * (незаполненные поля ввода).
 */
export const addPointLoad = (): void => {
    setBeamModel("pl", beamModel.pl.length, {
        coord: NaN,
        value: NaN,
    })
}

/** Удаляет сосредоточенную силу по индексу в массиве `pl`. */
export const removePointLoad = (index: number): void => {
    setBeamModel(
        "pl",
        beamModel.pl.filter((_, i) => i !== index)
    )
}

/** Изменяет координату [мм] и/или величину [Н] сосредоточенной силы. */
export const updatePointLoad = (
    index: number,
    patch: Partial<Pick<BeamPointLoad, "coord" | "value">>
): void => {
    if (patch.coord !== undefined) {
        setBeamModel("pl", index, "coord", patch.coord)
    }
    if (patch.value !== undefined) {
        setBeamModel("pl", index, "value", patch.value)
    }
}

/**
 * Добавляет отрезок распределённой нагрузки с нулевыми границами и значением.
 * Пока `start_coord` не строго меньше `end_coord`, запись недопустима.
 */
export const addDistributedLoad = (): void => {
    setBeamModel("dl", beamModel.dl.length, {
        start_coord: 0,
        end_coord: 0,
        value: 0,
    })
}

/** Удаляет распределённую нагрузку по индексу в массиве `dl`. */
export const removeDistributedLoad = (index: number): void => {
    setBeamModel(
        "dl",
        beamModel.dl.filter((_, i) => i !== index)
    )
}

/** Изменяет границы отрезка [мм] и/или интенсивность q [Н/мм]. */
export const updateDistributedLoad = (
    index: number,
    patch: Partial<
        Pick<BeamDistributedLoad, "start_coord" | "end_coord" | "value">
    >
): void => {
    if (patch.start_coord !== undefined) {
        setBeamModel("dl", index, "start_coord", patch.start_coord)
    }
    if (patch.end_coord !== undefined) {
        setBeamModel("dl", index, "end_coord", patch.end_coord)
    }
    if (patch.value !== undefined) {
        setBeamModel("dl", index, "value", patch.value)
    }
}

/**
 * Полная замена модели (импорт конфигурации, восстановление из истории)
 * с согласованием неизменённых ветвей через `reconcile`.
 */
export const replaceBeamModel = (next: BeamModelState): void => {
    setBeamModel(reconcile(next))
}
