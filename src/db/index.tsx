import { openDB } from "idb"
import type { IDBPDatabase, DBSchema } from "idb"
import calculation, { type CalculationTable } from "./calculation"
import settings, { type SettingsTable } from "./settings"

const DATABASE_NAME = "beam-calculations"
const DATABASE_VERSION = 5

export type Database = IDBPDatabase<PrimaryDatabase>

export interface PrimaryDatabase extends DBSchema {
    [calculation.TABLE_NAME]: CalculationTable
    [settings.TABLE_NAME]: SettingsTable
}

const upgrade = async (db: IDBPDatabase<PrimaryDatabase>) => {
    calculation.upgrade(db)
    settings.upgrade(db)
}

export const openDatabase = async () =>
    openDB<PrimaryDatabase>(DATABASE_NAME, DATABASE_VERSION, { upgrade })
