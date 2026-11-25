import type { JSX } from "solid-js"
import { Button } from "~/ui/button"
import { Plus, Trash } from "~/ui/icons"

const ADD_SECTION_BUTTON_CLASS =
    "inline-flex items-center justify-center gap-gutter-xs px-gutter-md py-gutter-xs h-auto rounded-sm bg-secondary-container text-secondary-on-container hover:bg-primary hover:text-primary-foreground border-0 shadow-none transition-colors"

const DELETE_ICON_BUTTON_CLASS =
    "inline-flex items-center justify-center p-gutter-xs rounded-sm text-outline hover:bg-error-container hover:text-error-on-container transition-colors"

export const Delete = (props: {
    label: string
    onClick: () => void
}): JSX.Element => (
    <button
        type="button"
        class={DELETE_ICON_BUTTON_CLASS}
        aria-label={props.label}
        title={props.label}
        onClick={props.onClick}
    >
        <Trash class="size-5" />
    </button>
)

export const Add = (props: {
    label: string
    onClick: () => void
}): JSX.Element => (
    <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={props.onClick}
        class={ADD_SECTION_BUTTON_CLASS}
        title={props.label}
        aria-label={props.label}
    >
        <Plus class="size-5" />
        <span class="hidden lg:inline font-label text-label-md">
            {props.label}
        </span>
    </Button>
)
