import { makeAutoObservable } from "mobx"
import { createI18nNext } from "@/assets/locales/create"
import { normalizeLocale } from "@/utils/locale"
import type { Config } from "../types"
import { languageHelper } from "../utils"

export class I18nStore {
	language = "auto"

	languages: Array<Config.LanguageOption> = []

	areaCodes: Array<Config.AreaCodeOption> = []

	i18n: ReturnType<typeof createI18nNext>

	constructor() {
		makeAutoObservable(this)
		this.i18n = createI18nNext(this.displayLanguage)
		this.i18n.init()
	}

	get displayLanguage() {
		return languageHelper.transform(
			this.language === "auto" ? normalizeLocale(window.navigator.language) : this.language,
		)
	}

	setLanguage(lang: string) {
		this.language = lang
		this.i18n.instance.changeLanguage(this.displayLanguage)
	}

	setLanguages(languages: Config.LanguageOption[]) {
		this.languages =
			languages?.map((lang) => {
				return {
					name: lang.name,
					locale: lang.locale,
					translations: lang?.translations,
				}
			}) || []
	}

	setAreaCodes(areaCodes: Config.AreaCodeOption[]) {
		this.areaCodes =
			areaCodes?.map((item) => {
				return {
					name: item.name,
					code: item.code,
					locale: item.locale,
					translations: item?.translations,
				}
			}) || []
	}
}

export const i18nStore = new I18nStore()
