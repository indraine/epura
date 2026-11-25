import { createMemo, type Accessor, type JSX } from "solid-js"
import type { PlotData } from "~/core/types"
import type { LayoutConfig } from "./types"
import { PLOT_SETTINGS_KEYS, loadPlotSettings } from "./settings"
import { buildMoment } from "./traces/moment"
import type { PlotTheme } from "./theme"
import type { BeamScene } from "./scene"
import { Card } from "./Card"
import { Canvas, exportPlotPng } from "./Canvas"
import type { ExpandedPlotId } from "./types"

type MomentProps = {
    scene: Accessor<BeamScene>
    data: Accessor<PlotData | null>
    theme: Accessor<PlotTheme>
    layoutConfig: Accessor<LayoutConfig>
    expandedPlot: Accessor<ExpandedPlotId | null>
    onToggleExpand: (id: ExpandedPlotId) => void
    onHostReady?: (el: HTMLDivElement | null) => void
}

const settings = loadPlotSettings(PLOT_SETTINGS_KEYS.bendingMoment)

export const Moment = (props: MomentProps): JSX.Element => {
    let hostEl: HTMLDivElement | null = null

    const figure = createMemo(() =>
        buildMoment({
            scene: props.scene(),
            data: props.data(),
            theme: props.theme(),
            layoutConfig: props.layoutConfig(),
            settings,
        })
    )

    return (
        <Card
            id="moment"
            title="Эпюра изгибающих моментов M"
            expandedPlot={props.expandedPlot}
            onToggleExpand={props.onToggleExpand}
            onExportPng={() => exportPlotPng(hostEl, "beam-moment")}
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
