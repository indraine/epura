import * as i18n from "@solid-primitives/i18n"
import * as ru from "./dicts/ru"
import {
    Show,
    createContext,
    createResource,
    useContext,
    type ParentProps,
} from "solid-js"
import type { Locale } from "./types"

export const AVAILABLE_LOCALES = ["ru"] as const
export type AvailableLocale = (typeof AVAILABLE_LOCALES)[number]

export type Dict = i18n.Flatten<Locale>

export const fetchDict = async (locale: AvailableLocale): Promise<Dict> => {
    const dict: Locale = (await import(`./dicts/${locale}.tsx`)).default
    return i18n.flatten(dict)
}

export const I18NContext = createContext(
    undefined as unknown as i18n.Translator<Dict>
)

export const I18NContextProvider = (props: ParentProps) => {
    const [dict] = createResource(() => "ru" as AvailableLocale, fetchDict, {
        initialValue: i18n.flatten(ru.default),
    })

    return (
        <Show when={dict()}>
            {dict => (
                <I18NContext.Provider
                    value={i18n.translator(dict, i18n.resolveTemplate)}
                >
                    {props.children}
                </I18NContext.Provider>
            )}
        </Show>
    )
}

export const useI18N = () => useContext(I18NContext)
