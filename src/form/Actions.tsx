import { Show, type JSX } from "solid-js"
import { Button } from "~/ui/button"
import { CardHeader, CardTitle } from "~/ui/card"
import { Download, Upload } from "~/ui/icons"
import { useI18N } from "~/i18n"

type ActionsProps = {
    onExport: () => void
    onImportFile: (file: File) => void
    calculationMode: () => "auto" | "manual"
    onManualCalculate?: () => void
    isCalculating: boolean
    isInputInvalid: boolean
}

/**
 * Панель действий формы: экспорт и импорт конфигурации;
 * в ручном режиме — кнопка расчёта (недоступна при выполнении расчёта
 * или при недопустимом вводе).
 */
export const Actions = (props: ActionsProps): JSX.Element => {
    const t = useI18N()
    let importFileInputRef: HTMLInputElement | undefined

    const handleFileSelect = (event: Event) => {
        const input = event.target as HTMLInputElement
        const file = input.files?.[0]
        if (file) {
            props.onImportFile(file)
            input.value = ""
        }
    }

    const handleImportClick = () => {
        importFileInputRef?.click()
    }

    return (
        <CardHeader class="flex-shrink-0 px-gutter-lg pt-gutter-lg pb-gutter-sm">
            <div class="flex items-center justify-between gap-gutter-sm flex-wrap">
                <CardTitle class="font-headline text-headline-md text-on-surface">
                    Параметры балки
                </CardTitle>
                <div class="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        class="cursor-pointer bg-surface-container-high border-outline-variant"
                        onClick={props.onExport}
                        title={t("form.exportTitle")}
                        aria-label={t("form.exportTitle")}
                    >
                        <Download class="h-4 w-4" />
                        <span class="hidden lg:inline">
                            {t("form.exportButton")}
                        </span>
                    </Button>
                    <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileSelect}
                        ref={el => {
                            importFileInputRef = el
                        }}
                        class="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        class="cursor-pointer bg-surface-container-high border-outline-variant"
                        title={t("form.importTitle")}
                        aria-label={t("form.importTitle")}
                        onClick={handleImportClick}
                    >
                        <Upload class="h-4 w-4" />
                        <span class="hidden lg:inline">
                            {t("form.importButton")}
                        </span>
                    </Button>
                    <Show when={props.calculationMode() === "manual"}>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            class="cursor-pointer text-xs sm:text-sm"
                            onClick={() => props.onManualCalculate?.()}
                            disabled={
                                props.isCalculating || props.isInputInvalid
                            }
                        >
                            {t("form.calculateButton")}
                        </Button>
                    </Show>
                </div>
            </div>
        </CardHeader>
    )
}
