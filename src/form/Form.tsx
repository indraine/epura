import { createForm, getValues, setValues } from "@modular-forms/solid"
import {
    createSignal,
    createEffect,
    onMount,
    createMemo,
    Show,
    type JSX,
} from "solid-js"
import { getAllCalculations } from "../core/db"
import type {
    BeamSetup,
    PlotData,
    SectionCalculatorParams,
} from "../core/types"
import { createSolver } from "../core/solver"
import {
    setBeamLength,
    setBeamSections,
    setBindEnabled,
    addBoundaryCondition as addBoundaryConditionToStore,
    addPointLoad as addPointLoadToStore,
    addDistributedLoad as addDistributedLoadToStore,
} from "../store/beam"
import { Alert } from "~/ui/alert"
import { Card, CardContent } from "~/ui/card"
import { useI18N } from "~/i18n"
import { Params } from "./Params"
import { Supports } from "./Supports"
import { Loads } from "./Loads"
import { Actions } from "./Actions"
import { Drop } from "./Drop"
import { Forces } from "./Forces"
import { isInvalid, type FormScalars } from "./validate"
import {
    DEFAULT_AREA,
    DEFAULT_DENSITY,
    DEFAULT_INERTIA,
    DEFAULT_LENGTH,
    DEFAULT_QUALITY,
    DEFAULT_SECTIONS,
    DEFAULT_SOLVER_METHOD,
    DEFAULT_YOUNG,
    applyDefaultLengthBind,
    applyRestoredSetup,
    createJsonDragDrop,
    exportBeamConfigFromValues,
    importBeamConfigJson,
    loadsAccordionGridClass,
} from "./transfer"

/**
 * Свойства корневой формы параметров балки.
 * Режим пересчёта и импульс ручного запуска допускают как константу,
 * так и реактивный доступ.
 */
type FormProps = {
    onCalculate?: (data: PlotData | null) => void
    onCalculatingChange?: (isCalculating: boolean) => void
    calculationMode?: (() => "auto" | "manual") | "auto" | "manual"
    /** Передний фронт сигнала запуска при ручном режиме пересчёта. */
    triggerCalculation?: (() => boolean) | boolean
    onManualCalculate?: () => void
    onCalculationError?: (error: string | null) => void
    onValidationError?: (hasError: boolean) => void
    /**
     * Передаёт наружу процедуру применения конфигурации из истории:
     * подставляет параметры в форму и запускает расчёт.
     */
    onProvideApplySetup?: (apply: (setup: BeamSetup) => void) => void
}

type LoadsAccordionId = "bc" | "point" | "distributed"

/**
 * Корневая форма: параметры балки, граничные условия и нагрузки,
 * связь с решателем, импорт и экспорт конфигурации.
 * Дочерние секции монтируются после готовности решателя;
 * недопустимый ввод сообщается через `onValidationError`.
 */
