/**
 * Область результатов: вкладки прогиба, собственных форм, эпюр Q и M.
 *
 * Ось, опоры и силы берутся из текущей модели и остаются на диаграмме
 * без численного решения. Кривая прогиба, формы и эпюры Q и M появляются
 * только вместе с успешным результатом текущей постановки. Предусмотрено
 * развёртывание на весь экран (закрытие клавишей Escape) с блокировкой
 * прокрутки страницы.
 */
import {
    createEffect,
    createMemo,
    createSignal,
    onCleanup,
    onMount,
    type JSX,
} from "solid-js"
import { useColorMode } from "@kobalte/core"
import { Tabs as UiTabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import type { PlotsProps } from "./types"
import { getLayoutConfig } from "./layout"
import { getPlotTheme } from "./theme"
import { Deflection } from "./Deflection"
import { Modes } from "./Modes"
import { Shear } from "./Shear"
import { Moment } from "./Moment"
import { Tabs } from "./Tabs"
import { schedulePlotResize } from "./Canvas"
import { readBeamScene } from "./scene"
import type { ExpandedPlotId } from "./types"

/**
 * Корневой компонент области диаграмм: тема оформления, вкладки,
 * развёртывание. Данные кадра приходят готовыми из решателя.
 */
const Plots = (props: PlotsProps): JSX.Element => {
    const { colorMode } = useColorMode()
    const plotTheme = createMemo(() => getPlotTheme(colorMode() === "dark"))

    const [activeTab, setActiveTab] = createSignal("stress")
    const [windowWidth, setWindowWidth] = createSignal(
        typeof window !== "undefined" ? window.innerWidth : 1024
    )
    const [expandedPlot, setExpandedPlot] = createSignal<ExpandedPlotId | null>(
        null
    )
    const scene = createMemo(readBeamScene)
    const plotData = (): PlotsProps["plotData"] => props.plotData
    const solutionMode = createMemo<"full" | "error">(() =>
        props.plotData && !props.calculationError ? "full" : "error"
    )

    const [stressHost, setStressHost] = createSignal<HTMLDivElement | null>(
        null
    )
    const [modesHost, setModesHost] = createSignal<HTMLDivElement | null>(null)
    const [shearHost, setShearHost] = createSignal<HTMLDivElement | null>(null)
    const [momentHost, setMomentHost] = createSignal<HTMLDivElement | null>(
        null
    )

    const isMobile = createMemo(() => windowWidth() < 768)
    const layoutConfig = createMemo(() =>
        getLayoutConfig(windowWidth(), isMobile())
    )

    createEffect(() => {
        if (typeof window === "undefined") return
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener("resize", handleResize)
        onCleanup(() => window.removeEventListener("resize", handleResize))
    })

    createEffect(() => {
        activeTab()
        windowWidth()
        plotTheme()
        expandedPlot()
        const hosts =
            activeTab() === "diagrams"
                ? [shearHost(), momentHost()]
                : [stressHost(), modesHost()]
        return schedulePlotResize(hosts)
    })

    createEffect(() => {
        expandedPlot()
        const raf = requestAnimationFrame(() => {
            window.dispatchEvent(new Event("resize"))
        })
        onCleanup(() => cancelAnimationFrame(raf))
    })

    createEffect(() => {
        if (typeof document === "undefined") return
        if (expandedPlot() !== null) {
            document.body.style.overflow = "hidden"
            onCleanup(() => {
                document.body.style.overflow = ""
            })
        }
    })

    onMount(() => {
        setWindowWidth(window.innerWidth)
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && expandedPlot()) {
                setExpandedPlot(null)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        onCleanup(() => window.removeEventListener("keydown", onKeyDown))
    })

    const toggleExpandedPlot = (id: ExpandedPlotId) => {
        setExpandedPlot(current => (current === id ? null : id))
    }

    return (
        <div class="w-full h-full flex flex-col lg:min-h-0">
            <section class="lg:h-full flex flex-col rounded-md bg-surface-container-low border border-outline-variant p-gutter-lg gap-gutter-lg lg:min-h-0">
                <Tabs
                    plotData={() => props.plotData}
                    isCalculating={() => props.isCalculating}
                    calculationError={() => props.calculationError}
                    hasValidationError={() => props.hasValidationError}
                    plotTheme={plotTheme}
                    stressHost={stressHost}
                    shearHost={shearHost}
                    momentHost={momentHost}
                    onApplyHistorySetup={props.onApplyHistorySetup}
                />
                <div class="lg:flex-1 lg:overflow-hidden lg:min-h-0 flex flex-col">
                    <UiTabs
                        defaultValue="stress"
                        value={activeTab()}
                        onValueChange={setActiveTab}
                        class="w-full lg:flex-1 lg:min-h-0 flex flex-col gap-gutter-md"
                    >
                        <TabsList class="grid w-full grid-cols-2 lg:inline-flex lg:w-fit mb-0">
                            <TabsTrigger value="stress" tone="secondary">
                                НДС и Моды
                            </TabsTrigger>
                            <TabsTrigger value="diagrams" tone="secondary">
                                Эпюры Q и M
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="stress"
                            class="flex flex-col gap-gutter-lg lg:min-h-0 lg:flex-1 mt-0 overflow-y-auto"
                        >
                            <Deflection
                                scene={scene}
                                data={plotData}
                                mode={solutionMode}
                                theme={plotTheme}
                                layoutConfig={layoutConfig}
                                expandedPlot={expandedPlot}
                                onToggleExpand={toggleExpandedPlot}
                                onHostReady={setStressHost}
                            />
                            <Modes
                                scene={scene}
                                data={plotData}
                                mode={solutionMode}
                                theme={plotTheme}
                                layoutConfig={layoutConfig}
                                expandedPlot={expandedPlot}
                                onToggleExpand={toggleExpandedPlot}
                                onHostReady={setModesHost}
                            />
                        </TabsContent>

                        <TabsContent
                            value="diagrams"
                            class="flex flex-col gap-gutter-lg lg:min-h-0 lg:flex-1 mt-0 overflow-y-auto"
                        >
                            <Shear
                                scene={scene}
                                data={plotData}
                                theme={plotTheme}
                                layoutConfig={layoutConfig}
                                expandedPlot={expandedPlot}
                                onToggleExpand={toggleExpandedPlot}
                                onHostReady={setShearHost}
                            />
                            <Moment
                                scene={scene}
                                data={plotData}
                                theme={plotTheme}
                                layoutConfig={layoutConfig}
                                expandedPlot={expandedPlot}
                                onToggleExpand={toggleExpandedPlot}
                                onHostReady={setMomentHost}
                            />
                        </TabsContent>
                    </UiTabs>
                </div>
            </section>
        </div>
    )
}

export default Plots
