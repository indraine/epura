import {
    createSignal,
    createMemo,
    createEffect,
    Show,
    Switch,
    Match,
    type JSX,
} from "solid-js"
import { DecimalField } from "../ui/decimal-field"
import { Button } from "../ui/button"
import type { SectionCalculatorParams } from "../core/types"
import { useI18N } from "../i18n"

/**
 * Калькулятор геометрических характеристик поперечного сечения.
 *
 * Линейные размеры задаются в [мм]. Результат: момент инерции I_z
 * относительно центральной оси z [мм⁴] и площадь A [мм²].
 * В интерфейсе дополнительно выводятся W_z = 2I/h [мм³] и
 * i_z = √(I/A) [мм]. Пересчёт в единицы СИ для решателя не выполняется.
 */

export type SectionType = "manual" | "rectangle" | "circle" | "ring" | "i-beam"

/** Результат: I_z [мм⁴], A [мм²]. */
export interface SectionCalculatorResult {
    inertia: number
    area: number
}

interface SectionProps {
    onApply?: (
        result: SectionCalculatorResult,
        params: SectionCalculatorParams
    ) => void
    onCancel?: () => void
    /** @deprecated Предпросмотр; предпочтителен `onApply`. */
    onCalculate?: (result: SectionCalculatorResult) => void
    onParamsChange?: (params: SectionCalculatorParams) => void
    initialInertia?: number
    initialArea?: number
    initialParams?: SectionCalculatorParams
}

/** Цвета иллюстративных схем сечений (не параметрическая отрисовка). */
const CYAN = "#38BDF8"
const AMBER = "#F59E0B"
const EMERALD = "#34D399"
const ROSE = "#FB7185"
const AXIS = "#8C909F"
const GRID_STROKE = "#424754"

/** Прямоугольник: A = bh, I = bh^3/12; размеры [мм]. */
const calculateRectangle = (b: number, h: number): SectionCalculatorResult => {
    const area = b * h
    const inertia = (b * Math.pow(h, 3)) / 12
    return { inertia, area }
}

/** Круг: A = π r^2, I = π d^4/64; d [мм]. */
const calculateCircle = (d: number): SectionCalculatorResult => {
    const r = d / 2
    const area = Math.PI * Math.pow(r, 2)
    const inertia = (Math.PI * Math.pow(d, 4)) / 64
    return { inertia, area }
}

/** Кольцо: A = π(R^2 - r^2), I = π(D^4 - d^4)/64; диаметры [мм]. */
const calculateRing = (D: number, d: number): SectionCalculatorResult => {
    const R = D / 2
    const r = d / 2
    const area = Math.PI * (Math.pow(R, 2) - Math.pow(r, 2))
    const inertia = (Math.PI * (Math.pow(D, 4) - Math.pow(d, 4))) / 64
    return { inertia, area }
}

/**
 * Двутавр относительно центральной оси z: стенка и две полки
 * (теорема Штейнера для полок). Размеры [мм].
 */
const calculateIBeam = (
    h: number,
    b: number,
    tw: number,
    tf: number
): SectionCalculatorResult => {
    const area = 2 * b * tf + (h - 2 * tf) * tw
    // Момент инерции для двутавра относительно центральной оси
    const I_web = (tw * Math.pow(h - 2 * tf, 3)) / 12
    const I_flange = (b * Math.pow(tf, 3)) / 12
    const A_flange = b * tf
    const d_flange = (h - tf) / 2
    const inertia = I_web + 2 * (I_flange + A_flange * Math.pow(d_flange, 2))
    return { inertia, area }
}

interface BlueprintSvgProps {
    gridId: string
    children: JSX.Element
    /** Show rose centroid marker at viewBox center. */
    showCentroid?: boolean
}

