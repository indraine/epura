import type { LayoutConfig } from "./types"

export const getLayoutConfig = (
    windowWidth: number,
    isMobile: boolean
): LayoutConfig => {
    const isVerySmall = windowWidth < 480

    if (isVerySmall) {
        return {
            margin: { l: 40, r: 10, t: 25, b: 80 },
            titleFontSize: 11,
            axisTitleFontSize: 9,
            tickFontSize: 8,
            legendX: 0.5,
            legendY: -0.15,
            legendXanchor: "center" as const,
            legendYanchor: "top" as const,
            legendFontSize: 8,
            domainX: [0, 1],
            showLegend: true,
        }
    } else if (isMobile) {
        return {
            margin: { l: 50, r: 20, t: 30, b: 50 },
            titleFontSize: 12,
            axisTitleFontSize: 10,
            tickFontSize: 9,
            legendX: 0.75,
            legendY: 1,
            legendXanchor: "left" as const,
            legendYanchor: "top" as const,
            legendFontSize: 9,
            domainX: [0, 0.7],
            showLegend: true,
        }
    } else {
        return {
            margin: { l: 80, r: 120, t: 40, b: 60 },
            titleFontSize: 16,
            axisTitleFontSize: 14,
            tickFontSize: 12,
            legendX: 0.82,
            legendY: 1,
            legendXanchor: "left" as const,
            legendYanchor: "top" as const,
            legendFontSize: 12,
            domainX: [0, 0.8],
            showLegend: true,
        }
    }
}
