import { createEffect, createSignal, onMount } from "solid-js"
import {
    ColorModeProvider,
    ColorModeScript,
    createLocalStorageManager,
    useColorMode,
} from "@kobalte/core"
import Form from "./form/Form"
import Plots from "./plots/Plots"
import Theme from "./shell/Theme"
import Settings, {
    loadCalculationMode,
    saveCalculationMode,
} from "./shell/Settings"
import About from "./shell/About"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import type { BeamSetup, PlotData } from "./core/types"
import bernLogoLight from "./assets/bern-light.png"
import bernLogoDark from "./assets/bern-dark.png"
import { I18NContextProvider, useI18N } from "./i18n"
import { cn } from "./lib/cn"

type CalculationMode = "auto" | "manual"
type MobileWorkspace = "params" | "results"

const App = () => {
    const [plotData, setPlotData] = createSignal<PlotData | null>(null)
    const [isCalculating, setIsCalculating] = createSignal<boolean>(false)
    const [calculationMode, setCalculationMode] =
        createSignal<CalculationMode>("auto")
    const [triggerCalculation, setTriggerCalculation] =
        createSignal<boolean>(false)
    const [calculationError, setCalculationError] = createSignal<string | null>(
        null
    )
    const [hasValidationError, setHasValidationError] =
        createSignal<boolean>(false)
    const [applyHistorySetup, setApplyHistorySetup] = createSignal<
        ((setup: BeamSetup) => void) | null
    >(null)
    // Mobile mockup: Results is the default workspace tab
    const [mobileWorkspace, setMobileWorkspace] =
        createSignal<MobileWorkspace>("results")
    const storageManager = createLocalStorageManager("beam-ui-theme")

    onMount(() => {
        setCalculationMode(loadCalculationMode())
    })

    // When returning to Results on a narrow viewport, force Plotly to remeasure
    createEffect(() => {
        if (mobileWorkspace() !== "results") return
        if (typeof window === "undefined") return

        let rafOuter = 0
        let rafInner = 0
        rafOuter = requestAnimationFrame(() => {
            rafInner = requestAnimationFrame(() => {
                window.dispatchEvent(new Event("resize"))
            })
        })

        return () => {
            cancelAnimationFrame(rafOuter)
            cancelAnimationFrame(rafInner)
        }
    })

    const handleModeChange = (mode: CalculationMode) => {
        setCalculationMode(mode)
        saveCalculationMode(mode)
    }

    const handleManualCalculate = () => {
        setTriggerCalculation(false)
        setTriggerCalculation(true)
    }

    const handleWorkspaceChange = (value: string) => {
        if (value === "params" || value === "results") {
            setMobileWorkspace(value)
        }
    }

    return (
        <>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
                <I18NContextProvider>
                    <div class="min-h-screen lg:h-screen bg-surface lg:overflow-hidden flex flex-col">
                        <header class="flex-shrink-0 bg-surface-container-low border-b border-outline-variant px-gutter-lg lg:px-gutter-xl py-gutter-md">
                            <div class="max-w-[1520px] mx-auto flex items-center justify-between gap-gutter-sm">
                                <div class="flex items-center gap-gutter-sm min-w-0 flex-1">
                                    <BrandLogo />
                                    <AppTitle />
                                </div>
                                <nav
                                    aria-label="Служебные действия"
                                    class="flex items-center gap-gutter-xs shrink-0"
                                >
                                    <About />
                                    <Settings
                                        mode={calculationMode}
                                        onModeChange={handleModeChange}
                                    />
                                    <Theme />
                                </nav>
                            </div>
                        </header>
                        <main class="flex-1 w-full max-w-[1520px] mx-auto p-gutter-lg lg:p-gutter-xl lg:min-h-0 lg:overflow-hidden flex flex-col gap-gutter-lg">
                            <MobileWorkspaceTabs
                                value={mobileWorkspace()}
                                onValueChange={handleWorkspaceChange}
                            />
                            <div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg lg:gap-gutter-xl items-start lg:items-stretch lg:h-full lg:min-h-0 lg:flex-1">
                                <div
                                    class={cn(
                                        "lg:col-span-5 lg:min-h-0 lg:h-full lg:overflow-hidden flex flex-col",
                                        mobileWorkspace() !== "params" &&
                                            "hidden lg:block"
                                    )}
                                >
                                    <Form
                                        onCalculate={setPlotData}
                                        onCalculatingChange={setIsCalculating}
                                        calculationMode={calculationMode}
                                        triggerCalculation={triggerCalculation}
                                        onManualCalculate={
                                            handleManualCalculate
                                        }
                                        onCalculationError={setCalculationError}
                                        onValidationError={
                                            setHasValidationError
                                        }
                                        onProvideApplySetup={apply =>
                                            setApplyHistorySetup(() => apply)
                                        }
                                    />
                                </div>
                                <div
                                    class={cn(
                                        "lg:col-span-7 lg:min-h-0 lg:h-full lg:overflow-hidden flex flex-col",
                                        mobileWorkspace() !== "results" &&
                                            "hidden lg:block"
                                    )}
                                >
                                    <Plots
                                        plotData={plotData()}
                                        isCalculating={isCalculating()}
                                        calculationError={calculationError()}
                                        hasValidationError={hasValidationError()}
                                        onApplyHistorySetup={setup =>
                                            applyHistorySetup()?.(setup)
                                        }
                                    />
                                </div>
                            </div>
                        </main>
                    </div>
                </I18NContextProvider>
            </ColorModeProvider>
        </>
    )
}

