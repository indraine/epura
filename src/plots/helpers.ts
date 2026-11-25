import {
    COORDINATE_TOLERANCE,
    COORDINATE_TOLERANCE_STRICT,
    EPURE_HATCH_TARGET_COUNT,
} from "./theme"

/**
 * Вертикальные штрихи эпюры от оси до кривой — разумное число точек,
 * плюс пределы на скачках (одинаковая x, разные y).
 */
export const buildEpureHatchTrace = (
    xs: number[],
    ys: number[],
    color: string,
    targetCount: number = EPURE_HATCH_TARGET_COUNT
) => {
    if (xs.length === 0 || ys.length === 0 || xs.length !== ys.length) {
        return null
    }

    const n = xs.length
    const xMin = xs[0]
    const xMax = xs[n - 1]
    const span = Math.abs(xMax - xMin)
    const spacing =
        span > COORDINATE_TOLERANCE
            ? span / Math.max(targetCount, 1)
            : Number.POSITIVE_INFINITY

    const selected: { x: number; y: number }[] = []
    let lastHatchX = Number.NEGATIVE_INFINITY

    for (let i = 0; i < n; i++) {
        const x = xs[i]
        const y = ys[i]
        const isJump =
            i > 0 && Math.abs(xs[i] - xs[i - 1]) <= COORDINATE_TOLERANCE_STRICT
        const isEnd = i === 0 || i === n - 1
        const farEnough = x - lastHatchX >= spacing - COORDINATE_TOLERANCE

        if (!isEnd && !isJump && !farEnough) {
            continue
        }
        if (Math.abs(y) <= COORDINATE_TOLERANCE_STRICT && !isJump && !isEnd) {
            continue
        }

        selected.push({ x, y })
        lastHatchX = x
    }

    if (selected.length === 0) {
        return null
    }

    const hx: (number | null)[] = []
    const hy: (number | null)[] = []
    for (const { x, y } of selected) {
        hx.push(x, x, null)
        hy.push(0, y, null)
    }

    return {
        x: hx,
        y: hy,
        mode: "lines" as const,
        line: { color, width: 1 },
        opacity: 0.55,
        name: "",
        showlegend: false,
        hoverinfo: "skip" as const,
    }
}

/** Вертикальная сила: оперение у (x, yTip), хвост у (x, yBase). */
export type ForceArrowSpec = {
    x: number
    yBase: number
    yTip: number
    color: string
    /** load — сплошная «прикладная»; reaction — другой наконечник + тоньше, визуально опора */
    kind?: "load" | "reaction"
    name?: string
    showlegend?: boolean
}

/** Сплошная стрелка нагрузки (annotation) в координатах данных. */
export const buildForceArrowAnnotation = (arrow: ForceArrowSpec) => ({
    x: arrow.x,
    y: arrow.yTip,
    ax: arrow.x,
    ay: arrow.yBase,
    xref: "x" as const,
    yref: "y" as const,
    axref: "x" as const,
    ayref: "y" as const,
    showarrow: true,
    arrowhead: 3,
    arrowsize: 1.35,
    arrowwidth: 2.6,
    arrowcolor: arrow.color,
    standoff: 0,
})

/** Запись в легенде (без отрисовки на графике). */
export const buildForceArrowLegendTrace = (arrow: ForceArrowSpec) => {
    const isReaction = arrow.kind === "reaction"
    return {
        x: [arrow.x],
        y: [arrow.yTip],
        mode: "lines" as const,
        line: {
            width: isReaction ? 2 : 2.6,
            color: arrow.color,
            dash: isReaction ? ("dash" as const) : ("solid" as const),
        },
        name: arrow.name ?? "",
        showlegend: arrow.showlegend ?? Boolean(arrow.name),
        visible: "legendonly" as const,
        hoverinfo: "skip" as const,
    }
}

/**
 * Невидимая широкая линия поверх стрелки нагрузки (annotation),
 * чтобы по hover снова показывалось значение, как раньше.
 */
export const buildForceArrowHoverTrace = (arrow: ForceArrowSpec) => ({
    x: [arrow.x, arrow.x],
    y: [arrow.yBase, arrow.yTip],
    mode: "lines" as const,
    line: { width: 16, color: arrow.color },
    opacity: 0,
    name: arrow.name ?? "",
    showlegend: false,
    hovertemplate: "%{fullData.name}<extra></extra>",
    hoverlabel: {
        bgcolor: arrow.color,
        font: { color: "#FFFFFF" },
    },
})

/**
 * Реакция опоры: пунктирная линия + маленький треугольник только на острие
 * (без annotation-наконечника нагрузок). Hover показывает значение.
 */
export const buildReactionArrowTraces = (arrow: ForceArrowSpec) => {
    const tipSymbol =
        arrow.yTip >= arrow.yBase ? "triangle-up" : "triangle-down"
    const label = arrow.name ?? "Реакция"
    const hover = {
        hovertemplate: "%{fullData.name}<extra></extra>",
        hoverlabel: {
            bgcolor: arrow.color,
            font: { color: "#FFFFFF" },
        },
    }
    return [
        {
            x: [arrow.x, arrow.x],
            y: [arrow.yBase, arrow.yTip],
            mode: "lines" as const,
            line: {
                width: 2,
                color: arrow.color,
                dash: "dash" as const,
            },
            name: label,
            showlegend: false,
            ...hover,
        },
        // Шире невидимый hit-area для удобного наведения
        {
            x: [arrow.x, arrow.x],
            y: [arrow.yBase, arrow.yTip],
            mode: "lines" as const,
            line: { width: 14, color: arrow.color },
            opacity: 0,
            name: label,
            showlegend: false,
            ...hover,
        },
        {
            x: [arrow.x],
            y: [arrow.yTip],
            mode: "markers" as const,
            marker: {
                symbol: tipSymbol,
                size: 9,
                color: arrow.color,
                line: { width: 0 },
            },
            name: label,
            showlegend: false,
            ...hover,
        },
        {
            x: [arrow.x],
            y: [arrow.yBase],
            mode: "markers" as const,
            marker: {
                symbol: "circle-open",
                size: 10,
                color: arrow.color,
                line: { width: 2, color: arrow.color },
            },
            name: label,
            showlegend: false,
            ...hover,
        },
    ]
}

export const normalizeCoordinate = (
    coord: number,
    tolerance: number = COORDINATE_TOLERANCE
): number => {
    return Math.abs(coord) < tolerance ? 0 : coord
}

export const normalizeCoordinateStrict = (coord: number): number => {
    return normalizeCoordinate(coord, COORDINATE_TOLERANCE_STRICT)
}

export const calculateBarWidths = (coords: number[]): number[] => {
    if (coords.length === 0) return []
    if (coords.length === 1) {
        return [Math.max(coords[0] * 0.1, 0.1)]
    }

    return coords.map((_, i) => {
        if (i === 0) {
            return (coords[1] - coords[0]) / 2
        } else if (i === coords.length - 1) {
            return (coords[i] - coords[i - 1]) / 2
        } else {
            return (coords[i + 1] - coords[i - 1]) / 2
        }
    })
}

export const hasExistingPlot = (div: HTMLDivElement): boolean => {
    return (
        div.classList.contains("js-plotly-plot") ||
        (div as any).__plotly !== undefined ||
        div.querySelector(".plotly") !== null
    )
}
