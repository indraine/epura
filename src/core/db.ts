/**
 * Хранение истории численных расчётов в IndexedDB.
 *
 * Таблица расчётов содержит записи {@link CalculationRecord}:
 * идентификатор, моменты начала и окончания [мс от эпохи Unix],
 * длительность [мс], результат ({@link PlotData} либо `null`),
 * постановку {@link BeamSetup} и статус (`«Успешно»` | `«Ошибка»`);
 * индекс построен по полю `startTime`.
 *
 * В таблице настроек ключ `maxCalculations` задаёт предельное число
 * хранимых записей. При превышении предела удаляются наиболее ранние
 * по `startTime`.
 */
import { nanoid } from "nanoid"
import type { PlotData, BeamSetup } from "./types"
import { openDatabase, type Database } from "../db"
import calculation from "../db/calculation"
import settings from "../db/settings"
import type { CalculationRecord } from "../db/calculation"

export type { CalculationRecord }

/** Предел числа записей истории по умолчанию. */
export const DEFAULT_MAX_CALCULATIONS = 100
/** Наибольшее допустимое значение предела истории. */
export const MAX_MAX_CALCULATIONS = 100
const MAX_CALCULATIONS_KEY = "maxCalculations"

let dbInstance: Database | null = null

/** Отложенное открытие и кэширование соединения с базой. */
const getDB = async (): Promise<Database> => {
    if (dbInstance) {
        return dbInstance
    }

    dbInstance = await openDatabase()
    return dbInstance
}

/**
 * Сохраняет запись о расчёте и при необходимости усекает историю до предела.
 *
 * @param startTime — момент начала расчёта [мс от эпохи Unix].
 * @param endTime — момент завершения [мс от эпохи Unix].
 * @param data — результат; при ошибке — `null`.
 * @param setup — входная постановка задачи.
 * @param status — статус; по умолчанию выводится из наличия `data`.
 * @returns Идентификатор созданной записи.
 */
export const saveCalculation = async (
    startTime: number,
    endTime: number,
    data: PlotData | null,
    setup: BeamSetup,
    status: "Успешно" | "Ошибка" = data ? "Успешно" : "Ошибка"
): Promise<string> => {
    const db = await getDB()
    const calculationTime = endTime - startTime
    const id = nanoid()

    const record: CalculationRecord = {
        id,
        startTime,
        endTime,
        calculationTime,
        data,
        setup,
        status,
    }

    await db.put(calculation.TABLE_NAME, record)

    // Проверяем и удаляем старые записи при превышении лимита
    await enforceMaxCalculations()

    return id
}

/** Возвращает все записи истории расчётов. */
export const getAllCalculations = async (): Promise<CalculationRecord[]> => {
    const db = await getDB()
    return await db.getAll(calculation.TABLE_NAME)
}

/**
 * Возвращает последнюю по `startTime` запись, содержащую поле `setup`.
 * Записи устаревшей схемы без `setup` пропускаются.
 */
export const getLastCalculation =
    async (): Promise<CalculationRecord | null> => {
        const db = await getDB()
        const tx = db.transaction(calculation.TABLE_NAME, "readonly")
        const index = tx.store.index("startTime")

        let cursor = await index.openCursor(null, "prev")

        while (cursor) {
            const record = cursor.value
            // Проверяем, что запись имеет поле setup (для обратной совместимости)
            if (record.setup) {
                await tx.done
                return record
            }
            cursor = await cursor.continue()
        }

        await tx.done
        return null
    }

/** Читает одну запись истории по идентификатору. */
export const getCalculationById = async (
    id: string
): Promise<CalculationRecord | undefined> => {
    const db = await getDB()
    return await db.get(calculation.TABLE_NAME, id)
}

/** Удаляет запись истории по идентификатору. */
export const deleteCalculation = async (id: string): Promise<void> => {
    const db = await getDB()
    await db.delete(calculation.TABLE_NAME, id)
}

/** Полностью очищает таблицу расчётов. */
export const clearAllCalculations = async (): Promise<void> => {
    const db = await getDB()
    await db.clear(calculation.TABLE_NAME)
}

/**
 * Читает предел числа хранимых расчётов из настроек;
 * при отсутствии значения возвращает {@link DEFAULT_MAX_CALCULATIONS}.
 */
export const getMaxCalculations = async (): Promise<number> => {
    const db = await getDB()

    const result = await db.get(settings.TABLE_NAME, MAX_CALCULATIONS_KEY)
    if (result && result.value) {
        const value = parseInt(result.value, 10)
        if (!isNaN(value) && value > 0) {
            return value
        }
    }

    return DEFAULT_MAX_CALCULATIONS
}

/**
 * Записывает предел истории и немедленно усекает таблицу до этого значения.
 *
 * @param max — целое число из отрезка [1, {@link MAX_MAX_CALCULATIONS}].
 * @throws при выходе `max` за допустимый диапазон.
 */
export const setMaxCalculations = async (max: number): Promise<void> => {
    if (max < 1) {
        throw new Error("Максимальное количество должно быть больше 0")
    }
    if (max > MAX_MAX_CALCULATIONS) {
        throw new Error(
            `Максимальное количество не должно превышать ${MAX_MAX_CALCULATIONS}`
        )
    }

    const db = await getDB()

    // Сохраняем настройку в IndexedDB
    await db.put(settings.TABLE_NAME, {
        key: MAX_CALCULATIONS_KEY,
        value: max.toString(),
    })

    // Получаем все записи и удаляем старые, если их больше лимита
    const allRecords = await getAllCalculations()

    if (allRecords.length > max) {
        // Сортируем по дате начала (старые первыми)
        const sorted = [...allRecords].sort((a, b) => a.startTime - b.startTime)

        // Удаляем старые записи, оставляя только последние max
        const toDelete = sorted.slice(0, sorted.length - max)

        for (const record of toDelete) {
            await deleteCalculation(record.id)
        }
    }
}

/**
 * Удаляет наиболее ранние записи по `startTime`,
 * если их число превышает текущий предел.
 */
export const enforceMaxCalculations = async (): Promise<void> => {
    const max = await getMaxCalculations()
    const allRecords = await getAllCalculations()

    if (allRecords.length > max) {
        // Сортируем по дате начала (старые первыми)
        const sorted = [...allRecords].sort((a, b) => a.startTime - b.startTime)

        // Удаляем старые записи, оставляя только последние max
        const toDelete = sorted.slice(0, sorted.length - max)

        for (const record of toDelete) {
            await deleteCalculation(record.id)
        }
    }
}
