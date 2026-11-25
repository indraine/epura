/**
 * Построение эпюры изгибающего момента M(x).
 *
 * Абсциссы — [мм], ординаты — [Н·мм]. Кривая сопровождается заливкой
 * до нулевой линии и вертикальной штриховкой ({@link buildEpureHatchTrace};
 * целевое число штрихов — {@link EPURE_HATCH_TARGET_COUNT}).
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

export type MomentInput = {
    /** Ось и опоры текущей модели. */
    scene: BeamScene
    /** Решение текущей постановки. Без него кривая M не строится. */
    data: PlotData | null
    theme: PlotTheme
    layoutConfig: LayoutConfig
    settings: PlotSettings
}

/**
 * Формирует эпюру M: кривая с заливкой и штриховкой, узлы оси, маркеры опор.
 * Ось и опоры есть и без численного решения.
 */
export const buildMoment = (input: MomentInput): PlotlyFigure => {
    const { scene, data, theme, layoutConfig, settings } = input
    const moment = data?.bending_moment
    const traces: unknown[] = []

    if (
        moment?.interpolate_points &&
        moment.interpolate_points.length > 0 &&
        moment.interpolated_curve &&
        moment.interpolated_curve.length > 0
    ) {
        traces.push({
            x: moment.interpolate_points,
            y: moment.interpolated_curve,
            mode: "lines",
            fill: "tozeroy",
            fillcolor: theme.epureFill,
            line: { color: theme.epureStroke, width: 2 },
            name: "Изгибающий момент M",
            showlegend: true,
        })
        const momentHatches = buildEpureHatchTrace(
            moment.interpolate_points,
            moment.interpolated_curve,
            theme.epureStroke
        )
        if (momentHatches) {
            traces.push(momentHatches)
        }
    }

    if (moment?.coords && moment.coords.length > 0) {
        traces.push({
            x: moment.coords,
            y: new Array(moment.coords.length).fill(0),
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
            yAxisTitle: "Изгибающий момент M, Н·мм",
        }),
    }
}