/** Shared blueprint chrome: grid + y/z axes (+ optional centroid). Fixed 320×220. */
const BlueprintSvg = (props: BlueprintSvgProps) => {
    const showCentroid = () => props.showCentroid !== false
    return (
        <svg
            viewBox="0 0 320 220"
            class="w-full max-w-[300px] md:max-w-[360px] aspect-[320/220] h-auto shrink-0"
            role="img"
            aria-label="Схема поперечного сечения"
        >
            <defs>
                <pattern
                    id={props.gridId}
                    width="20"
                    height="20"
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d="M 20 0 L 0 0 0 20"
                        fill="none"
                        stroke={GRID_STROKE}
                        stroke-opacity="0.25"
                        stroke-width="1"
                    />
                </pattern>
            </defs>
            <rect width="320" height="220" fill={`url(#${props.gridId})`} />

            {/* Neutral axis z */}
            <line
                x1="30"
                y1="110"
                x2="290"
                y2="110"
                stroke={AXIS}
                stroke-dasharray="6 4"
                stroke-width="1.5"
            />
            <text x="282" y="102" fill={AXIS} class="font-mono" font-size="11">
                z
            </text>
            {/* Vertical axis y */}
            <line
                x1="160"
                y1="15"
                x2="160"
                y2="205"
                stroke={AXIS}
                stroke-dasharray="6 4"
                stroke-width="1.5"
            />
            <text x="166" y="24" fill={AXIS} class="font-mono" font-size="11">
                y
            </text>

            {props.children}

            {showCentroid() && <circle cx="160" cy="110" r="4" fill={ROSE} />}
        </svg>
    )
}

const RectangleSchema = () => {
    return (
        <BlueprintSvg gridId="sec-grid-rect">
            <rect
                x="115"
                y="45"
                width="90"
                height="130"
                fill={CYAN}
                fill-opacity="0.18"
                stroke={CYAN}
                stroke-width="2.5"
                rx="2"
            />
            {/* Dimension b */}
            <line
                x1="115"
                y1="192"
                x2="205"
                y2="192"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <line
                x1="115"
                y1="186"
                x2="115"
                y2="198"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <line
                x1="205"
                y1="186"
                x2="205"
                y2="198"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <text
                x="160"
                y="208"
                text-anchor="middle"
                fill={AMBER}
                class="font-mono"
                font-size="12"
            >
                b
            </text>
            {/* Dimension h */}
            <line
                x1="226"
                y1="45"
                x2="226"
                y2="175"
                stroke={EMERALD}
                stroke-width="1.5"
            />
            <line
                x1="220"
                y1="45"
                x2="232"
                y2="45"
                stroke={EMERALD}
                stroke-width="1.5"
            />
            <line
                x1="220"
                y1="175"
                x2="232"
                y2="175"
                stroke={EMERALD}
                stroke-width="1.5"
            />
            <text
                x="236"
                y="114"
                fill={EMERALD}
                class="font-mono"
                font-size="12"
            >
                h
            </text>
        </BlueprintSvg>
    )
}

const CircleSchema = () => {
    return (
        <BlueprintSvg gridId="sec-grid-circle">
            <circle
                cx="160"
                cy="110"
                r="64"
                fill={CYAN}
                fill-opacity="0.18"
                stroke={CYAN}
                stroke-width="2.5"
            />
            {/* Diameter dimension */}
            <line
                x1="96"
                y1="110"
                x2="224"
                y2="110"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <line
                x1="96"
                y1="104"
                x2="96"
                y2="116"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <line
                x1="224"
                y1="104"
                x2="224"
                y2="116"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <text x="236" y="114" fill={AMBER} class="font-mono" font-size="12">
                d
            </text>
        </BlueprintSvg>
    )
}

