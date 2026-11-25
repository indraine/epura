/**
 * Контракты входных данных и результатов численного расчёта балки Эйлера–Бернулли
 * методом конечных элементов.
 *
 * Структуры согласованы с модулем WebAssembly (`pkg/euler_beam`) и с размерностями
 * пользовательского интерфейса: длина и координаты — [мм]; сила — [Н];
 * интенсивность распределённой нагрузки — [Н/мм]; модуль Юнга — [МПа];
 * плотность — [кг/мм³]; момент инерции сечения — [мм⁴]; площадь сечения — [мм²];
 * изгибающий момент — [Н·мм].
 */

/**
 * Собственная форма поперечных колебаний.
 * Собственное значение λ имеет размерность [1/с²] (квадрат круговой частоты);
 * частота — [Гц]; ординаты формы заданы в узлах сетки и на интерполяционной кривой.
 */
export interface ModeData {
    index: number
    eigenvector: number[]
    eigenvalue: number
    frequency: number
    interpolated_curve: number[]
    node_values: number[]
}

/**
 * Напряжённо-деформированное состояние: поперечный прогиб u(x).
 * Абсциссы — координата вдоль оси балки [мм]; ординаты — прогиб [мм].
 * Поля `interpolate_points` / `interpolated_curve` относятся к уплотнённой
 * интерполяционной выборке; `node_values` — к узлам конечноэлементной сетки.
 */
export interface StressStateData {
    coords: number[]
    interpolate_points: number[]
    interpolated_curve: number[]
    node_values: number[]
    min_value: number
    max_value: number
}

/**
 * Набор собственных форм на общей координатной сетке [мм].
 * Число форм в массиве `modes` ограничено решателем (на графиках отображается не более пяти).
 */
export interface ModesData {
    coords: number[]
    interpolate_points: number[]
    modes: ModeData[]
}

/**
 * Эпюра поперечной силы Q(x): абсциссы [мм], ординаты [Н].
 */
export interface ShearForceData {
    coords: number[]
    interpolate_points: number[]
    interpolated_curve: number[]
    node_values: number[]
    min_value: number
    max_value: number
}

/**
 * Эпюра изгибающего момента M(x): абсциссы [мм], ординаты [Н·мм].
 */
export interface BendingMomentData {
    coords: number[]
    interpolate_points: number[]
    interpolated_curve: number[]
    node_values: number[]
    min_value: number
    max_value: number
}

/**
 * Реакция опоры в узле сетки [Н].
 * Знак согласован с положительным направлением оси прогиба на диаграммах.
 */
export interface ReactionInfo {
    node_index: number
    value: number
}

/**
 * Полный результат расчёта, предназначенный для построения диаграмм.
 * Включает прогиб, собственные формы, эпюры Q и M, а также граничные условия,
 * нагрузки и реакции, привязанные к узлам конечноэлементной сетки.
 */
export interface PlotData {
    stress_state: StressStateData
    modes: ModesData
    shear_force: ShearForceData
    bending_moment: BendingMomentData
    boundary_conditions: BoundaryConditionInfo[]
    point_loads: PointLoadInfo[]
    distributed_loads: DistributedLoadInfo[]
    reactions: ReactionInfo[]
}

/**
 * Канонические виды граничных условий, совпадающие с перечислением
 * модуля WebAssembly: `seal` — заделка, `hindle` — шарнирная опора.
 */
export type BoundaryConditionSpecies = "seal" | "hindle"

/**
 * Граничное условие в результате расчёта: вид опоры и индекс узла сетки.
 */
export interface BoundaryConditionInfo {
    node_index: number
    bc_type: BoundaryConditionSpecies
}

/** Сосредоточенная сила в результате расчёта [Н], привязанная к узлу сетки. */
export interface PointLoadInfo {
    node_index: number
    value: number
}

/**
 * Распределённая нагрузка в результате расчёта [Н/мм];
 * `node_indices` — узлы, попавшие на отрезок действия нагрузки.
 */
export interface DistributedLoadInfo {
    node_indices: number[]
    value: number
}

/** Метод решения системы линейных алгебраических уравнений в решателе. */
export type SolverMethod = "cholesky" | "lu" | "qr" | "sparselu"

