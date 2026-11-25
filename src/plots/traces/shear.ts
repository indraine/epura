/**
 * Построение эпюры поперечной силы Q(x).
 *
 * Абсциссы — [мм], ординаты — [Н]. Кривая сопровождается заливкой до нулевой
 * линии и вертикальной штриховкой ({@link buildEpureHatchTrace}); целевое
 * число штрихов задаётся константой {@link EPURE_HATCH_TARGET_COUNT}
 * и не совпадает с числом точек выборки.
 * Без решения остаётся ось балки и маркеры опор текущей модели.
 */
import type { PlotData } from "~/core/types"
import type { LayoutConfig } from "../types"
import type { PlotSettings } from "../settings"
import type { BeamScene } from "../scene"
import { buildEpureHatchTrace } from "../helpers"
import { buildPlotLayout, type PlotTheme } from "../theme"
import type { PlotlyFigure } from "../types"
import { buildBeamAxisTrace, buildSupportTraces } from "./scheme"

export type ShearInput = {
    /** Ось и опоры текущей модели. */
    scene: BeamScene
    /** Решение текущей постановки. Без него кривая Q не строится. */
    data: PlotData | null
    theme: PlotTheme
    layoutConfig: LayoutConfig
    settings: PlotSettings
}

/**
 * Формирует эпюру Q: кривая с заливкой и штриховкой, узлы оси, маркеры опор.
 * Ось и опоры есть и без численного решения.
 */
export const buildShear = (input: ShearInput): PlotlyFigure => {
    const { scene, data, theme, layoutConfig, settings } = input
    const shear = data?.shear_force
    const traces: unknown[] = []

    if (
        shear?.interpolate_points &&
        shear.interpolate_points.length > 0 &&
        shear.interpolated_curve &&
        shear.interpolated_curve.length > 0
    ) {
        traces.push({
            x: shear.interpolate_points,
            y: shear.interpolated_curve,
            mode: "lines",
            fill: "tozeroy",
            fillcolor: theme.epureFill,
            line: { color: theme.epureStroke, width: 2 },
            name: "Поперечная сила Q",
            showlegend: true,
        })
        const shearHatches = buildEpureHatchTrace(
            shear.interpolate_points,
            shear.interpolated_curve,
            theme.epureStroke
        )
        if (shearHatches) {
            traces.push(shearHatches)
        }
    }

    if (shear?.coords && shear.coords.length > 0) {
        traces.push({
            x: shear.coords,
            y: new Array(shear.coords.length).fill(0),
            mode: "markers",
            marker: { size: 6, symbol: "square", color: theme.axisMarker },
            name: "Узлы",
            showlegend: true,
        })
    } else {
        traces.push(buildBeamAxisTrace(scene, theme.beamAxis))
    }

    traces.push(...buildSupportTraces(scene, theme.boundaryCondition))

    return {
        traces,
        layout: buildPlotLayout({
            theme,
            layoutConfig,
            settings,
            xAxisTitle: "Координата x, мм",
            yAxisTitle: "Поперечная сила Q, Н",
        }),
    }
}
