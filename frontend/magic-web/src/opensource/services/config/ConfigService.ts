/* eslint-disable class-methods-use-this */
import type { ThemeMode } from "antd-style"
import type { Common } from "@/types/common"
import type * as apis from "@/opensource/apis"
import { ConfigRepository } from "@/opensource/models/config/repositories/ConfigRepository"
import { ClusterRepository } from "@/opensource/models/config/repositories/ClusterRepository"
import { configStore } from "@/opensource/models/config/stores"

export class ConfigService {
	
	private readonly commonApi: typeof apis.CommonApi
	
	constructor(dependencies: typeof apis) {
		this.commonApi = dependencies.CommonApi
	}
	
	/**
	 * @description 初始化(持久化数据/内存状态)
	 */
	async init() {
		const config = new ConfigRepository()
		const theme = await config.getThemeConfig()

		// 主题初始化
		if (!theme) {
			const defaultTheme = configStore.theme.theme
			await config.setThemeConfig(defaultTheme)
		} else {
			configStore.theme.setTheme(theme as ThemeMode)
		}

		// 国际化语言初始化
		const locale = await config.getLocaleConfig()
		if (!locale) {
			const defaultLocale = configStore.i18n.language
			await config.setLocaleConfig(defaultLocale)
		} else {
			configStore.i18n.setLanguage(locale)
		}

		// 集群编码初始化
		const clusterCode = await config.getClusterConfig()
		if (!clusterCode) {
			const defaultClusterCodeCache = configStore.cluster.clusterCodeCache
			await config.setClusterConfig(defaultClusterCodeCache)
		} else {
			configStore.cluster.setClusterCodeCache(clusterCode)
		}

		// 集群配置初始化
		const cluster = new ClusterRepository()
		const clustersConfig = await cluster.getAll()
		if (!clustersConfig) {
			const defaultClusterConfig = configStore.cluster.clusterConfig
			await cluster.setClustersConfig(Object.values(defaultClusterConfig))
		} else {
			configStore.cluster.setClustersConfig(clustersConfig)
		}
	}

	/**
	 * @description 远程同步配置
	 */
	loadConfig = async () => {
		try {
			const response = await this.commonApi.getInternationalizedSettings()
			if (response) {
				configStore.i18n.setLanguages(response.languages)
				configStore.i18n.setAreaCodes(response.phone_area_codes)
			}
		} catch (error) {
			console.error("Failed to fetch internationalization settings:", error)
		}
	}

	/**
	 * @description 主题设置
	 */
	setThemeConfig(theme: ThemeMode) {
		try {
			const config = new ConfigRepository()
			config.setThemeConfig(theme)
			configStore.theme.setTheme(theme)
		} catch (error) {
			console.error(error)
		}
	}

	/**
	 * @description 设置国际化语言
	 */
	setLanguage(lang: string) {
		const config = new ConfigRepository()
		config.setLocaleConfig(lang)
		configStore.i18n.setLanguage(lang)
	}

	/**
	 * @description 设置当前访问集群
	 */
	async setClusterConfig(authCode: string, clusterConfig: Common.PrivateConfig) {
		try {
			// 数据持久化
			const config = new ConfigRepository()
			await config.setClusterConfig(authCode)
			const cluster = new ClusterRepository()
			await cluster.put({ ...clusterConfig, deployCode: authCode }).catch(console.warn)
		} catch (error) {
			console.warn(error)
		}

		// 内存状态变更
		configStore.cluster.setClusterCodeCache(authCode)
		configStore.cluster.setClusterConfig(authCode, clusterConfig)
	}
}