/** Вид поперечного сечения в калькуляторе геометрических характеристик. */
export type SectionType = "manual" | "rectangle" | "circle" | "ring" | "i-beam"

/**
 * Параметры калькулятора сечения (необязательны в {@link BeamSetup}
 * ради совместимости с ранее сохранёнными конфигурациями).
 * Линейные размеры задаются в [мм]; при ручном вводе —
 * момент инерции [мм⁴], площадь [мм²].
 */
export interface SectionCalculatorParams {
    type: SectionType
    /** Прямоугольник: ширина b и высота h, [мм]. */
    rectangle?: { b: number; h: number }
    /** Круг сплошного сечения: диаметр d, [мм]. */
    circle?: { d: number }
    /** Кольцевое сечение: наружный диаметр D, внутренний d, [мм]. */
    ring?: { D: number; d: number }
    /** Двутавр: высота h, ширина полки b, толщина стенки t_w и полки t_f, [мм]. */
    iBeam?: { h: number; b: number; tw: number; tf: number }
    /** Непосредственное задание момента инерции [мм⁴] и площади [мм²]. */
    manual?: { inertia: number; area: number }
}

/**
 * Входная постановка задачи (данные формы → решатель).
 *
 * Координаты опор и нагрузок принадлежат отрезку [0, L], где L — длина балки [мм].
 * Для распределённой нагрузки требуется строгое неравенство
 * `start_coord` < `end_coord`.
 */
export interface BeamSetup {
    /**
     * При true координаты граничных условий и нагрузок
     * проецируются на ближайшие узлы конечноэлементной сетки.
     */
    bind: boolean
    /** Число конечных элементов вдоль оси балки; допустимый диапазон — [1, 200]. */
    sections: number
    /** Длина балки L [мм]; требуется L > 0. */
    length: number
    /** Параметр плотности интерполяции кривых; допустимый диапазон — [1, 500]. */
    quality: number
    /** Момент инерции поперечного сечения I [мм⁴]; I ≥ 0. */
    inertia: number
    /** Модуль Юнга E [МПа]; E > 0. */
    young: number
    /** Плотность материала ρ [кг/мм³]; ρ > 0. */
    density: number
    /** Площадь поперечного сечения A [мм²]; A > 0. */
    area: number
    solver_method?: SolverMethod
    bc: BeamBoundaryCondition[]
    pl: BeamPointLoad[]
    dl: BeamDistributedLoad[]
    section_calculator?: SectionCalculatorParams
    /**
     * Индексная сигнатура для совместимости с `FieldValues` библиотеки форм.
     * Тип `any` допускается исключительно в этом месте; в остальном коде
     * применяется строгая типизация.
     */
    [key: string]: any
}

/**
 * Граничное условие на входе в расчёт.
 * Координата опоры x задаётся в [мм] и принадлежит [0, L].
 */
export interface BeamBoundaryCondition {
    /** `seal` — заделка; `hindle` — шарнир. */
    species: BoundaryConditionSpecies
    coord: number
}

/**
 * Приведение обозначения вида опоры к каноническому виду на границе
 * пользовательского интерфейса (в том числе устаревшие записи хранилища
 * и альтернативные наименования).
 *
 * Соответствия: `seal` | `заделка` | `node` | `узел` → `seal`;
 * `hindle` | `шарнир` → `hindle`.
 * Неизвестные значения отбрасываются (`null`) без подстановки по умолчанию.
 */
export const canonicalizeBoundarySpecies = (
    value: unknown
): BoundaryConditionSpecies | null => {
    if (
        value === "seal" ||
        value === "заделка" ||
        value === "node" ||
        value === "узел"
    ) {
        return "seal"
    }
    if (value === "hindle" || value === "шарнир") {
        return "hindle"
    }
    return null
}

/**
 * Сосредоточенная сила на входе: координата приложения [мм], величина [Н].
 * Знак силы согласован с положительным направлением оси прогиба на диаграммах.
 */
export interface BeamPointLoad {
    coord: number
    value: number
}

/**
 * Распределённая нагрузка постоянной интенсивности q [Н/мм] на отрезке
 * [start_coord, end_coord] [мм], причём начало строго меньше конца;
 * обе границы принадлежат [0, L].
 */
export interface BeamDistributedLoad {
    start_coord: number
    end_coord: number
    value: number
}
