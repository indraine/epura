/**
 * Ввод десятичных чисел: только точка, без запятой.
 * Черновые состояния вроде "0." и "" не считаются завершённым числом.
 */

const DECIMAL_PATTERN = /^-?\d*\.?\d*$/

/**
 * Нормализует сырой ввод: пробелы убираются; одна запятая без точки
 * трактуется как десятичный разделитель (вставка), иначе запятые отбрасываются.
 * При наборе запятая блокируется отдельно через beforeinput.
 */
export const sanitizeDecimalRaw = (raw: string): string => {
    let s = raw.replace(/\s/g, "")
    if (s.includes(",") && !s.includes(".")) {
        s = s.replace(",", ".")
    }
    return s.replace(/,/g, "")
}

/** Допустима ли строка как промежуточный или итоговый ввод. */
export const isAllowedDecimalInput = (raw: string): boolean =>
    raw === "" || DECIMAL_PATTERN.test(raw)

/**
 * Строка готова к записи в числовое состояние
 * (не пустая, не только знак/точка, не оканчивается на ".").
 */
export const isCompleteDecimal = (raw: string): boolean => {
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") return false
    if (raw.endsWith(".")) return false
    const n = Number(raw)
    return Number.isFinite(n)
}

/** Парсит завершённую десятичную строку; иначе `undefined`. */
export const parseDecimal = (raw: string): number | undefined => {
    const cleaned = sanitizeDecimalRaw(raw)
    if (!isCompleteDecimal(cleaned)) return undefined
    return Number(cleaned)
}

/** Строковое представление числа для поля ввода. */
export const formatDecimalValue = (
    value: number | string | null | undefined
): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "string") return value
    if (typeof value === "number" && Number.isNaN(value)) return ""
    return String(value)
}

/** Шаг для wheel/стрелок; `any` и мусор → 1. */
export const resolveDecimalStep = (
    step: string | number | undefined | null
): number => {
    if (step === undefined || step === null || step === "" || step === "any") {
        return 1
    }
    const n = typeof step === "number" ? step : Number(step)
    return Number.isFinite(n) && n > 0 ? n : 1
}

/**
 * Шаг ~ на порядок меньше |value|:
 * 1 → 0.1, 10 → 1, 1000 → 100, 10000 → 1000.
 * При 0 / нечисловом — `fallback` (по умолчанию 1).
 */
export const adaptiveDecimalStep = (
    value: number,
    fallback = 1
): number => {
    const abs = Math.abs(value)
    if (!Number.isFinite(abs) || abs === 0) {
        return fallback > 0 && Number.isFinite(fallback) ? fallback : 1
    }
    // +ε против float: log10(1000) иногда ≈ 2.999999999
    const order = Math.floor(Math.log10(abs) + 1e-12) - 1
    const step = 10 ** order
    return Number.isFinite(step) && step > 0 ? step : fallback
}

/**
 * Сдвигает значение на ±step (как у `<input type="number">` + wheel)
 * и округляет к сетке шага, чтобы не копить ошибку float.
 */
export const stepDecimalValue = (
    current: number,
    step: number,
    direction: 1 | -1,
    bounds?: { min?: number; max?: number }
): number => {
    const inv = 1 / step
    const stepped =
        Math.round((current + direction * step) * inv) / inv
    let next = Number.isFinite(stepped) ? stepped : current + direction * step
    if (bounds?.min !== undefined && Number.isFinite(bounds.min)) {
        next = Math.max(bounds.min, next)
    }
    if (bounds?.max !== undefined && Number.isFinite(bounds.max)) {
        next = Math.min(bounds.max, next)
    }
    return next
}
