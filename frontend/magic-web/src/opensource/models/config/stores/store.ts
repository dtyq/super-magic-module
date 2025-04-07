import { themeStore } from "./theme.store"
import { i18nStore } from "./i18n.store"
import { clusterStore } from "./cluster.store"

export class ConfigStore {
	theme = themeStore

	i18n = i18nStore
	
	cluster = clusterStore

}

export const configStore = new ConfigStore()
