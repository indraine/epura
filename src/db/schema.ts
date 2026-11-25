import type { DBSchema } from "idb"
import type { CalculationTable } from "./calculation"
import type { SettingsTable } from "./settings"

export interface PrimaryDatabase extends DBSchema {
    calculations: CalculationTable
    settings: SettingsTable
}
