/**
 * Построение диаграмм собственных форм поперечных колебаний.
 *
 * Абсцисса — координата вдоль оси [мм]; ордината — амплитуда формы
 * (по собственному вектору решателя). Отображается не более пяти форм;
 * частота в легенде — [Гц]. Координаты опор с |x| < 10^-6 [мм]
 * приводятся к нулю.
 */
import type { PlotData } from "~/core/types"
import type { LayoutConfig } from "../types"
import type { PlotSettings } from "../settings"
import type { BeamScene } from "../scene"
import { buildPlotLayout, type PlotTheme } from "../theme"
import type { PlotlyFigure } from "../types"
import { buildBeamAxisTrace } from "./scheme"

/** `full` — формы, ось и опоры; `error` — ось балки и опоры без форм. */
export type ModesMode = "full" | "error"

export type ModesInput = {
    /** Опоры и длина текущей модели. */
    scene: BeamScene
    /** Решение текущей постановки. Без него формы не строятся. */
    data: PlotData | null
    theme: PlotTheme
    layoutConfig: LayoutConfig
    settings: PlotSettings
    mode?: ModesMode
}

/**
 * Формирует диаграмму собственных форм (не более пяти):
 * интерполированные кривые, узлы, ось балки, маркеры опор.
 */
export const buildModes = (input: ModesInput): PlotlyFigure => {
    const { scene, data, theme, layoutConfig, settings, mode = "full" } = input
    const traces: unknown[] = []
    const solution = mode === "full" ? data : null

    if (solution) {
        const colors = theme.modes
        const numModes = Math.min(5, solution.modes.modes.length)

        solution.modes.modes.slice(0, numModes).forEach((modeItem, modeIdx) => {
            traces.push({
                x: solution.modes.interpolate_points,
                y: modeItem.interpolated_curve,
                mode: "lines",
                name: `Мода ${modeItem.index + 1} (f=${modeItem.frequency.toFixed(3)} Гц)`,
                line: { color: colors[modeIdx % colors.length] },
            })

            traces.push({
                x: solution.modes.coords,
                y: modeItem.node_values,
                mode: "markers",
                marker: {
                    size: 5,
                    symbol: "square",
                    color: colors[modeIdx % colors.length],
                },
                showlegend: false,
            })
        })
    }

    traces.push(buildBeamAxisTrace(scene, theme.beamAxis))

    scene.supports.forEach(support => {
        const coord = Math.abs(support.coord) < 1e-6 ? 0 : support.coord
        const isHingle = support.species === "hindle"
        traces.push({
            x: [coord],
            y: [0],
            mode: "markers",
            marker: {
                symbol: isHingle ? "circle-x-open" : "circle",
                size: 15,
                color: theme.boundaryCondition,
            },
            showlegend: false,
        })
    })

    return {
        traces,
        layout: buildPlotLayout({
            theme,
            layoutConfig,
            settings,
            xAxisTitle: "Координата x, мм",
            yAxisTitle: "Амплитуда u",
        }),
    }
}
