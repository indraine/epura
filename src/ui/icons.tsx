import type { JSX } from "solid-js"

type IconProps = {
    class?: string
}

export const Trash = (props: IconProps): JSX.Element => (
    <svg
        viewBox="0 0 24 24"
        class={props.class ?? "size-5"}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
    </svg>
)

export const Plus = (props: IconProps): JSX.Element => (
    <svg
        viewBox="0 0 24 24"
        class={props.class ?? "size-5"}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
    >
        <path d="M12 5v14M5 12h14" />
    </svg>
)

export const Chevron = (props: IconProps): JSX.Element => (
    <svg
        viewBox="0 0 24 24"
        class={props.class ?? "size-4"}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
    >
        <path d="M9 6l6 6-6 6" />
    </svg>
)

export const Upload = (props: IconProps): JSX.Element => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={props.class}
        aria-hidden="true"
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
)

export const Download = (props: IconProps): JSX.Element => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={props.class}
        aria-hidden="true"
    >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
)

export const Calculator = (props: IconProps): JSX.Element => (
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
        class={props.class}
        aria-hidden="true"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M9 7h6m-6 4h6m-2 4h2M9 15h2" />
    </svg>
)

export const Glyph = (props: IconProps): JSX.Element => (
    <svg
        viewBox="0 0 24 24"
        class={props.class ?? "size-5"}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
    >
        <rect x="5" y="5" width="14" height="14" rx="1" />
    </svg>
)

export const Close = (props: IconProps): JSX.Element => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={props.class ?? "size-5"}
        aria-hidden="true"
    >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)
