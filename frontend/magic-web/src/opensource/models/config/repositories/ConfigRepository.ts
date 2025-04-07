import { GlobalBaseRepository } from "@/opensource/models/repository/GlobalBaseRepository"
import type { ThemeMode } from "antd-style"

const enum ConfigType {
	Theme = "theme",
	I18n = "i18n",
	Cluster = "cluster",
}

interface ConfigSchema {
	id?: string
	key: ConfigType
	value: string
	enabled?: boolean
	createdAt?: number
	updatedAt?: number
}

export class ConfigRepository extends GlobalBaseRepository<ConfigSchema> {
	static readonly tableName = "config"

	static readonly version = 1

	constructor() {
		super(ConfigRepository.tableName)
	}

	/**
	 * @description 获取主题配置
	 */
	public async getThemeConfig(): Promise<ThemeMode | undefined> {
		const config = await this.get(ConfigType.Theme)
		return config?.value as ThemeMode
	}

	/**
	 * @description 保存主题配置
	 */
	public async setThemeConfig(theme: ThemeMode): Promise<void> {
		const themeConfig = await this.get(ConfigType.Theme)
		return this.put({
			...themeConfig,
			key: ConfigType.Theme,
			value: theme,
		})
	}
	
	/**
	 * @description 获取主题配置
	 */
	public async getLocaleConfig(): Promise<string | undefined> {
		const config = await this.get(ConfigType.I18n)
		return config?.value as string
	}
	
	/**
	 * @description 保存国际化语言标识配置
	 */
	public async setLocaleConfig(locale: string): Promise<void> {
		const localeConfig = await this.get(ConfigType.I18n)
		return this.put({
			...localeConfig,
			key: ConfigType.I18n,
			value: locale,
		})
	}
	
	/**
	 * @description 获取集群配置
	 */
	public async getClusterConfig(): Promise<string | undefined> {
		const config = await this.get(ConfigType.Cluster)
		return config?.value as string
	}
	
	/**
	 * @description 保存集群配置
	 */
	public async setClusterConfig(cluster: string): Promise<void> {
		const clusterConfig = await this.get(ConfigType.Cluster)
		return this.put({
			...clusterConfig,
			key: ConfigType.Cluster,
			value: cluster,
		})
	}
}
