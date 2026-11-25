import { Field, type FormStore } from "@modular-forms/solid"
import { createMemo, type JSX } from "solid-js"
import { Button } from "~/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/card"
import { Checkbox } from "~/ui/checkbox"
import { Dialog } from "~/ui/dialog"
import { Calculator, Close, Glyph } from "~/ui/icons"
import { Select } from "~/ui/select"
import { Field as Input } from "~/ui/field"
import { DecimalField } from "~/ui/decimal-field"
import { Section } from "./Section"
import { useI18N } from "~/i18n"
import { setBeamLength } from "~/store/beam"
import type { BeamSetup, SectionCalculatorParams } from "~/core/types"
import {
    DEFAULT_AREA,
    DEFAULT_DENSITY,
    DEFAULT_INERTIA,
    DEFAULT_LENGTH,
    DEFAULT_SECTIONS,
    DEFAULT_SOLVER_METHOD,
    DEFAULT_YOUNG,
    MAX_QUALITY,
    MAX_SECTIONS,
} from "./transfer"

/**
 * Свойства секции основных параметров балки и диалога калькулятора сечения.
 * Размерности полей формы: L [мм], E [МПа], ρ [кг/мм³],
 * I [мм⁴], A [мм²].
 */
type ParamsProps = {
    form: FormStore<BeamSetup, undefined>
    open: boolean
    onOpenChange: (open: boolean) => void
    onOpenSectionCalculator: () => void
    inertia: () => number
    area: () => number
    params: () => SectionCalculatorParams | undefined
    onApply: (
        result: { inertia: number; area: number },
        params: SectionCalculatorParams
    ) => void
}

/**
 * Секция основных параметров балки и вызова калькулятора поперечного сечения.
 */
