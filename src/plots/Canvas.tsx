/**
 * Контейнер диаграммы и жизненный цикл её отрисовки.
 *
 * При наличии серий, макета и признака активности выполняется обновление
 * или первичное построение; при отключении или отсутствии данных —
 * очистка экземпляра. Изменение размеров отслеживается наблюдателем
 * и отложенными вызовами пересчёта габаритов. Выгрузка в растровый формат
 * выполняется с удвоением разрешения при наименьшем размере 400× 600 [пкс].
 */
import {
    createEffect,
    createSignal,
    onCleanup,
    type Accessor,
    type JSX,
} from "solid-js"
// @ts-ignore - plotly.js-dist-min doesn't have types
import Plotly from "plotly.js-dist-min"
import { PLOTLY_CONFIG } from "./theme"
import { hasExistingPlot } from "./helpers"

/**
 * Запасная высота контейнера на узких экранах [пкс],
 * если измеренная высота слишком мала.
 */
const MOBILE_PLOT_FALLBACK_HEIGHT = 280

const resolvePlotHostHeight = (div: HTMLElement) => {
    const measured = div.clientHeight
    if (measured > 40) return measured
    return MOBILE_PLOT_FALLBACK_HEIGHT
}

const isPlotHostDisplayed = (el: HTMLElement) => {
    if (!el.isConnected) return false
    if (el.clientWidth <= 0 || el.clientHeight <= 0) return false
    let node: HTMLElement | null = el
    while (node) {
        const style = getComputedStyle(node)
        if (style.display === "none" || style.visibility === "hidden") {
            return false
        }
        node = node.parentElement
    }
    return true
}

const paintPlot = (
    div: HTMLElement,
    traces: unknown[],
    layout: Record<string, unknown>,
    config: typeof PLOTLY_CONFIG
) => {
    const layoutWithSize = {
        ...layout,
        autosize: true,
        height: resolvePlotHostHeight(div),
    }
    if (hasExistingPlot(div as HTMLDivElement)) {
        Plotly.react(div, traces, layoutWithSize, config)
    } else {
        Plotly.newPlot(div, traces, layoutWithSize, config)
    }
}

const resizePlotHost = (el: HTMLElement) => {
    if (!el.classList.contains("js-plotly-plot") && !(el as any).__plotly) {
        return
    }
    if (!isPlotHostDisplayed(el)) return
    void Promise.resolve(Plotly.Plots.resize(el)).catch(() => {})
}

/**
 * Свойства контейнера. Серии, макет и признак активности задаются
 * реактивными доступами; при ложном признаке выполняется очистка.
 */
export type CanvasProps = {
    traces: Accessor<unknown[] | null | undefined>
    layout: Accessor<Record<string, unknown> | null | undefined>
    class?: string
    enabled?: Accessor<boolean>
    onHostReady?: (el: HTMLDivElement | null) => void
}

/**
 * Контейнер диаграммы: реактивное обновление, очистка при отключении,
 * пересчёт размеров при изменении габаритов элемента.
 */
export const Canvas = (props: CanvasProps): JSX.Element => {
    const [host, setHost] = createSignal<HTMLDivElement | null>(null)

    const setHostRef = (el: HTMLDivElement) => {
        setHost(el)
        props.onHostReady?.(el)
    }

    createEffect(() => {
        const div = host()
        const traces = props.traces()
        const layout = props.layout()
        const enabled = props.enabled ? props.enabled() : true

        if (!div) return
        if (!enabled || !traces || !layout) {
            if (hasExistingPlot(div)) {
                try {
                    Plotly.purge(div)
                } catch {
                    // ignore purge errors
                }
            }
            return
        }

        try {
            paintPlot(div, traces, layout, PLOTLY_CONFIG)
        } catch {
            // ignore paint errors
        }
    })

    createEffect(() => {
        const div = host()
        if (!div || typeof ResizeObserver === "undefined") return

        const observer = new ResizeObserver(() => {
            resizePlotHost(div)
        })
        observer.observe(div)
        onCleanup(() => observer.disconnect())
    })

    onCleanup(() => {
        const div = host()
        if (div) {
            try {
                Plotly.purge(div)
            } catch {
                // ignore purge errors
            }
        }
        props.onHostReady?.(null)
    })

    return (
        <div
            ref={setHostRef}
            class={props.class ?? "w-full h-full min-h-0 overflow-hidden"}
        />
    )
}

/**
 * Отложенный пересчёт размеров набора контейнеров:
 * два кадра анимации и таймеры на 50 и 150 мс.
 * @returns Функция отмены запланированных вызовов.
 */
export const schedulePlotResize = (
    hosts: Array<HTMLElement | null | undefined>
) => {
    let rafOuter = 0
    let rafInner = 0
    const run = () => {
        for (const el of hosts) {
            if (el) resizePlotHost(el)
        }
    }
    const t50 = window.setTimeout(run, 50)
    const t150 = window.setTimeout(run, 150)
    rafOuter = requestAnimationFrame(() => {
        rafInner = requestAnimationFrame(run)
    })
    return () => {
        cancelAnimationFrame(rafOuter)
        cancelAnimationFrame(rafInner)
        clearTimeout(t50)
        clearTimeout(t150)
    }
}

/**
 * Выгрузка диаграммы в растровый файл с удвоением разрешения;
 * наименьший размер кадра — 400× 600 [пкс].
 */
export const exportPlotPng = (div: HTMLDivElement | null, filename: string) => {
    if (!div) return
    try {
        Plotly.downloadImage(div, {
            format: "png",
            filename,
            height: Math.max(div.clientHeight, 400),
            width: Math.max(div.clientWidth, 600),
            scale: 2,
        })
    } catch {
        // ignore export errors
    }
}

/** Проверяет, смонтирован ли в элементе экземпляр диаграммы. */
export const isPlotlyReady = (div: HTMLDivElement) =>
    div.classList.contains("js-plotly-plot") ||
    Boolean((div as any).__plotly) ||
    Boolean(div.querySelector(".plotly"))

export { Plotly }