const RingSchema = () => {
    // Evenodd annulus: hole stays transparent (CSS var fills in SVG attrs often fail)
    const cx = 160
    const cy = 110
    const R = 64
    const r = 36
    const donut = [
        `M ${cx - R} ${cy}`,
        `a ${R} ${R} 0 1 0 ${R * 2} 0`,
        `a ${R} ${R} 0 1 0 ${-R * 2} 0`,
        `M ${cx - r} ${cy}`,
        `a ${r} ${r} 0 1 1 ${r * 2} 0`,
        `a ${r} ${r} 0 1 1 ${-r * 2} 0`,
        "Z",
    ].join(" ")

    return (
        <BlueprintSvg gridId="sec-grid-ring">
            <path
                d={donut}
                fill={CYAN}
                fill-opacity="0.18"
                fill-rule="evenodd"
                stroke={CYAN}
                stroke-width="2.5"
            />
            <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={CYAN}
                stroke-width="2"
                stroke-dasharray="4 3"
            />
            <text x="236" y="102" fill={AMBER} class="font-mono" font-size="12">
                D
            </text>
            <text
                x="236"
                y="122"
                fill={EMERALD}
                class="font-mono"
                font-size="12"
            >
                d
            </text>
        </BlueprintSvg>
    )
}

const IBeamSchema = () => {
    return (
        <BlueprintSvg gridId="sec-grid-ibeam">
            <path
                d="M 110 45 H 210 V 62 H 168 V 158 H 210 V 175 H 110 V 158 H 152 V 62 H 110 Z"
                fill={CYAN}
                fill-opacity="0.18"
                stroke={CYAN}
                stroke-width="2.5"
            />
            {/* Dimension b */}
            <line
                x1="110"
                y1="192"
                x2="210"
                y2="192"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <line
                x1="110"
                y1="186"
                x2="110"
                y2="198"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <line
                x1="210"
                y1="186"
                x2="210"
                y2="198"
                stroke={AMBER}
                stroke-width="1.5"
            />
            <text
                x="160"
                y="210"
                text-anchor="middle"
                fill={AMBER}
                class="font-mono"
                font-size="12"
            >
                b
            </text>
            {/* Dimension h */}
            <line
                x1="226"
                y1="45"
                x2="226"
                y2="175"
                stroke={EMERALD}
                stroke-width="1.5"
            />
            <line
                x1="220"
                y1="45"
                x2="232"
                y2="45"
                stroke={EMERALD}
                stroke-width="1.5"
            />
            <line
                x1="220"
                y1="175"
                x2="232"
                y2="175"
                stroke={EMERALD}
                stroke-width="1.5"
            />
            <text
                x="238"
                y="114"
                fill={EMERALD}
                class="font-mono"
                font-size="12"
            >
                h
            </text>
            {/* tw / tf callouts */}
            <text x="172" y="118" fill={AMBER} class="font-mono" font-size="11">
                tw
            </text>
            <text
                x="214"
                y="56"
                fill={EMERALD}
                class="font-mono"
                font-size="11"
            >
                tf
            </text>
        </BlueprintSvg>
    )
}

/** Manual mode: blueprint chrome without a profile outline. */
const ManualPlaceholder = () => {
    return (
        <BlueprintSvg gridId="sec-grid-manual" showCentroid={false}>
            <rect
                x="100"
                y="55"
                width="120"
                height="110"
                fill="none"
                stroke={AXIS}
                stroke-width="1.5"
                stroke-dasharray="6 4"
                rx="2"
            />
            <text
                x="160"
                y="114"
                text-anchor="middle"
                fill={AXIS}
                class="font-mono"
                font-size="12"
            >
                вручную
            </text>
        </BlueprintSvg>
    )
}

const SchemaCaption = (props: { children: JSX.Element }) => {
    return (
        <p class="text-body-sm text-on-surface-variant mt-2 text-center font-mono">
            {props.children}
        </p>
    )
}

const formatEngineering = (value: number, digits = 4): string => {
    if (!Number.isFinite(value)) return "—"
    const abs = Math.abs(value)
    if (abs === 0) return "0"
    if (abs >= 1e6 || (abs > 0 && abs < 1e-2)) {
        const exp = value.toExponential(2)
        const [coeff, power] = exp.split("e")
        const p = Number(power)
        const superscripts: Record<string, string> = {
            "0": "⁰",
            "1": "¹",
            "2": "²",
            "3": "³",
            "4": "⁴",
            "5": "⁵",
            "6": "⁶",
            "7": "⁷",
            "8": "⁸",
            "9": "⁹",
            "-": "⁻",
            "+": "",
        }
        const powerNice = String(p)
            .split("")
            .map(ch => superscripts[ch] ?? ch)
            .join("")
        return `${coeff.replace(".", ",")} × 10${powerNice}`
    }
    return value.toLocaleString("ru-RU", {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
    })
}

