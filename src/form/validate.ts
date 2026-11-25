/**
 * Критерии допустимости геометрии и нагружения балки перед численным расчётом.
 *
 * Проверяются скалярные параметры формы и актуальные списки из {@link beamModel}.
 * Флаг привязки к узлам сетки (`bind`) в данной процедуре не рассматривается.
 */
import { beamModel } from "~/store/beam"
import type { SectionCalculatorParams, SolverMethod } from "~/core/types"
import {
    DEFAULT_AREA,
    DEFAULT_DENSITY,
    DEFAULT_INERTIA,
    DEFAULT_LENGTH,
    DEFAULT_QUALITY,
    DEFAULT_SECTIONS,
    DEFAULT_YOUNG,
    MAX_QUALITY,
    MAX_SECTIONS,
} from "./transfer"

/**
 * Скалярные параметры формы, входящие в постановку {@link BeamSetup}.
 * Размерности: L [мм], I [мм⁴], E [МПа], ρ [кг/мм³], A [мм²].
 */
export type FormScalars = {
    sections: number
    length: number
    quality: number
    inertia: number
    young: number
    density: number
    area: number
    bind: boolean
    solver_method?: SolverMethod
    section_calculator?: SectionCalculatorParams
}

const isNumber = (value: unknown): value is number => {
    return typeof value === "number" && !isNaN(value) && isFinite(value)
}

/**
 * Возвращает true, если постановка непригодна для расчёта.
 *
 * Условия допустимости:
 * - число элементов ∈ [1, 200], параметр интерполяции ∈ [1, 500];
 * - L > 0 [мм], E > 0 [МПа], ρ > 0 [кг/мм³], A > 0 [мм²], I ≥ 0 [мм⁴];
 * - задана хотя бы одна опора; координаты опор и сосредоточенных сил
 *  принадлежат [0, L];
 * - совпадение координат двух опор или двух сил с точностью |Δ x| < 10^-6 [мм]
 *   недопустимо;
 * - для каждой распределённой нагрузки границы принадлежат [0, L]
 *   и начало строго меньше конца;
 * - пересечение отрезков распределённых нагрузок данной проверкой не запрещается.
 */
export const isInvalid = (scalars: FormScalars): boolean => {
    const sections = scalars.sections ?? DEFAULT_SECTIONS
    if (!isNumber(sections) || sections < 1 || sections > MAX_SECTIONS) {
        return true
    }

    const length = scalars.length ?? DEFAULT_LENGTH
    if (!isNumber(length) || length <= 0) {
        return true
    }

    const quality = scalars.quality ?? DEFAULT_QUALITY
    if (!isNumber(quality) || quality < 1 || quality > MAX_QUALITY) {
        return true
    }

    const inertia = scalars.inertia ?? DEFAULT_INERTIA
    if (!isNumber(inertia) || inertia < 0) {
        return true
    }

    const young = scalars.young ?? DEFAULT_YOUNG
    if (!isNumber(young) || young <= 0) {
        return true
    }

    const density = scalars.density ?? DEFAULT_DENSITY
    if (!isNumber(density) || density <= 0) {
        return true
    }

    const area = scalars.area ?? DEFAULT_AREA
    if (!isNumber(area) || area <= 0) {
        return true
    }

    if (beamModel.bc.length === 0) {
        return true
    }

    for (let i = 0; i < beamModel.bc.length; i++) {
        const bc = beamModel.bc[i]
        if (
            !isNumber(bc.coord) ||
            bc.coord < 0 ||
            (isNumber(length) && bc.coord > length)
        ) {
            return true
        }
        for (let j = i + 1; j < beamModel.bc.length; j++) {
            const otherBc = beamModel.bc[j]
            if (
                isNumber(bc.coord) &&
                isNumber(otherBc.coord) &&
                Math.abs(bc.coord - otherBc.coord) < 1e-6
            ) {
                return true
            }
        }
    }

    const pls = beamModel.pl
    for (let i = 0; i < pls.length; i++) {
        const pl = pls[i]
        if (
            !isNumber(pl.coord) ||
            pl.coord < 0 ||
            (isNumber(length) && pl.coord > length)
        ) {
            return true
        }
        if (!isNumber(pl.value)) {
            return true
        }
        for (let j = i + 1; j < pls.length; j++) {
            const otherPl = pls[j]
            if (
                isNumber(pl.coord) &&
                isNumber(otherPl.coord) &&
                Math.abs(pl.coord - otherPl.coord) < 1e-6
            ) {
                return true
            }
        }
    }

    for (const dl of beamModel.dl) {
        if (
            !isNumber(dl.start_coord) ||
            !isNumber(dl.end_coord) ||
            dl.start_coord < 0 ||
            (isNumber(length) && dl.start_coord > length) ||
            dl.end_coord < 0 ||
            (isNumber(length) && dl.end_coord > length)
        ) {
            return true
        }
        if (dl.start_coord >= dl.end_coord) {
            return true
        }
        if (!isNumber(dl.value)) {
            return true
        }
    }

    return false
}
