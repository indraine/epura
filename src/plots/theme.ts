/**
 * Цветовая схема и оформление осей диаграмм балки.
 *
 * Палитра согласована с токенами оформления интерфейса.
 * Нагрузки окрашиваются по знаку; реакции — отдельным цветом;
 * эпюры Q и M — заливкой и обводкой одного тона; опоры — изумрудным.
 */

/** Параметры библиотеки построения графиков: адаптивный размер, выгрузка в SVG. */
export const PLOTLY_CONFIG = {
    responsive: true,
    useResizeHandler: true,
    toImageButtonOptions: {
        format: "svg" as const,
        filename: "beam-plot",
        scale: 1,
    },
    displayModeBar: true,
    modeBarButtons: [["toImage"]] as any[][],
}

export const CHART_CYAN = "#38BDF8"
export const CHART_AMBER = "#F59E0B"
export const CHART_EMERALD = "#34D399"
export const CHART_ROSE = "#FB7185"
/** Полупрозрачная заливка эпюр Q и M. */
export const CHART_CYAN_FILL = "rgba(56,189,248,0.25)"

/** Цвета кривых собственных форм (не более пяти). */
export const MODE_COLORS = [
    CHART_CYAN,
    CHART_AMBER,
    CHART_EMERALD,
    CHART_ROSE,
    CHART_CYAN,
]

export const NODE_COLOR = CHART_CYAN
export const DEFLECTION_COLOR = CHART_CYAN
export const COORDINATE_AXIS_COLOR = "#8C909F"
export const BOUNDARY_CONDITION_COLOR = CHART_EMERALD
/** Цвет реакций опор; не совпадает с цветами нагрузок. */
export const REACTION_COLOR = "#7C3AED"
/** Отрицательная нагрузка. */
export const LOAD_ROSE = CHART_ROSE
/** Положительная нагрузка. */
export const LOAD_AMBER = CHART_AMBER
export const SHEAR_FORCE_COLOR = CHART_CYAN
export const BENDING_MOMENT_COLOR = CHART_CYAN

/** Допуск совпадения координат [мм] при проверке дубликатов. */
export const COORDINATE_TOLERANCE = 1e-6
/** Строгий допуск обнуления координаты на диаграммах [мм]. */
export const COORDINATE_TOLERANCE_STRICT = 1e-10

/**
 * Целевое число вертикальных штрихов на эпюре Q или M
 * (не в каждой точке интерполяционной выборки).
 */
export const EPURE_HATCH_TARGET_COUNT = 40

export const PLOT_FONT_FAMILY = '"Source Code Pro", ui-monospace, monospace'

/**
 * Тема оформления диаграмм: фоны, оси, сетка, легенда и цвета серий
 * (прогиб, узлы, собственные формы, опоры, реакции, нагрузки, эпюры).
 */
export type PlotTheme = {
    paperBg: string
    plotBg: string
    fontColor: string
    axisColor: string
    gridColor: string
    zerolineColor: string
    legendBg: string
    legendBorder: string
    fontFamily: string
    deflection: string
    node: string
    beamAxis: string
    modes: string[]
    boundaryCondition: string
    reaction: string
    loadRose: string
    loadAmber: string
    epureFill: string
    epureStroke: string
    axisMarker: string
}

/**
 * Формирует {@link PlotTheme} для светлого или тёмного оформления интерфейса.
 */
export const getPlotTheme = (isDark: boolean): PlotTheme => {
    return {
        paperBg: isDark ? "#0B0E15" : "#FFFFFF",
        plotBg: isDark ? "#0B0E15" : "#FFFFFF",
        fontColor: isDark ? "#E1E2EC" : "#191B23",
        // Light: on-surface-variant / outline — заметнее сетка и подписи осей
        axisColor: isDark ? "#8C909F" : "#424754",
        gridColor: isDark ? "rgba(66, 71, 84, 0.35)" : "rgba(66, 71, 84, 0.28)",
        zerolineColor: isDark ? "#8C909F" : "#424754",
        legendBg: isDark
            ? "rgba(11, 14, 21, 0.85)"
            : "rgba(255, 255, 255, 0.85)",
        legendBorder: isDark ? "#424754" : "#8C909F",
        fontFamily: PLOT_FONT_FAMILY,
        deflection: DEFLECTION_COLOR,
        node: NODE_COLOR,
        beamAxis: isDark ? "#8C909F" : "#424754",
        modes: MODE_COLORS,
        boundaryCondition: BOUNDARY_CONDITION_COLOR,
        reaction: REACTION_COLOR,
        loadRose: LOAD_ROSE,
        loadAmber: LOAD_AMBER,
        epureFill: CHART_CYAN_FILL,
        epureStroke: CHART_CYAN,
        axisMarker: isDark ? "#C2C6D6" : "#191B23",
    }
}