export const Params = (props: ParamsProps): JSX.Element => {
    const t = useI18N()

    return (
        <>
            <Card class="rounded-md bg-surface-container border border-outline-variant shadow-none shrink-0">
                <CardHeader class="px-gutter-lg py-gutter-md border-b border-outline-variant flex-row items-center justify-between space-y-0">
                    <CardTitle class="font-headline text-headline-sm text-on-surface">
                        {t("form.mainParams")}
                    </CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        class="text-xs sm:text-sm"
                        onClick={props.onOpenSectionCalculator}
                        title={t("form.sectionCalculator.title")}
                    >
                        <Calculator class="mr-2" />
                        {t("form.sectionCalculator.button")}
                    </Button>
                </CardHeader>
                <CardContent class="p-3 pt-0">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-3">
                        <Field of={props.form} name="sections" type="number">
                            {(field, props) => {
                                const sectionsError = createMemo(() => {
                                    const value = field.value
                                    if (
                                        value === undefined ||
                                        value === null ||
                                        typeof value !== "number" ||
                                        isNaN(value)
                                    ) {
                                        return t("form.requiredFieldError")
                                    }
                                    if (value < 1) {
                                        return t("form.sections.errorMin")
                                    }
                                    if (value > MAX_SECTIONS) {
                                        return t("form.sections.errorMax", {
                                            max: MAX_SECTIONS,
                                        })
                                    }
                                    return undefined
                                })

                                return (
                                    <Input
                                        {...props}
                                        type="number"
                                        label={t("form.sections.label")}
                                        value={String(
                                            field.value ?? DEFAULT_SECTIONS
                                        )}
                                        min={1}
                                        max={MAX_SECTIONS}
                                        compact
                                        error={sectionsError()}
                                    />
                                )
                            }}
                        </Field>

                        <Field of={props.form} name="length" type="number">
                            {(field, props) => {
                                const lengthError = createMemo(() => {
                                    const value = field.value
                                    if (
                                        value === undefined ||
                                        value === null ||
                                        typeof value !== "number" ||
                                        isNaN(value)
                                    ) {
                                        return t("form.requiredFieldError")
                                    }
                                    if (value <= 0) {
                                        return t("form.length.error")
                                    }
                                    return undefined
                                })

                                return (
                                    <DecimalField
                                        {...props}
                                        step="0.01"
                                        label={t("form.length.label")}
                                        value={
                                            field.value ?? DEFAULT_LENGTH
                                        }
                                        compact
                                        error={lengthError()}
                                        onValueChange={val => {
                                            setBeamLength(
                                                val ?? DEFAULT_LENGTH
                                            )
                                        }}
                                    />
                                )
                            }}
                        </Field>

                        <Field of={props.form} name="quality" type="number">
                            {(field, props) => {
                                const qualityError = createMemo(() => {
                                    const value = field.value
                                    if (
                                        value === undefined ||
                                        value === null ||
                                        typeof value !== "number" ||
                                        isNaN(value)
                                    ) {
                                        return t("form.requiredFieldError")
                                    }
                                    if (value < 1) {
                                        return t("form.quality.errorMin")
                                    }
                                    if (value > MAX_QUALITY) {
                                        return t("form.quality.errorMax", {
                                            max: MAX_QUALITY,
                                        })
                                    }
                                    return undefined
                                })

                                return (
                                    <Input
                                        {...props}
                                        type="number"
                                        label={t("form.quality.label")}
                                        value={String(field.value ?? 100)}
                                        min={1}
                                        max={MAX_QUALITY}
                                        compact
                                        error={qualityError()}
                                    />
                                )
                            }}
                        </Field>

                        {/* Скрытые поля для момента инерции и площади - значения управляются калькулятором */}
                        <Field of={props.form} name="inertia" type="number">
                            {(field, props) => {
                                // Скрытое поле - значение управляется калькулятором
                                return (
                                    <input
                                        {...props}
                                        type="hidden"
                                        value={field.value ?? DEFAULT_INERTIA}
                                    />
                                )
                            }}
                        </Field>

                        <Field of={props.form} name="area" type="number">
                            {(field, props) => {
                                // Скрытое поле - значение управляется калькулятором
                                return (
                                    <input
                                        {...props}
                                        type="hidden"
                                        value={field.value ?? DEFAULT_AREA}
                                    />
                                )
                            }}
                        </Field>

                        <Field of={props.form} name="young" type="number">
                            {(field, props) => {
                                const youngError = createMemo(() => {
                                    const value = field.value
                                    if (
                                        value === undefined ||
                                        value === null ||
                                        typeof value !== "number" ||
                                        isNaN(value)
                                    ) {
                                        return t("form.requiredFieldError")
                                    }
                                    if (value <= 0) {
                                        return t("form.young.error")
                                    }
                                    return undefined
                                })

                                return (
                                    <DecimalField
                                        {...props}
                                        step="1e9"
                                        label={t("form.young.label")}
                                        value={
                                            field.value ?? DEFAULT_YOUNG
                                        }
                                        compact
                                        error={youngError()}
                                    />
                                )
                            }}
                        </Field>

                        <Field of={props.form} name="density" type="number">
                            {(field, props) => {
                                const densityError = createMemo(() => {
                                    const value = field.value
                                    if (
                                        value === undefined ||
                                        value === null ||
                                        typeof value !== "number" ||
                                        isNaN(value)
                                    ) {
                                        return t("form.requiredFieldError")
                                    }
                                    if (value <= 0) {
                                        return t("form.density.error")
                                    }
                                    return undefined
                                })

                                return (
                                    <DecimalField
                                        {...props}
                                        step="1"
                                        label={t("form.density.label")}
                                        value={
                                            field.value ?? DEFAULT_DENSITY
                                        }
                                        compact
                                        error={densityError()}
                                    />
                                )
                            }}
                        </Field>

                        <Field of={props.form} name="solver_method">
                            {(field, props) => (
                                <Select
                                    {...props}
                                    label={t("form.solverMethod.label")}
                                    compact
                                    value={field.value ?? DEFAULT_SOLVER_METHOD}
                                    options={[
                                        {
                                            value: "cholesky",
                                            label: t(
                                                "form.solverMethod.options.cholesky"
                                            ),
                                        },
                                        {
                                            value: "lu",
                                            label: t(
                                                "form.solverMethod.options.lu"
                                            ),
                                        },
                                        {
                                            value: "qr",
                                            label: t(
                                                "form.solverMethod.options.qr"
                                            ),
                                        },
                                        {
                                            value: "sparselu",
                                            label: t(
                                                "form.solverMethod.options.sparselu"
                                            ),
                                        },
                                    ]}
                                />
                            )}
                        </Field>

                        <div class="sm:col-span-2 lg:col-span-3 flex items-center">
                            <Field of={props.form} name="bind" type="boolean">
                                {(field, props) => (
                                    <Checkbox
                                        {...props}
                                        checked={field.value ?? false}
                                        label={t("form.bind.label")}
                                        class="shrink-0"
                                    />
                                )}
                            </Field>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog.Root
                open={props.open}
                onOpenChange={props.onOpenChange}
                modal={true}
            >
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content class="lg:max-w-3xl lg:h-[min(90vh,580px)] flex flex-col gap-0 p-0 overflow-hidden lg:rounded-lg">
                        <Dialog.Header class="flex-shrink-0 px-gutter-lg py-gutter-md border-b border-outline-variant bg-surface-container flex flex-row items-center justify-between gap-gutter-md space-y-0 text-left">
                            <div class="flex items-center gap-gutter-md min-w-0">
                                <div class="w-9 h-9 rounded bg-secondary-container flex items-center justify-center shrink-0 text-secondary-on-container">
                                    <Glyph class="size-5" />
                                </div>
                                <div class="flex flex-col min-w-0">
                                    <Dialog.Title class="font-headline text-headline-md text-on-surface truncate">
                                        {t("form.sectionCalculator.title")}
                                    </Dialog.Title>
                                    <Dialog.Description class="text-xs sm:text-sm text-outline truncate">
                                        {t("form.sectionCalculator.subtitle")}
                                    </Dialog.Description>
                                </div>
                            </div>
                            <Dialog.Close>
                                <button
                                    type="button"
                                    class="inline-flex items-center justify-center p-gutter-sm rounded-sm text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors"
                                    aria-label={t("form.close")}
                                    title={t("form.close")}
                                >
                                    <Close class="size-5" />
                                </button>
                            </Dialog.Close>
                        </Dialog.Header>
                        <div class="flex-1 min-h-0 overflow-hidden px-gutter-lg sm:px-gutter-xl py-gutter-md sm:py-gutter-lg flex flex-col">
                            <Section
                                initialInertia={props.inertia()}
                                initialArea={props.area()}
                                initialParams={props.params()}
                                onCancel={() => props.onOpenChange(false)}
                                onApply={(result, params) => {
                                    props.onApply(result, params)
                                }}
                            />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    )
}
