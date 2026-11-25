import type { JSX } from "solid-js"
import { Upload } from "~/ui/icons"

export const Drop = (): JSX.Element => (
    <div class="absolute inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg">
        <div class="text-center p-8 bg-surface-container-low/95 rounded-lg border border-outline-variant">
            <Upload class="h-16 w-16 mx-auto mb-4 text-primary" />
            <p class="text-lg font-semibold text-foreground">
                Отпустите файл для импорта
            </p>
            <p class="text-sm text-outline mt-2">
                JSON файл с параметрами балки
            </p>
        </div>
    </div>
)
