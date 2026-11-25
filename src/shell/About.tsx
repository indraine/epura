import { createSignal, For } from "solid-js"
import { Dialog } from "../ui/dialog"
import { Button } from "../ui/button"
import { useI18N } from "~/i18n"

const About = () => {
    const [isOpen, setIsOpen] = createSignal(false)
    const t = useI18N()

    return (
        <Dialog.Root open={isOpen()} onOpenChange={setIsOpen}>
            <Dialog.Trigger as="button" class="outline-none">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title={t("about.buttonTitle")}
                    aria-label={t("about.buttonTitle")}
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
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4" />
                        <path d="M12 8h.01" />
                    </svg>
                </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content class="max-lg:p-gutter-lg lg:max-w-md">
                    <Dialog.Header class="relative flex-shrink-0">
                        <Dialog.Close class="absolute right-0 top-0 z-10">
                            <button
                                type="button"
                                class="inline-flex items-center justify-center p-gutter-sm rounded-sm text-outline hover:bg-surface-container-high hover:text-on-surface transition-colors"
                                aria-label={t("about.close")}
                                title={t("about.close")}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="h-4 w-4"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </Dialog.Close>
                        <Dialog.Title class="font-headline text-on-surface">
                            {t("about.title")}
                        </Dialog.Title>
                        <Dialog.Description class="space-y-3 !mt-6 text-on-surface-variant font-body">
                            <For each={t("about.description")}>
                                {paragraph => (
                                    <p class="indent-8">{paragraph}</p>
                                )}
                            </For>
                        </Dialog.Description>
                    </Dialog.Header>
                    <div class="flex flex-col gap-4 py-4">
                        <div class="flex items-center justify-end gap-2 text-sm">
                            <span class="font-medium">{t("about.author")}</span>
                            <a
                                href="https://github.com/indraine"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="text-primary hover:underline flex items-center gap-1"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                    <path d="M9 18c-4.51 2-5-2-7-2" />
                                </svg>
                                <span>indraine</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="opacity-70"
                                >
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default About
