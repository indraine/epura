/**
 * Геометрия и нагрузки, которые видны на диаграмме без численного решения:
 * длина оси, узлы конечных элементов, опоры, сосредоточенные силы
 * и распределённая нагрузка.
 * Снимок снимается с текущей модели, а не с последнего кадра решателя.
 */
import { beamModel } from "~/store/beam"
import type {
    BeamBoundaryCondition,
    BeamDistributedLoad,
    BeamPointLoad,
} from "~/core/types"

export type BeamScene = {
    /** Длина балки L [мм]. */
    length: number
    /** Число конечных элементов. */
    sections: number
    /** Проецировать опоры и нагрузки на узлы равномерной сетки. */
    bind: boolean
    /** Абсциссы узлов сетки [мм], включая концы балки. */
    nodes: number[]
    supports: BeamBoundaryCondition[]
    pointLoads: BeamPointLoad[]
    distributedLoads: BeamDistributedLoad[]
}

const finite = (value: number): boolean => Number.isFinite(value)

const COORD_EPSILON = 1e-10
const COORD_RELATIVE_EPSILON = 1e-9

const coordsApproxEqual = (a: number, b: number, maxCoord: number): boolean => {
    const absDiff = Math.abs(a - b)
    if (absDiff < COORD_EPSILON) return true
    return maxCoord > 0 && absDiff / maxCoord < COORD_RELATIVE_EPSILON
}

/**
 * Узлы сетки так же, как в решателе: равномерно по элементам,
 * а без привязки к узлам — ещё и в точках опор и нагрузок.
 */
const meshNodes = (
    length: number,
    sections: number,
    bind: boolean,
    extras: number[]
): number[] => {
    const span = length > 0 ? length : 1
    const elementCount = Number.isFinite(sections)
        ? Math.max(1, Math.round(sections))
        : 10
    const count = elementCount + 1
    const coords: number[] = new Array(count)
    const delta = span / elementCount
    coords[0] = 0
    for (let i = 1; i < elementCount; i++) {
        coords[i] = coords[i - 1] + delta
    }
    coords[elementCount] = span

    if (!bind) {
        for (let i = 0; i < extras.length; i++) {
            if (finite(extras[i])) coords.push(extras[i])
        }
    }

    coords.sort((a, b) => a - b)
    const maxCoord = coords.reduce((max, value) => Math.max(max, value), 0)
    const deduped: number[] = []
    for (let i = 0; i < coords.length; i++) {
        const coord = coords[i]
        const duplicate = deduped.some(existing =>
            coordsApproxEqual(existing, coord, maxCoord)
        )
        if (!duplicate) deduped.push(coord)
    }
    return deduped
}

/**
 * Копирует из модели только записи с конечными координатами.
 * Незаполненная строка формы (NaN) на диаграмму не попадает.
 */
export const readBeamScene = (): BeamScene => {
    const supports: BeamBoundaryCondition[] = []
    for (let i = 0; i < beamModel.bc.length; i++) {
        const support = beamModel.bc[i]
        if (finite(support.coord)) {
            supports.push({ species: support.species, coord: support.coord })
        }
    }

    const pointLoads: BeamPointLoad[] = []
    for (let i = 0; i < beamModel.pl.length; i++) {
        const load = beamModel.pl[i]
        if (finite(load.coord) && finite(load.value)) {
            pointLoads.push({ coord: load.coord, value: load.value })
        }
    }

    const distributedLoads: BeamDistributedLoad[] = []
    for (let i = 0; i < beamModel.dl.length; i++) {
        const load = beamModel.dl[i]
        if (
            finite(load.start_coord) &&
            finite(load.end_coord) &&
            finite(load.value) &&
            load.start_coord < load.end_coord
        ) {
            distributedLoads.push({
                start_coord: load.start_coord,
                end_coord: load.end_coord,
                value: load.value,
            })
        }
    }

    const extras: number[] = []
    for (let i = 0; i < supports.length; i++) extras.push(supports[i].coord)
    for (let i = 0; i < pointLoads.length; i++) extras.push(pointLoads[i].coord)
    for (let i = 0; i < distributedLoads.length; i++) {
        extras.push(
            distributedLoads[i].start_coord,
            distributedLoads[i].end_coord
        )
    }

    const sections = finite(beamModel.sections)
        ? Math.max(1, Math.round(beamModel.sections))
        : 10
    const length = finite(beamModel.length) ? beamModel.length : 0

    return {
        length,
        sections,
        bind: beamModel.bind,
        nodes: meshNodes(length, sections, beamModel.bind, extras),
        supports,
        pointLoads,
        distributedLoads,
    }
}
