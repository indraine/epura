/**
 * Построение диаграммы поперечного прогиба u(x).
 *
 * Абсциссы — координата вдоль оси [мм]; ординаты — прогиб [мм].
 * Дополнительно отображаются сосредоточенные силы [Н], распределённая
 * нагрузка q [Н/мм], маркеры опор и реакции [Н].
 *
 * Высота стрелок задаётся относительно размаха прогиба |max - min|:
 * для нагрузок — |max - min|/2 (для q — половина этой величины);
 * для реакций — |max - min|/4. Знак величины определяет направление
 * и цвет (для нагрузок) либо цвет реакций из темы оформления.
 */
import type { PlotData } from "~/core/types"
import type { LayoutConfig } from "../types"
import type { PlotSettings } from "../settings"
import type { BeamScene } from "../scene"
import {
    buildForceArrowAnnotation,
    buildForceArrowHoverTrace,
    buildForceArrowLegendTrace,
    buildReactionArrowTraces,
    normalizeCoordinate,
} from "../helpers"
import { buildPlotLayout, type PlotTheme } from "../theme"
import { buildBeamAxisTrace } from "./scheme"

/**
 * Режим построения: `full` — прогиб и реакции поверх схемы;
 * `error` — только схема (ось, опоры, силы), без кривой прогиба и реакций.
 */
export type DeflectionMode = "full" | "error"

export type DeflectionInput = {
    /** Опоры и нагрузки текущей модели. От результата расчёта не зависят. */
    scene: BeamScene
    /** Решение текущей постановки. Без него кривая и реакции не строятся. */
    data: PlotData | null
    theme: PlotTheme
    layoutConfig: LayoutConfig
    settings: PlotSettings
    mode?: DeflectionMode
}

/** Набор серий и параметров макета для библиотеки построения графиков. */
export type PlotlyFigure = {
    traces: unknown[]
    layout: Record<string, unknown>
}

/**
 * Формирует диаграмму прогиба: узлы сетки, интерполированная кривая u(x),
 * ось балки, стрелки сил и реакций, заливка q, маркеры заделки и шарнира.
 */
const loadArrowScale = (
    data: PlotData | null,
    mode: DeflectionMode
): number => {
    if (mode !== "full" || !data) return 1
    const span = Math.abs(
        data.stress_state.max_value - data.stress_state.min_value
    )
    return span / 2 || 1
}

export const buildDeflection = (input: DeflectionInput): PlotlyFigure => {
    const { scene, data, theme, layoutConfig, settings, mode = "full" } = input
    const solution = mode === "full" ? data : null
    const traces: unknown[] = []
    const annotations: ReturnType<typeof buildForceArrowAnnotation>[] = []

    if (
        solution &&
        solution.stress_state.coords.length > 0 &&
        solution.stress_state.node_values.length > 0
    ) {
        traces.push({
            x: solution.stress_state.coords,
            y: solution.stress_state.node_values,
            mode: "markers",
            marker: { size: 6, symbol: "square", color: theme.node },
            name: "Узлы сетки",
            showlegend: true,
        })

        if (
            solution.stress_state.interpolate_points.length > 0 &&
            solution.stress_state.interpolated_curve.length > 0
        ) {
            traces.push({
                x: solution.stress_state.interpolate_points,
                y: solution.stress_state.interpolated_curve,
                mode: "lines",
                marker: { color: theme.deflection },
                line: { color: theme.deflection, width: 3 },
                name: "Прогиб",
                showlegend: true,
            })
        }
    }

    traces.push(buildBeamAxisTrace(scene, theme.beamAxis))

    const val = loadArrowScale(solution, mode)

    scene.pointLoads.forEach((load, idx) => {
        const coord = normalizeCoordinate(load.coord)
        const yBase = load.value < 0 ? val : -val
        const loadColor = load.value < 0 ? theme.loadRose : theme.loadAmber
        const arrow = {
            x: coord,
            yBase,
            yTip: 0,
            color: loadColor,
            kind: "load" as const,
            name: `P${idx + 1} = ${load.value.toFixed(2)} Н`,
            showlegend: true,
        }
        annotations.push(buildForceArrowAnnotation(arrow))
        traces.push(
            buildForceArrowLegendTrace(arrow),
            buildForceArrowHoverTrace(arrow)
        )
    })

    scene.distributedLoads.forEach((load, idx) => {
        const startCoord = normalizeCoordinate(load.start_coord)
        const endCoord = normalizeCoordinate(load.end_coord)
        const yVal = load.value < 0 ? val / 2 : -val / 2
        const loadColor = load.value < 0 ? theme.loadRose : theme.loadAmber
        traces.push({
            x: [startCoord, startCoord, endCoord, endCoord],
            y: [0, yVal, yVal, 0],
            fill: "tozeroy",
            fillcolor:
                load.value < 0
                    ? "rgba(251,113,133,0.25)"
                    : "rgba(245,158,11,0.25)",
            line: { color: loadColor },
            mode: "none",
            name: `q${idx + 1} = ${load.value.toFixed(2)} Н/мм`,
            showlegend: true,
        })
    })

    let hingleInLegend = false
    let sealInLegend = false

    scene.supports.forEach(support => {
        const coord = normalizeCoordinate(support.coord, 1e-10)
        const isHingle = support.species === "hindle"
        const isFirst = isHingle ? !hingleInLegend : !sealInLegend

        if (isHingle) hingleInLegend = true
        else sealInLegend = true

        traces.push({
            x: [coord],
            y: [0],
            mode: "markers",
            marker: {
                symbol: isHingle ? "circle-x-open" : "circle",
                size: 15,
                color: theme.boundaryCondition,
            },
            name: isFirst ? (isHingle ? "Шарнир" : "Заделка") : "",
            showlegend: isFirst,
        })
    })

    if (solution) {
        const hasLoads =
            scene.pointLoads.length > 0 || scene.distributedLoads.length > 0
        if (hasLoads && solution.reactions && solution.reactions.length > 0) {
            const min = solution.stress_state.min_value
            const max = solution.stress_state.max_value
            const arrowHeight = Math.abs(max - min) / 4 || 1

            solution.reactions.forEach((reaction, idx) => {
                if (reaction.node_index < solution.stress_state.coords.length) {
                    const coord = normalizeCoordinate(
                        solution.stress_state.coords[reaction.node_index]
                    )
                    const yTip = reaction.value > 0 ? arrowHeight : -arrowHeight
                    const valueLabel = `R${idx + 1} = ${reaction.value.toFixed(2)} Н`
                    const arrow = {
                        x: coord,
                        yBase: 0,
                        yTip,
                        color: theme.reaction,
                        kind: "reaction" as const,
                        name: valueLabel,
                        showlegend: false,
                    }
                    traces.push(...buildReactionArrowTraces(arrow))
                    if (idx === 0) {
                        traces.push(
                            buildForceArrowLegendTrace({
                                ...arrow,
                                name: "Реакции",
                                showlegend: true,
                            })
                        )
                    }
                }
            })
        }
    }

    return {
        traces,
        layout: buildPlotLayout({
            theme,
            layoutConfig,
            settings,
            xAxisTitle: "Координата x, мм",
            yAxisTitle: "Прогиб u, мм",
            annotations,
        }),
    }
}