const Form = (props: FormProps): JSX.Element => {
    const t = useI18N()
    const [isLoading, setIsLoading] = createSignal(true)
    const [solverReady, setSolverReady] = createSignal(false)
    const [isDragOver, setIsDragOver] = createSignal(false)

    const [_form, { Form: FormEl }] = createForm<BeamSetup>({
        initialValues: {
            sections: DEFAULT_SECTIONS,
            length: DEFAULT_LENGTH,
            quality: DEFAULT_QUALITY,
            inertia: DEFAULT_INERTIA,
            young: DEFAULT_YOUNG,
            density: DEFAULT_DENSITY,
            area: DEFAULT_AREA,
            bind: false,
            solver_method: DEFAULT_SOLVER_METHOD,
        },
    })

    const [sectionCalculatorInertia, setSectionCalculatorInertia] =
        createSignal(DEFAULT_INERTIA)
    const [sectionCalculatorArea, setSectionCalculatorArea] =
        createSignal(DEFAULT_AREA)
    const [sectionCalculatorParams, setSectionCalculatorParams] = createSignal<
        SectionCalculatorParams | undefined
    >(undefined)
    const [isSectionCalculatorOpen, setIsSectionCalculatorOpen] =
        createSignal(false)
    const [openLoadsAccordion, setOpenLoadsAccordion] =
        createSignal<LoadsAccordionId | null>("bc")
    const [appAlert, setAppAlert] = createSignal<{
        title: string
        description: string
    } | null>(null)

    const showAppAlert = (title: string, description: string) => {
        setAppAlert({ title, description })
    }

    const importExportDeps = {
        form: _form,
        setSectionCalculatorInertia,
        setSectionCalculatorArea,
        setSectionCalculatorParams,
        showAppAlert,
    }

    const calculationMode = createMemo(() =>
        typeof props.calculationMode === "function"
            ? props.calculationMode()
            : (props.calculationMode ?? "auto")
    )
    const manualTrigger = createMemo(() =>
        typeof props.triggerCalculation === "function"
            ? props.triggerCalculation()
            : (props.triggerCalculation ?? false)
    )

    const readFormScalars = (): FormScalars => {
        const v = getValues(_form)
        return {
            sections: v.sections ?? DEFAULT_SECTIONS,
            length: v.length ?? DEFAULT_LENGTH,
            quality: v.quality ?? DEFAULT_QUALITY,
            inertia: v.inertia ?? DEFAULT_INERTIA,
            young: v.young ?? DEFAULT_YOUNG,
            density: v.density ?? DEFAULT_DENSITY,
            area: v.area ?? DEFAULT_AREA,
            bind: v.bind ?? false,
            solver_method: v.solver_method || DEFAULT_SOLVER_METHOD,
            section_calculator: sectionCalculatorParams(),
        }
    }

    const solver = createSolver({
        getScalars: readFormScalars,
        ready: solverReady,
        mode: calculationMode,
        manualTrigger,
    })

    createEffect(() => props.onCalculatingChange?.(solver.result.loading))
    createEffect(() => {
        const err = solver.result.error
        props.onCalculationError?.(
            err == null
                ? null
                : err instanceof Error
                  ? err.message
                  : String(err)
        )
    })
    createEffect(() => {
        const pending = solver.result.loading
        const failed = solver.result.error
        if (pending || failed) {
            props.onCalculate?.(null)
            return
        }
        props.onCalculate?.(solver.result.latest ?? null)
    })

    onMount(async () => {
        const lastRecord = await solver.restoreLast()
        if (lastRecord?.setup) {
            applyRestoredSetup(lastRecord.setup, importExportDeps)
        } else {
            await getAllCalculations()
            applyDefaultLengthBind(getValues(_form))
        }
        setSolverReady(true)
        setIsLoading(false)
        props.onProvideApplySetup?.(setup => {
            applyRestoredSetup(setup, importExportDeps)
            queueMicrotask(() => solver.rerun())
        })
    })

    createEffect(() => {
        props.onValidationError?.(isInvalid(readFormScalars()))
    })

    createEffect(() => {
        const v = getValues(_form)
        if (v.length !== undefined) setBeamLength(v.length)
        if (v.sections !== undefined) setBeamSections(v.sections)
        if (v.bind !== undefined) setBindEnabled(v.bind)
    })

    const handleExport = () =>
        exportBeamConfigFromValues(getValues(_form), sectionCalculatorParams())
    const handleImportFile = (file: File) => {
        void importBeamConfigJson(file, importExportDeps)
    }

    const dragDrop = createJsonDragDrop({
        setDragOver: setIsDragOver,
        onFile: handleImportFile,
        onInvalidType: () =>
            showAppAlert("Ошибка импорта", "Пожалуйста, выберите JSON файл"),
    })

    const openSection = (id: LoadsAccordionId) => setOpenLoadsAccordion(id)
    const toggleSection = (id: LoadsAccordionId) =>
        setOpenLoadsAccordion(current => (current === id ? null : id))

    return (
        <Show
            when={!isLoading()}
            fallback={
                <div class="w-full h-full flex items-center justify-center">
                    <div class="text-outline">Загрузка...</div>
                </div>
            }
        >
            <div
                class="w-full h-full min-h-0 flex flex-col"
                onDragEnter={dragDrop.handleDragEnter}
                onDragOver={dragDrop.handleDragOver}
                onDragLeave={dragDrop.handleDragLeave}
                onDrop={dragDrop.handleDrop}
            >
                <Card class="lg:h-full lg:min-h-0 flex flex-col relative rounded-md bg-surface-container-low border border-outline-variant shadow-none overflow-hidden">
                    <Show when={isDragOver()}>
                        <Drop />
                    </Show>
                    <Actions
                        onExport={handleExport}
                        onImportFile={handleImportFile}
                        calculationMode={calculationMode}
                        onManualCalculate={props.onManualCalculate}
                        isCalculating={solver.result.loading}
                        isInputInvalid={isInvalid(readFormScalars())}
                    />
                    <FormEl class="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <CardContent
                            class={`lg:flex-1 lg:min-h-0 lg:overflow-hidden flex flex-col px-gutter-lg pb-gutter-lg ${
                                isDragOver() ? "pointer-events-none" : ""
                            }`}
                        >
                            <div class="flex flex-col gap-gutter-lg lg:flex-1 lg:min-h-0 lg:overflow-hidden">
                                <Params
                                    form={_form}
                                    open={isSectionCalculatorOpen()}
                                    onOpenChange={setIsSectionCalculatorOpen}
                                    onOpenSectionCalculator={() =>
                                        setIsSectionCalculatorOpen(true)
                                    }
                                    inertia={sectionCalculatorInertia}
                                    area={sectionCalculatorArea}
                                    params={sectionCalculatorParams}
                                    onApply={(result, params) => {
                                        setValues(_form, {
                                            inertia: result.inertia,
                                            area: result.area,
                                        })
                                        setSectionCalculatorInertia(
                                            result.inertia
                                        )
                                        setSectionCalculatorArea(result.area)
                                        setSectionCalculatorParams(params)
                                        setIsSectionCalculatorOpen(false)
                                    }}
                                />
                                <div
                                    class={loadsAccordionGridClass(
                                        openLoadsAccordion()
                                    )}
                                >
                                    <Supports
                                        open={openLoadsAccordion() === "bc"}
                                        onToggle={() => toggleSection("bc")}
                                        onAdd={() => {
                                            openSection("bc")
                                            addBoundaryConditionToStore()
                                        }}
                                    />
                                    <Forces
                                        open={openLoadsAccordion() === "point"}
                                        onToggle={() => toggleSection("point")}
                                        onAdd={() => {
                                            openSection("point")
                                            addPointLoadToStore()
                                        }}
                                    />
                                    <Loads
                                        open={
                                            openLoadsAccordion() ===
                                            "distributed"
                                        }
                                        onToggle={() =>
                                            toggleSection("distributed")
                                        }
                                        onAdd={() => {
                                            openSection("distributed")
                                            addDistributedLoadToStore()
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </FormEl>
                </Card>
                <Alert
                    open={appAlert() !== null}
                    onOpenChange={open => {
                        if (!open) setAppAlert(null)
                    }}
                    title={appAlert()?.title ?? ""}
                    description={appAlert()?.description ?? ""}
                    confirmLabel={t("form.close")}
                />
            </div>
        </Show>
    )
}

export default Form
