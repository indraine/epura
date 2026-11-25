import {
    createEffect,
    createSignal,
    splitProps,
    type Component,
    type JSX,
} from "solid-js"
import { Field, type FieldProps } from "~/ui/field"
import {
    adaptiveDecimalStep,
    formatDecimalValue,
    isAllowedDecimalInput,
    isCompleteDecimal,
    resolveDecimalStep,
    sanitizeDecimalRaw,
    stepDecimalValue,
} from "~/lib/decimal"

export type DecimalFieldProps = Omit<FieldProps, "type" | "value" | "onInput"> & {
    value: number | string | null | undefined
    /** Вызывается при завершённом числе; `undefined` — пустое поле. */
    onValueChange?: (value: number | undefined) => void
    /** Совместимость с @modular-forms/solid и прочими onInput-обработчиками. */
    onInput?: JSX.InputEventHandler<HTMLInputElement, InputEvent>
}

const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() !== "") {
        const n = Number(value)
        if (Number.isFinite(n)) return n
    }
    return undefined
}

/**
 * Числовое поле с локальным черновиком строки.
 * Запятая запрещена; промежуточный ввод ("0.", "") не схлопывается в 0.
 * Колесо и стрелки ↑/↓ при фокусе меняют значение адаптивным шагом
 * (на порядок меньше |value|; при 0 — атрибут `step`).
 */
const DecimalField: Component<DecimalFieldProps> = props => {
    const [local, rest] = splitProps(props, [
        "value",
        "onValueChange",
        "onInput",
        "onFocus",
        "onBlur",
        "onBeforeInput",
        "onWheel",
        "onKeyDown",
        "step",
        "min",
        "max",
    ])

    const [draft, setDraft] = createSignal(formatDecimalValue(local.value))
    const [focused, setFocused] = createSignal(false)

    createEffect(() => {
        if (!focused()) {
            setDraft(formatDecimalValue(local.value))
        }
    })

    const notify = (
        raw: string,
        el: HTMLInputElement,
        event: Event
    ) => {
        el.value = raw
        let numeric: number
        if (raw === "") {
            local.onValueChange?.(undefined)
            numeric = Number.NaN
        } else if (isCompleteDecimal(raw)) {
            numeric = Number(raw)
            local.onValueChange?.(numeric)
        } else {
            return
        }
        // @modular-forms/solid Field type="number" читает valueAsNumber;
        // у input type="text" нативное valueAsNumber всегда NaN.
        Object.defineProperty(el, "valueAsNumber", {
            configurable: true,
            enumerable: true,
            get: () => numeric,
        })
        local.onInput?.(event as InputEvent & {
            currentTarget: HTMLInputElement
            target: HTMLInputElement
        })
    }

    const currentNumeric = (): number => {
        const fromDraft = toFiniteNumber(sanitizeDecimalRaw(draft()))
        if (fromDraft !== undefined) return fromDraft
        const fromValue = toFiniteNumber(local.value)
        return fromValue ?? 0
    }

    const applyStep = (
        el: HTMLInputElement,
        direction: 1 | -1,
        event: Event
    ) => {
        if (el.disabled || el.readOnly) return
        const current = currentNumeric()
        const next = stepDecimalValue(
            current,
            adaptiveDecimalStep(current, resolveDecimalStep(local.step)),
            direction,
            {
                min: toFiniteNumber(local.min),
                max: toFiniteNumber(local.max),
            }
        )
        const text = String(next)
        setDraft(text)
        notify(text, el, event)
    }

    const handleBeforeInput: JSX.InputEventHandler<
        HTMLInputElement,
        InputEvent
    > = e => {
        if (e.data?.includes(",")) {
            e.preventDefault()
        }
        const onBeforeInput = local.onBeforeInput
        if (typeof onBeforeInput === "function") {
            onBeforeInput(e)
        }
    }

    const handleInput: JSX.InputEventHandler<
        HTMLInputElement,
        InputEvent
    > = e => {
        const cleaned = sanitizeDecimalRaw(e.currentTarget.value)
        if (!isAllowedDecimalInput(cleaned)) {
            e.currentTarget.value = draft()
            return
        }
        if (cleaned !== e.currentTarget.value) {
            e.currentTarget.value = cleaned
        }
        setDraft(cleaned)
        if (isCompleteDecimal(cleaned)) {
            notify(cleaned, e.currentTarget, e)
        }
    }

    const handleFocus: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = e => {
        setFocused(true)
        setDraft(formatDecimalValue(local.value))
        if (typeof local.onFocus === "function") {
            local.onFocus(e)
        }
    }

    const handleBlur: JSX.FocusEventHandler<HTMLInputElement, FocusEvent> = e => {
        setFocused(false)
        let raw = sanitizeDecimalRaw(draft())
        if (raw.endsWith(".")) {
            raw = raw.slice(0, -1)
        }
        if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
            setDraft("")
            notify("", e.currentTarget, e)
        } else if (Number.isFinite(Number(raw))) {
            const text = String(Number(raw))
            setDraft(text)
            notify(text, e.currentTarget, e)
        } else {
            setDraft(formatDecimalValue(local.value))
        }
        if (typeof local.onBlur === "function") {
            local.onBlur(e)
        }
    }

    const handleWheel: JSX.EventHandler<HTMLInputElement, WheelEvent> = e => {
        if (typeof local.onWheel === "function") {
            local.onWheel(e)
        }
        if (e.defaultPrevented) return
        if (!focused()) return

        e.preventDefault()
        applyStep(e.currentTarget, e.deltaY < 0 ? 1 : -1, e)
    }

    const handleKeyDown: JSX.EventHandler<HTMLInputElement, KeyboardEvent> = e => {
        if (typeof local.onKeyDown === "function") {
            local.onKeyDown(e)
        }
        if (e.defaultPrevented) return
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return
        if (e.altKey || e.ctrlKey || e.metaKey) return

        e.preventDefault()
        applyStep(e.currentTarget, e.key === "ArrowUp" ? 1 : -1, e)
    }

    return (
        <Field
            {...rest}
            type="text"
            inputMode="decimal"
            autocomplete="off"
            step={local.step}
            min={local.min}
            max={local.max}
            value={focused() ? draft() : formatDecimalValue(local.value)}
            onBeforeInput={handleBeforeInput}
            onInput={handleInput}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onWheel={handleWheel}
            onKeyDown={handleKeyDown}
        />
    )
}

export { DecimalField }
