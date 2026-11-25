/**
 * Ось балки и маркеры опор, общие для эпюр.
 * Берутся из текущей модели и не зависят от численного решения.
 */
import type { BeamScene } from "../scene"
import { normalizeCoordinate } from "../helpers"

/** Ось балки с квадратными маркерами узлов сетки. */
export const buildBeamAxisTrace = (scene: BeamScene, color: string) => ({
    x: scene.nodes,
    y: scene.nodes.map(() => 0),
    mode: "lines+markers" as const,
    marker: { size: 6, symbol: "square" as const, color },
    line: { color },
    showlegend: false,
})

/** Заделки и шарниры на нулевой линии, с одной записью легенды на вид. */
export const buildSupportTraces = (
    scene: BeamScene,
    color: string
): unknown[] => {
    const traces: unknown[] = []
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
                color,
            },
            name: isFirst ? (isHingle ? "Шарнир" : "Заделка") : "",
            showlegend: isFirst,
        })
    })

    return traces
}
