import type { PrimaryDatabase } from "."
import type { DBSchemaValue } from "./types"
import type { IDBPDatabase } from "idb"

const TABLE_NAME = "settings" as const

export type Setting = {
    key: string
    value: string
}

const upgrade = (db: IDBPDatabase<PrimaryDatabase>) => {
    if (!db.objectStoreNames.contains(TABLE_NAME)) {
        db.createObjectStore(TABLE_NAME, { keyPath: "key" })
    }
}

export interface SettingsTable extends DBSchemaValue {
    key: string
    value: Setting
}

export default {
    upgrade,
    TABLE_NAME,
}
