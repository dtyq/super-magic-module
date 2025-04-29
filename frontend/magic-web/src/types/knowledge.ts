import type { KnowledgeStatus } from "@/opensource/pages/flow/nodes/KnowledgeSearch/v0/constants"
import type { KnowledgeType } from "@/opensource/pages/flow/nodes/KnowledgeSearch/v0/types"
import type { OperationTypes } from "@/opensource/pages/flow/components/AuthControlButton/types"
import type {
	FragmentConfig,
	EmbeddingModelConfig,
	RetrieveConfig,
} from "@/opensource/pages/vectorKnowledge/types"

/** 知识库相关类型 */
export namespace Knowledge {
	/** 创建知识库 - 参数 */
	export interface CreateKnowledgeParams {
		name: string
		description: string
		icon: string
		enabled: boolean
		fragment_config?: FragmentConfig
		embedding_config?: EmbeddingModelConfig
		retrieve_config?: RetrieveConfig
		document_files: {
			name: string
			key: string
		}[]
	}

	/** 创建知识库 - 响应 */
	export interface CreateKnowledgeResult {
		id: string
		code: string
		version: number
		name: string
		description: string
		icon: string
		type: number
		enabled: boolean
		model: string
		vector_db: string
		organization_code: string
		creator: string
		created_at: string
		modifier: string
		updated_at: string
		is_draft: boolean
		fragment_config: Record<string, unknown>
		embedding_config: Record<string, unknown>
		retrieve_config: Record<string, unknown>
	}

	/** 更新知识库 */
	export interface UpdateKnowledgeParams {
		code: string
		name: string
		description: string
		icon: string
		enabled: boolean
		embedding_config?: EmbeddingModelConfig
		retrieve_config?: RetrieveConfig
	}

	/** 单个知识库详情 */
	export interface Detail {
		id: string
		code: string
		version: number
		name: string
		description: string
		icon: string
		type: number
		enabled: boolean
		sync_status: number
		sync_status_message: string
		model: string
		vector_db: string
		organization_code: string
		creator: string
		created_at: string
		modifier: string
		updated_at: string
		fragment_count: number
		expected_count: number
		completed_count: number
		user_operation: OperationTypes
		fragment_config: FragmentConfig
		embedding_config: EmbeddingModelConfig
		retrieve_config: RetrieveConfig
	}

	/** 单个知识库列表项 */
	export interface KnowledgeItem {
		id: string
		code: string
		name: string
		icon: string
		description: string
		type: number
		enabled: boolean
		sync_status: number
		sync_status_message: string
		model: string
		vector_db: string
		organization_code: string
		creator: string
		created_at: string
		modifier: string
		updated_at: string
		user_operation: OperationTypes
		document_count: number
		word_count: number
		creator_info: {
			id: string
			name: string
			avatar: string
		}
		modifier_info: {
			id: string
			name: string
			avatar: string
		}
	}

	/** 知识库嵌入文档详情 */
	export interface EmbedDocumentDetail {
		id: string
		code: string
		version: number
		name: string
		description: string
		type: number
		enabled: boolean
		sync_status: number
		embedding_model: string
		vector_db: string
		organization_code: string
		creator: string
		created_at: string
		modifier: string
		updated_at: string
		fragment_config: Record<string, unknown>
		embedding_config: Record<string, unknown>
		retrieve_config: Record<string, unknown>
		creator_info: {
			id: string
			name: string
			avatar: string
		}
		modifier_info: {
			id: string
			name: string
			avatar: string
		}
		word_count: number
	}

	/** 添加知识库的文档 */
	export interface AddKnowledgeDocumentParams {
		knowledge_code: string
		enabled: boolean
		document_file: {
			name: string
			key: string
		}
	}

	/** 更新知识库的文档 */
	export interface UpdateKnowledgeDocumentParams {
		knowledge_code: string
		document_code: string
		name: string
		enabled: boolean
	}

	/** 删除知识库的文档 */
	export interface DeleteKnowledgeDocumentParams {
		knowledge_code: string
		document_code: string
	}

	/** 分段预览 */
	export interface SegmentPreviewParams {
		fragment_config: FragmentConfig
		document_file: {
			name: string
			key: string
		}
	}

	/** 单个片段 */
	export interface FragmentItem {
		id: string
		knowledge_base_code: string
		creator: string
		modifier: string
		created_at: string
		updated_at: string
		document_code: string
		document_name: string
		content: string
		metadata: Record<string, string | number>
		business_id: string
		sync_status: number
		sync_status_message: string
		score: number
		word_count: number
	}

	export type GetKnowledgeListParams = {
		name: string
		page: number
		pageSize: number
	}

	export type SaveKnowledgeParams = Partial<
		Pick<
			KnowledgeItem,
			"id" | "name" | "description" | "type" | "model" | "enabled" | "vector_db"
		>
	>

	export type MatchKnowledgeParams = Pick<
		KnowledgeItem,
		"name" | "description" | "type" | "model"
	>

	export type GetFragmentListParams = {
		knowledgeCode: string
		page: number
		pageSize: number
	}

	export type SaveFragmentParams = Partial<{
		id: string
		knowledge_code: string
		content: string
		metadata: FragmentItem["metadata"]
		business_id: FragmentItem["business_id"]
	}>

	// 天书知识库单个项
	export type KnowledgeDatabaseItem = {
		knowledge_code: string
		knowledge_type: KnowledgeType
		business_id: string
		name: string
		description: string
	}

	// 请求进度的Params
	export type GetTeamshareKnowledgeProgressParams = {
		knowledge_codes: string[]
	}

	export type CreateTeamshareKnowledgeVectorParams = {
		knowledge_id: string
	}

	export interface KnowledgeDatabaseProgress extends KnowledgeDatabaseItem {
		vector_status: KnowledgeStatus
		expected_num: number
		completed_num: number
	}

	// 0: 文生图
	// 1: 图生图
	// 2: 图片增强
	// 3: LLM大语言模型
	// 4.嵌入模型
	export interface GetActiveModelByCategoryParams {
		category: "vlm" | "llm"
		model_type: 0 | 1 | 2 | 3 | 4
	}

	export interface ServiceProvider {
		alias: string
		category: string
		config: {
			ak: string
			api_key: string
			api_version: string
			deployment_name: string
			proxy_url: string
			region: string
			sk: string
			url: string
		}
		created_at: string
		description: string
		icon: string
		id: string
		is_models_enable: boolean
		models: Model[]
		name: string
		provider_code: string
		/**
		 * 1- 普通 2-官方 3-自定义
		 */
		provider_type: number
		service_provider_id: string
		status: number
		translate: string[]
	}

	export interface Model {
		category: string
		config: ModelConfig
		created_at: string
		description: string
		icon: string
		id: string
		model_id: string
		model_type: number
		model_version: string
		name: string
		service_provider_config_id: string
		sort: number
		status: number
		translate: {
			name: {
				en_US: string
				zh_CN: string
			}
		}
		visible_organizations: string[]
	}

	export interface ModelConfig {
		max_tokens: null
		support_deep_think: boolean
		support_embedding: boolean
		support_function: boolean
		support_multi_modal: boolean
		vector_size: number
	}
}
