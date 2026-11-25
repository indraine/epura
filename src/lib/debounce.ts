import { createEffect, createSignal, type Accessor } from "solid-js"

/**
 * Возвращает Accessor, который обновляется значением `source` с задержкой `wait` мс.
 * Falsy-значения (`null` / `undefined` / `false`) пробрасываются сразу, без ожидания.
 */
export const debounce = <T>(source: Accessor<T>, wait: number): Accessor<T> => {
    const [debounced, setDebounced] = createSignal(source())

    createEffect(() => {
        const next = source()
        if (next == null || next === false) {
            setDebounced(() => next)
            return
        }
        const timer = setTimeout(() => {
            setDebounced(() => next)
        }, wait)
        return () => clearTimeout(timer)
    })

    return debounced
}
