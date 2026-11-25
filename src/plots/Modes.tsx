import { createMemo, type Accessor, type JSX } from "solid-js"
import type { PlotData } from "~/core/types"
import type { LayoutConfig } from "./types"
import { PLOT_SETTINGS_KEYS, loadPlotSettings } from "./settings"
import { buildModes } from "./traces/modes"
import type { PlotTheme } from "./theme"
import type { BeamScene } from "./scene"
import { Card } from "./Card"
import { Canvas, exportPlotPng } from "./Canvas"
import type { ExpandedPlotId } from "./types"

type ModesProps = {
    scene: Accessor<BeamScene>
    data: Accessor<PlotData | null>
    mode: Accessor<"full" | "error">
    theme: Accessor<PlotTheme>
    layoutConfig: Accessor<LayoutConfig>
    expandedPlot: Accessor<ExpandedPlotId | null>
    onToggleExpand: (id: ExpandedPlotId) => void
    onHostReady?: (el: HTMLDivElement | null) => void
}

const settings = loadPlotSettings(PLOT_SETTINGS_KEYS.modes)

export const Modes = (props: ModesProps): JSX.Element => {
    let hostEl: HTMLDivElement | null = null

    const figure = createMemo(() => {
        return buildModes({
            scene: props.scene(),
            data: props.data(),
            theme: props.theme(),
            layoutConfig: props.layoutConfig(),
            settings,
            mode: props.mode(),
        })
    })

    return (
        <Card
            id="modes"
            title="Собственные формы колебаний"
            expandedPlot={props.expandedPlot}
            onToggleExpand={props.onToggleExpand}
            onExportPng={() => exportPlotPng(hostEl, "beam-modes")}
        >
            <Canvas
                traces={() => figure()?.traces}
                layout={() => figure()?.layout}
                enabled={() => true}
                onHostReady={el => {
                    hostEl = el
                    props.onHostReady?.(el)
                }}
            />
        </Card>
    )
}
