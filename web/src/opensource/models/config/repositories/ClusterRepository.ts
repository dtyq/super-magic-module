import { GlobalBaseRepository } from "@/opensource/models/repository/GlobalBaseRepository"
import type { Common } from "@/types/common"

export class ClusterRepository extends GlobalBaseRepository<Common.PrivateConfig> {
	static readonly tableName = "cluster"
	
	static readonly version = 1
	
	constructor() {
		super(ClusterRepository.tableName)
	}
	
	public async setClustersConfig(clustersConfig: Array<Common.PrivateConfig>): Promise<void> {
		clustersConfig.map(config => this.put({...config, deployCode: config?.deployCode ?? ""}))
	}
	
	/**
	 * @description 保存主题配置
	 */
	public async setCluster(clusterConfig: Common.PrivateConfig): Promise<void> {
		return this.put(clusterConfig)
	}
}
