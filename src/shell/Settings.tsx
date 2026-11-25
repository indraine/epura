import { createSignal } from "solid-js"
import { Popover } from "@kobalte/core"
import { Button } from "../ui/button"
import { useI18N } from "~/i18n"

type CalculationMode = "auto" | "manual"

const STORAGE_KEY = "beam-calculation-mode"

interface SettingsToggleProps {
    mode: () => CalculationMode
    onModeChange: (mode: CalculationMode) => void
}

const Settings = (props: SettingsToggleProps) => {
    const [isOpen, setIsOpen] = createSignal(false)
    const t = useI18N()

    return (
        <Popover.Root open={isOpen()} onOpenChange={setIsOpen} modal={false}>
            <Popover.Trigger as="button" class="outline-none">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={t("settings.title")}
                    aria-label={t("settings.title")}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </Button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content class="z-50 w-80 rounded-md border border-outline-variant bg-surface-container-low p-4 text-on-surface shadow-none outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
                    <Popover.Arrow />
                    <div class="space-y-4">
                        <h3 class="font-headline font-semibold text-lg text-on-surface">
                            {t("settings.title")}
                        </h3>
                        <div class="space-y-2">
                            <label class="text-sm font-medium font-body text-on-surface-variant">
                                {t("settings.mode.label")}
                            </label>
                            <div class="flex gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        props.mode() === "auto"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    class="flex-1"
                                    onClick={() => props.onModeChange("auto")}
                                >
                                    {t("settings.mode.auto")}
                                </Button>
                                <Button
                                    type="button"
                                    variant={
                                        props.mode() === "manual"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    class="flex-1"
                                    onClick={() => props.onModeChange("manual")}
                                >
                                    {t("settings.mode.manual")}
                                </Button>
                            </div>
                            <p class="text-xs text-muted-foreground">
                                {props.mode() === "auto"
                                    ? t("settings.mode.autoDescription")
                                    : t("settings.mode.manualDescription")}
                            </p>
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

export default Settings
// Функция для загрузки режима из localStorage
export const loadCalculationMode = (): CalculationMode => {
    if (typeof window === "undefined") return "auto"
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === "auto" || stored === "manual" ? stored : "auto"
}

// Функция для сохранения режима в localStorage
export const saveCalculationMode = (mode: CalculationMode): void => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, mode)
}
