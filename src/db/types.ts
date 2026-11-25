import type { DBSchema } from "idb"

export type DBSchemaValue = DBSchema[string]

export type Index<T, I> = {
    name: keyof I
    keyPath: keyof T | string | string[] | (keyof T)[]
    unique: boolean
}