/**
 * Общие стили оси: цвет, пунктирная сетка, нулевая линия, подписи делений.
 * @param tickFontSize — размер подписей [пкс].
 */
export const getThemedAxisStyle = (theme: PlotTheme, tickFontSize: number) => {
    return {
        color: theme.axisColor,
        gridcolor: theme.gridColor,
        griddash: "dash" as const,
        linecolor: theme.axisColor,
        tickfont: {
            color: theme.axisColor,
            size: tickFontSize,
            family: theme.fontFamily,
        },
        zeroline: true,
        zerolinecolor: theme.zerolineColor,
        zerolinewidth: 1,
    }
}

/**
 * Общий фон области построения, шрифт и оформление легенды.
 * @param legendFontSize — размер шрифта легенды [пкс].
 */
export const getThemedLayoutChrome = (
    theme: PlotTheme,
    legendFontSize: number
) => {
    return {
        paper_bgcolor: theme.paperBg,
        plot_bgcolor: theme.plotBg,
        font: {
            color: theme.fontColor,
            family: theme.fontFamily,
        },
        legend: {
            font: {
                color: theme.fontColor,
                size: legendFontSize,
                family: theme.fontFamily,
            },
            bgcolor: theme.legendBg,
            bordercolor: theme.legendBorder,
        },
    }
}

import type { LayoutConfig } from "./types"
import type { PlotSettings } from "./settings"

/**
 * Параметры полного макета диаграммы: оси, поля, легенда, поясняющие стрелки.
 * Подписи осей содержат размерности (x [мм]; прогиб [мм]; Q [Н]; M [Н·мм]).
 */
export type BuildPlotLayoutOptions = {
    theme: PlotTheme
    layoutConfig: LayoutConfig
    settings: PlotSettings
    xAxisTitle: string
    yAxisTitle: string
    annotations?: unknown[]
}

/**
 * Формирует макет диаграммы: оси с размерностями в заголовках,
 * поля и легенда из `layoutConfig`, фоны из темы оформления.
 */
export const buildPlotLayout = (
    options: BuildPlotLayoutOptions
): Record<string, unknown> => {
    const {
        theme,
        layoutConfig,
        settings,
        xAxisTitle,
        yAxisTitle,
        annotations,
    } = options

    return {
        title: { text: "" },
        ...(annotations ? { annotations } : {}),
        xaxis: {
            domain: layoutConfig.domainX,
            color: theme.axisColor,
            gridcolor: theme.gridColor,
            griddash: "dash",
            linecolor: theme.axisColor,
            tickfont: {
                color: theme.axisColor,
                size: layoutConfig.tickFontSize,
                family: theme.fontFamily,
            },
            title: {
                text: xAxisTitle,
                font: {
                    color: theme.axisColor,
                    size: layoutConfig.axisTitleFontSize,
                    family: theme.fontFamily,
                },
                standoff: 5,
            },
            type: settings.xAxisType,
            tickmode: settings.tickMode,
            nticks: 10,
            showexponent: "none",
            zeroline: true,
            zerolinecolor: theme.zerolineColor,
            zerolinewidth: 1,
            fixedrange: false,
        },
        yaxis: {
            color: theme.axisColor,
            gridcolor: theme.gridColor,
            griddash: "dash",
            linecolor: theme.axisColor,
            tickfont: {
                color: theme.axisColor,
                size: layoutConfig.tickFontSize,
                family: theme.fontFamily,
            },
            title: {
                text: yAxisTitle,
                font: {
                    color: theme.axisColor,
                    size: layoutConfig.axisTitleFontSize,
                    family: theme.fontFamily,
                },
                standoff: 5,
            },
        },
        margin: layoutConfig.margin,
        autosize: true,
        template: "plotly_white",
        legend: {
            x: layoutConfig.legendX,
            y: layoutConfig.legendY,
            xanchor: layoutConfig.legendXanchor,
            yanchor: layoutConfig.legendYanchor,
            font: {
                color: theme.fontColor,
                size: layoutConfig.legendFontSize,
                family: theme.fontFamily,
            },
            bgcolor: theme.legendBg,
            bordercolor: theme.legendBorder,
        },
        paper_bgcolor: theme.paperBg,
        plot_bgcolor: theme.plotBg,
        font: {
            color: theme.fontColor,
            family: theme.fontFamily,
        },
    }
}
