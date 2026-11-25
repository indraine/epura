import type { PrimaryDatabase } from "."
import type { DBSchemaValue, Index } from "./types"
import type { IDBPDatabase } from "idb"
import type { PlotData, BeamSetup } from "../core/types"

const TABLE_NAME = "calculations" as const

export type Indexes = {
    startTime: number
    endTime: number
}

const INDEXES: Index<CalculationRecord, Indexes>[] = [
    { name: "startTime", unique: false, keyPath: "startTime" },
    { name: "endTime", unique: false, keyPath: "endTime" },
]

export type CalculationStatus = "Успешно" | "Ошибка"

export type CalculationRecord = {
    id: string
    startTime: number // timestamp
    endTime: number // timestamp
    calculationTime: number // milliseconds
    data: PlotData | null // null при ошибке
    setup: BeamSetup // Исходные данные формы для восстановления
    status: CalculationStatus
}

const upgrade = (db: IDBPDatabase<PrimaryDatabase>) => {
    if (!db.objectStoreNames.contains(TABLE_NAME)) {
        const objectStore = db.createObjectStore(TABLE_NAME, { keyPath: "id" })

        for (const { name, keyPath, unique } of INDEXES) {
            objectStore.createIndex(name, keyPath, { unique })
        }
    }
}

export interface CalculationTable extends DBSchemaValue {
    key: string
    value: CalculationRecord
    indexes: Indexes
}

export default {
    upgrade,
    INDEXES,
    TABLE_NAME,
}
