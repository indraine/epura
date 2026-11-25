import type { BeamSetup, PlotData } from "../core/types"

export interface PlotsProps {
    plotData: PlotData | null
    isCalculating?: boolean
    calculationError?: string | null
    hasValidationError?: boolean
    /** Применить конфигурацию из истории и запустить расчёт. */
    onApplyHistorySetup?: (setup: BeamSetup) => void
}

export interface LayoutConfig {
    margin: { l: number; r: number; t: number; b: number }
    titleFontSize: number
    axisTitleFontSize: number
    tickFontSize: number
    legendX: number
    legendY: number
    legendXanchor: "left" | "center" | "right"
    legendYanchor: "top" | "middle" | "bottom"
    legendFontSize: number
    domainX: [number, number]
    showLegend: boolean
}

export type ExpandedPlotId = "stress" | "modes" | "shear" | "moment"

export type PlotlyFigure = {
    traces: unknown[]
    layout: Record<string, unknown>
}