const MobileWorkspaceTabs = (props: {
    value: MobileWorkspace
    onValueChange: (value: string) => void
}) => {
    const t = useI18N()
    return (
        <div class="lg:hidden shrink-0">
            <Tabs
                value={props.value}
                onValueChange={props.onValueChange}
                class="w-full"
            >
                <TabsList
                    aria-label={t("app.workspaceTabsLabel")}
                    class="grid w-full grid-cols-2 gap-gutter-xs"
                >
                    <TabsTrigger value="params">
                        <svg
                            viewBox="0 0 24 24"
                            class="size-[15px] shrink-0"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                        >
                            <line x1="4" y1="21" x2="4" y2="14" />
                            <line x1="4" y1="10" x2="4" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12" y2="3" />
                            <line x1="20" y1="21" x2="20" y2="16" />
                            <line x1="20" y1="12" x2="20" y2="3" />
                            <line x1="1" y1="14" x2="7" y2="14" />
                            <line x1="9" y1="8" x2="15" y2="8" />
                            <line x1="17" y1="16" x2="23" y2="16" />
                        </svg>
                        {t("app.workspaceParams")}
                    </TabsTrigger>
                    <TabsTrigger value="results">
                        <svg
                            viewBox="0 0 24 24"
                            class="size-[15px] shrink-0"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            aria-hidden="true"
                        >
                            <path d="M3 3v18h18" />
                            <path d="M7 14l4-4 4 4 5-6" />
                        </svg>
                        {t("app.workspaceResults")}
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    )
}

const BrandLogo = () => {
    const { colorMode } = useColorMode()
    const src = () => (colorMode() === "dark" ? bernLogoDark : bernLogoLight)

    return (
        <div class="size-10 shrink-0 overflow-hidden rounded-[22%]">
            <img
                src={src()}
                alt="Logo"
                class="size-full scale-[1.65] object-cover origin-center"
            />
        </div>
    )
}

const AppTitle = () => {
    const t = useI18N()
    return (
        <div class="flex flex-col min-w-0 flex-1">
            <h1 class="font-headline text-headline-sm lg:text-headline-md text-on-surface truncate">
                {t("app.title")}
            </h1>
            <span class="font-body text-body-sm text-outline truncate">
                <span class="lg:hidden">{t("app.subtitleShort")}</span>
                <span class="hidden lg:inline">{t("app.subtitle")}</span>
            </span>
        </div>
    )
}

export default App
