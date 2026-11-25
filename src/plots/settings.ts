export type XAxisType = "linear" | "log" | "date" | "category"
export type TickMode = "linear" | "auto" | "array"

export interface PlotSettings {
    maxLines: number
    xAxisType: XAxisType
    tickMode: TickMode
}

export const PLOT_SETTINGS_KEYS = {
    stressState: "plotSettings_stressState",
    modes: "plotSettings_modes",
    shearForce: "plotSettings_shearForce",
    bendingMoment: "plotSettings_bendingMoment",
} as const

export const DEFAULT_PLOT_SETTINGS: PlotSettings = {
    maxLines: 10,
    xAxisType: "linear",
    tickMode: "auto",
}

export const loadPlotSettings = (key: string): PlotSettings => {
    if (typeof window === "undefined") return DEFAULT_PLOT_SETTINGS
    try {
        const stored = localStorage.getItem(key)
        if (stored) {
            const parsed = JSON.parse(stored)
            return {
                maxLines: parsed.maxLines ?? DEFAULT_PLOT_SETTINGS.maxLines,
                xAxisType: parsed.xAxisType ?? DEFAULT_PLOT_SETTINGS.xAxisType,
                tickMode: parsed.tickMode ?? DEFAULT_PLOT_SETTINGS.tickMode,
            }
        }
    } catch (e) {
        console.error("Ошибка загрузки настроек графика:", e)
    }
    return DEFAULT_PLOT_SETTINGS
}