const RECT_PRESETS = [
    { b: 50, h: 100 },
    { b: 100, h: 200 },
    { b: 150, h: 300 },
] as const

const characteristicHeight = (
    type: SectionType,
    dims: {
        rectangle_h: number
        circle_d: number
        ring_D: number
        ibeam_h: number
    }
): number => {
    switch (type) {
        case "rectangle":
            return dims.rectangle_h
        case "circle":
            return dims.circle_d
        case "ring":
            return dims.ring_D
        case "i-beam":
            return dims.ibeam_h
        default:
            return 0
    }
}

/**
 * Диалог калькулятора сечения: пресеты профиля, ручной ввод I и A,
 * вкладка «Круг / труба» (d = 0 — круг, d > 0 — кольцо).
 */
export const Section = (props: SectionProps) => {
    const t = useI18N()
    const initialParams = props.initialParams
    const [sectionType, setSectionType] = createSignal<SectionType>(
        initialParams?.type ?? "rectangle"
    )

    const [rectangle_b, setRectangle_b] = createSignal(
        initialParams?.rectangle?.b ?? 100
    )
    const [rectangle_h, setRectangle_h] = createSignal(
        initialParams?.rectangle?.h ?? 200
    )
    const [circle_d, setCircle_d] = createSignal(
        initialParams?.circle?.d ?? 160
    )
    const [ring_D, setRing_D] = createSignal(initialParams?.ring?.D ?? 160)
    const [ring_d, setRing_d] = createSignal(initialParams?.ring?.d ?? 0)
    const [ibeam_h, setIbeam_h] = createSignal(initialParams?.iBeam?.h ?? 200)
    const [ibeam_b, setIbeam_b] = createSignal(initialParams?.iBeam?.b ?? 100)
    const [ibeam_tw, setIbeam_tw] = createSignal(initialParams?.iBeam?.tw ?? 5)
    const [ibeam_tf, setIbeam_tf] = createSignal(initialParams?.iBeam?.tf ?? 8)
    const [manualInertia, setManualInertia] = createSignal(
        initialParams?.manual?.inertia ?? props.initialInertia ?? 1.0
    )
    const [manualArea, setManualArea] = createSignal(
        initialParams?.manual?.area ?? props.initialArea ?? 0.01
    )

    /** UI tab: circle+ring merged as tube */
    const uiTab = createMemo(() => {
        const type = sectionType()
        if (type === "circle" || type === "ring") return "tube"
        return type
    })

    const setUiTab = (tab: string) => {
        if (tab === "tube") {
            setSectionType(ring_d() > 0 ? "ring" : "circle")
            return
        }
        setSectionType(tab as SectionType)
    }

    const getCurrentParams = (): SectionCalculatorParams => {
        const type = sectionType()
        const params: SectionCalculatorParams = { type }
        switch (type) {
            case "rectangle":
                params.rectangle = { b: rectangle_b(), h: rectangle_h() }
                break
            case "circle":
                params.circle = { d: circle_d() }
                break
            case "ring":
                params.ring = { D: ring_D(), d: ring_d() }
                break
            case "i-beam":
                params.iBeam = {
                    h: ibeam_h(),
                    b: ibeam_b(),
                    tw: ibeam_tw(),
                    tf: ibeam_tf(),
                }
                break
            case "manual":
                params.manual = {
                    inertia: manualInertia(),
                    area: manualArea(),
                }
                break
        }
        return params
    }

    const result = createMemo<SectionCalculatorResult>(() => {
        const type = sectionType()
        if (type === "manual") {
            return { inertia: manualInertia(), area: manualArea() }
        }
        if (type === "rectangle") {
            return calculateRectangle(rectangle_b(), rectangle_h())
        }
        if (type === "circle") {
            return calculateCircle(circle_d())
        }
        if (type === "ring") {
            return calculateRing(ring_D(), ring_d())
        }
        if (type === "i-beam") {
            return calculateIBeam(ibeam_h(), ibeam_b(), ibeam_tw(), ibeam_tf())
        }
        return { inertia: 0, area: 0 }
    })

    const derived = createMemo(() => {
        const { inertia, area } = result()
        const h = characteristicHeight(sectionType(), {
            rectangle_h: rectangle_h(),
            circle_d: circle_d(),
            ring_D: ring_D(),
            ibeam_h: ibeam_h(),
        })
        const Wz = h > 0 ? (2 * inertia) / h : 0
        const iz = area > 0 ? Math.sqrt(inertia / area) : 0
        return { Wz, iz }
    })

    createEffect(() => {
        props.onParamsChange?.(getCurrentParams())
    })

    // Optional live sync for legacy callers
    createEffect(() => {
        if (props.onApply) return
        props.onCalculate?.(result())
    })

    const apply = () => {
        const res = result()
        const params = getCurrentParams()
        props.onCalculate?.(res)
        props.onParamsChange?.(params)
        props.onApply?.(res, params)
    }

    const profileTabs: { id: string; label: string; icon: JSX.Element }[] = [
        {
            id: "rectangle",
            label: t("sectionCalculator.rectangle"),
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    class="size-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                >
                    <rect x="5" y="5" width="14" height="14" rx="1" />
                </svg>
            ),
        },
        {
            id: "tube",
            label: t("form.sectionCalculator.tube"),
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    class="size-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="4" stroke-dasharray="2 2" />
                </svg>
            ),
        },
        {
            id: "i-beam",
            label: t("sectionCalculator.iBeam"),
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    class="size-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                >
                    <path d="M6 6h12M6 18h12M12 6v12" />
                </svg>
            ),
        },
        {
            id: "manual",
            label: t("form.sectionCalculator.manual"),
            icon: (
                <svg
                    viewBox="0 0 24 24"
                    class="size-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                >
                    <path d="M4 20h4L18 10l-4-4L4 16v4z" />
                </svg>
            ),
        },
    ]

    const ResultsGrid = () => (
        <div class="grid grid-cols-2 gap-gutter-md">
            <div class="flex flex-col gap-gutter-xs min-w-0">
                <span class="font-body text-body-sm text-outline">
                    {t("form.sectionCalculator.areaA")}
                </span>
                <span class="font-mono text-mono-md tabular-nums text-on-surface">
                    {formatEngineering(result().area)} мм²
                </span>
            </div>
            <div class="flex flex-col gap-gutter-xs min-w-0">
                <span class="font-body text-body-sm text-outline">
                    {t("form.sectionCalculator.inertiaIz")}
                </span>
                <span class="font-mono text-mono-md tabular-nums text-primary">
                    {formatEngineering(result().inertia)} мм⁴
                </span>
            </div>
            <div class="flex flex-col gap-gutter-xs min-w-0">
                <span class="font-body text-body-sm text-outline">
                    {t("form.sectionCalculator.sectionModulusWz")}
                </span>
                <span class="font-mono text-mono-md tabular-nums text-on-surface">
                    {sectionType() === "manual"
                        ? "—"
                        : `${formatEngineering(derived().Wz)} мм³`}
                </span>
            </div>
            <div class="flex flex-col gap-gutter-xs min-w-0">
                <span class="font-body text-body-sm text-outline">
                    {t("form.sectionCalculator.gyrationIz")}
                </span>
                <span class="font-mono text-mono-md tabular-nums text-on-surface">
                    {sectionType() === "manual"
                        ? "—"
                        : `${formatEngineering(derived().iz, 2)} мм`}
                </span>
            </div>
        </div>
    )

    /** Single right-column card: inputs top, results pinned bottom (stable height). */
    const ParamsPanel = () => (
        <div class="md:h-full rounded-md bg-surface-container border border-outline-variant p-gutter-lg flex flex-col gap-gutter-md">
            <h2 class="font-headline text-headline-sm text-on-surface">
                {t("form.sectionCalculator.dimensions")}
            </h2>

            <Show when={sectionType() === "manual"}>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-gutter-md">
                    <DecimalField
                        step="0.0001"
                        label={t("sectionCalculator.inertia.label")}
                        value={manualInertia()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setManualInertia(Math.max(0, val))
                            }
                        }}
                    />
                    <DecimalField
                        step="0.0001"
                        label={t("sectionCalculator.area.label")}
                        value={manualArea()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setManualArea(Math.max(0, val))
                            }
                        }}
                    />
                </div>
            </Show>

            <Show when={sectionType() === "rectangle"}>
                <div class="grid grid-cols-2 gap-gutter-md">
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.rectangle_b.label")}
                        value={rectangle_b()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setRectangle_b(Math.max(0, val))
                            }
                        }}
                    />
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.rectangle_h.label")}
                        value={rectangle_h()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setRectangle_h(Math.max(0, val))
                            }
                        }}
                    />
                </div>
                <div class="flex flex-col gap-gutter-sm">
                    <span class="font-body text-body-sm text-outline">
                        {t("form.sectionCalculator.presets")}
                    </span>
                    <div class="flex flex-wrap gap-gutter-sm">
                        {RECT_PRESETS.map(preset => {
                            const active =
                                rectangle_b() === preset.b &&
                                rectangle_h() === preset.h
                            return (
                                <button
                                    type="button"
                                    class={`px-gutter-md py-gutter-xs rounded-sm font-mono text-mono-sm tabular-nums border transition-colors ${
                                        active
                                            ? "bg-secondary-container text-secondary-on-container border-primary"
                                            : "bg-surface-container-high text-on-surface border-outline-variant hover:border-primary"
                                    }`}
                                    onClick={() => {
                                        setRectangle_b(preset.b)
                                        setRectangle_h(preset.h)
                                    }}
                                >
                                    {preset.b} × {preset.h} мм
                                </button>
                            )
                        })}
                    </div>
                </div>
            </Show>

            <Show when={uiTab() === "tube"}>
                <div class="grid grid-cols-2 gap-gutter-md">
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.ring_D.label")}
                        value={
                            sectionType() === "ring" ? ring_D() : circle_d()
                        }
                        compact
                        onValueChange={val => {
                            if (val === undefined) return
                            const outer = Math.max(0, val)
                            if (ring_d() > 0) {
                                setRing_D(outer)
                                setRing_d(
                                    Math.min(
                                        ring_d(),
                                        Math.max(0, outer - 0.1)
                                    )
                                )
                                setSectionType("ring")
                            } else {
                                setCircle_d(outer)
                                setRing_D(outer)
                                setSectionType("circle")
                            }
                        }}
                    />
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.ring_d.label")}
                        value={ring_d()}
                        compact
                        onValueChange={val => {
                            if (val === undefined) return
                            const inner = Math.max(0, val)
                            const outer =
                                sectionType() === "ring" ? ring_D() : circle_d()
                            if (inner <= 0) {
                                setRing_d(0)
                                setCircle_d(outer)
                                setSectionType("circle")
                            } else {
                                setRing_D(outer)
                                setRing_d(
                                    Math.min(inner, Math.max(0, outer - 0.1))
                                )
                                setSectionType("ring")
                            }
                        }}
                    />
                </div>
                <p class="text-body-sm text-outline font-mono">
                    d = 0 → сплошной круг; d &gt; 0 → труба
                </p>
            </Show>

            <Show when={sectionType() === "i-beam"}>
                <div class="grid grid-cols-2 gap-gutter-md">
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.ibeam_h.label")}
                        value={ibeam_h()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setIbeam_h(Math.max(0, val))
                            }
                        }}
                    />
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.ibeam_b.label")}
                        value={ibeam_b()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setIbeam_b(Math.max(0, val))
                            }
                        }}
                    />
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.ibeam_tw.label")}
                        value={ibeam_tw()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setIbeam_tw(Math.max(0, val))
                            }
                        }}
                    />
                    <DecimalField
                        step="0.1"
                        label={t("sectionCalculator.ibeam_tf.label")}
                        value={ibeam_tf()}
                        compact
                        onValueChange={val => {
                            if (val !== undefined) {
                                setIbeam_tf(Math.max(0, val))
                            }
                        }}
                    />
                </div>
            </Show>

            <div class="pt-gutter-md mt-auto border-t border-outline-variant">
                <ResultsGrid />
            </div>
        </div>
    )

    return (
        <div class="flex flex-col min-h-0 flex-1">
            {/* Profile tabs: 2×2 on mobile, row on md+ */}
            <div class="px-0 pb-gutter-md">
                <div
                    role="tablist"
                    aria-label="Тип поперечного сечения"
                    class="grid grid-cols-2 md:inline-flex md:flex-wrap md:w-auto gap-gutter-xs p-gutter-xs rounded bg-surface-container-lowest border border-outline-variant"
                >
                    {profileTabs.map(tab => (
                        <button
                            type="button"
                            role="tab"
                            aria-selected={uiTab() === tab.id}
                            class="inline-flex items-center justify-center gap-gutter-sm px-gutter-md py-gutter-sm rounded-sm font-label text-label-md transition-colors"
                            classList={{
                                "bg-primary text-primary-foreground":
                                    uiTab() === tab.id,
                                "text-on-surface-variant hover:bg-surface-container-high":
                                    uiTab() !== tab.id,
                            }}
                            onClick={() => setUiTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Body: schema | params+results (one card). Content-sized on desktop
                to avoid empty flex voids; schema stretches to match right height. */}
            <div class="grid grid-cols-1 md:grid-cols-12 gap-gutter-lg md:gap-gutter-xl md:items-stretch flex-1 min-h-0 overflow-y-auto">
                <div class="md:col-span-5 order-1 flex flex-col shrink-0 md:min-h-0 md:shrink">
                    <div class="rounded-md bg-surface-container-lowest border border-outline-variant p-gutter-md sm:p-gutter-lg flex flex-col items-center justify-center h-full min-h-[200px]">
                        <Switch fallback={<ManualPlaceholder />}>
                            <Match when={sectionType() === "rectangle"}>
                                <RectangleSchema />
                            </Match>
                            <Match when={sectionType() === "circle"}>
                                <CircleSchema />
                            </Match>
                            <Match when={sectionType() === "ring"}>
                                <RingSchema />
                            </Match>
                            <Match when={sectionType() === "i-beam"}>
                                <IBeamSchema />
                            </Match>
                        </Switch>
                        <Show when={sectionType() === "rectangle"}>
                            <SchemaCaption>I = b·h³/12</SchemaCaption>
                        </Show>
                        <Show when={sectionType() === "circle"}>
                            <SchemaCaption>I = π·d⁴/64</SchemaCaption>
                        </Show>
                        <Show when={sectionType() === "ring"}>
                            <SchemaCaption>I = π·(D⁴−d⁴)/64</SchemaCaption>
                        </Show>
                    </div>
                </div>
                <div class="md:col-span-7 order-2 flex flex-col shrink-0 md:min-h-0 md:h-full">
                    <ParamsPanel />
                </div>
            </div>

            {/* Footer actions */}
            <div class="pt-gutter-lg mt-gutter-md border-t border-outline-variant flex flex-col-reverse sm:flex-row sm:justify-end gap-gutter-sm sticky bottom-0 bg-surface-container-low">
                <Button
                    type="button"
                    variant="outline"
                    class="w-full sm:w-auto"
                    onClick={() => props.onCancel?.()}
                >
                    {t("form.sectionCalculator.cancel")}
                </Button>
                <Button
                    type="button"
                    variant="default"
                    class="w-full sm:w-auto"
                    onClick={apply}
                >
                    {t("form.sectionCalculator.apply")}
                </Button>
            </div>
        </div>
    )
}
