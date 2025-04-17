import { genRequestUrl } from "@/utils/http"
import type { VectorKnowledge, WithPage } from "@/types/flow"
import type { Knowledge } from "@/types/knowledge"
import type { HttpClient } from "../core/HttpClient"
import { RequestUrl } from "../constant"
import { knowledgeType } from "@/opensource/pages/vectorKnowledge/constant"

export const generateKnowledgeApi = (fetch: HttpClient) => ({
	/**
	 * 创建知识库
	 */
	createKnowledge(params: Knowledge.CreateKnowledgeParams) {
		return fetch.post<Knowledge.CreateKnowledgeResult>(
			genRequestUrl(RequestUrl.createKnowledge),
			params,
		)
	},

	/**
	 * 更新知识库
	 */
	updateKnowledge(params: Knowledge.UpdateKnowledgeParams) {
		return fetch.put<Knowledge.Detail>(
			genRequestUrl(RequestUrl.updateKnowledge, { code: params.code }),
			params,
		)
	},

	/**
	 * 获取知识库列表
	 */
	getKnowledgeList({
		name,
		page,
		pageSize,
		searchType,
		type,
	}: {
		name: string
		page: number
		pageSize: number
		searchType: VectorKnowledge.SearchType
		type: knowledgeType
	}) {
		return fetch.post<WithPage<Knowledge.KnowledgeItem[]>>(
			genRequestUrl(RequestUrl.getKnowledgeList),
			{
				name,
				page,
				page_size: pageSize,
				search_type: searchType,
				type,
			},
		)
	},

	/**
	 * 获取知识库详情
	 */
	getKnowledgeDetail(code: string) {
		return fetch.get<Knowledge.Detail>(genRequestUrl(RequestUrl.getKnowLedgeDetail, { code }))
	},

	/**
	 * 删除知识库
	 */
	deleteKnowledge(code: string) {
		return fetch.delete<Knowledge.Detail>(genRequestUrl(RequestUrl.deleteKnowledge, { code }))
	},

	/**
	 * 获取知识库的文档列表
	 */
	getKnowledgeDocumentList({
		code,
		name,
		page,
		pageSize,
	}: {
		code: string
		name?: string
		page?: number
		pageSize?: number
	}) {
		return fetch.post<WithPage<Knowledge.EmbedDocumentDetail[]>>(
			genRequestUrl(RequestUrl.getKnowledgeDocumentList, { code }),
			{
				name,
				page,
				page_size: pageSize,
			},
		)
	},

	/**
	 * 添加知识库的文档
	 */
	addKnowledgeDocument(params: Knowledge.AddKnowledgeDocumentParams) {
		return fetch.post<Knowledge.Detail>(
			genRequestUrl(RequestUrl.addKnowledgeDocument, {
				code: params.knowledge_code,
			}),
			params,
		)
	},

	/**
	 * 更新知识库的文档
	 */
	updateKnowledgeDocument(params: Knowledge.UpdateKnowledgeDocumentParams) {
		return fetch.put<Knowledge.Detail>(
			genRequestUrl(RequestUrl.updateKnowledgeDocument, {
				knowledge_code: params.knowledge_code,
				document_code: params.document_code,
			}),
			{
				name: params.name,
				enabled: params.enabled,
			},
		)
	},

	/**
	 * 删除知识库的文档
	 */
	deleteKnowledgeDocument(params: Knowledge.DeleteKnowledgeDocumentParams) {
		return fetch.delete<Knowledge.Detail>(
			genRequestUrl(RequestUrl.deleteKnowledgeDocument, {
				knowledge_code: params.knowledge_code,
				document_code: params.document_code,
			}),
		)
	},

	/**
	 * 匹配知识库
	 */
	// matchKnowledge(params: Knowledge.MatchKnowledgeParams) {
	// 	return fetch.post<Knowledge.MatchKnowledgeResult>(
	// 		genRequestUrl(RequestUrl.matchKnowledge),
	// 		params,
	// 	)
	// },

	/**
	 * 重建知识库
	 */
	rebuildKnowledge(id: string) {
		return fetch.post<Knowledge.Detail>(genRequestUrl(RequestUrl.deleteKnowledge, { id }))
	},

	/**
	 * 创建片段
	 */
	// createFragment(params: Knowledge.CreateFragmentParams) {
	// 	return fetch.post<Knowledge.Detail>(
	// 		genRequestUrl(RequestUrl.createFragment, {
	// 			"knowledge-base-code": params.knowledgeBaseCode,
	// 			"document-code": params.documentCode,
	// 		}),
	// 		params,
	// 	)
	// },

	/**
	 * 更新片段
	 */
	// updateFragment(params: Knowledge.UpdateFragmentParams) {
	// 	return fetch.put<Knowledge.Detail>(
	// 		genRequestUrl(RequestUrl.updateFragment, {
	// 			"knowledge-base-code": params.knowledgeBaseCode,
	// 			"document-code": params.documentCode,
	// 			id: params.id,
	// 		}),
	// 		params,
	// 	)
	// },

	/**
	 * 获取片段列表
	 */
	getFragmentList({ knowledgeCode, page, pageSize }: Knowledge.GetFragmentListParams) {
		return fetch.post<WithPage<Knowledge.FragmentItem[]>>(
			genRequestUrl(RequestUrl.getFragmentList),
			{
				knowledge_code: knowledgeCode,
				page,
				page_size: pageSize,
			},
		)
	},

	/**
	 * 获取片段详情
	 */
	// getFragmentDetail(params: Knowledge.GetFragmentDetailParams) {
	// 	return fetch.get<Knowledge.FragmentItem>(
	// 		genRequestUrl(RequestUrl.getFragmentDetail, {
	// 			"knowledge-base-code": params.knowledgeBaseCode,
	// 			"document-code": params.documentCode,
	// 			id: params.id,
	// 		}),
	// 	)
	// },

	/**
	 * 删除片段
	 */
	// deleteFragment(params: Knowledge.DeleteFragmentParams) {
	// 	return fetch.delete<{}>(
	// 		genRequestUrl(RequestUrl.deleteFragment, {
	// 			"knowledge-base-code": params.knowledgeBaseCode,
	// 			"document-code": params.documentCode,
	// 			id: params.id,
	// 		}),
	// 	)
	// },

	/**
	 * 获取可用的天书知识库列表
	 */
	getUseableTeamshareDatabaseList() {
		return fetch.get<WithPage<Knowledge.KnowledgeDatabaseItem[]>>(
			RequestUrl.getUseableTeamshareDatabaseList,
		)
	},

	/**
	 * 获取有权限的知识库的进度
	 */
	getTeamshareKnowledgeProgress(params: Knowledge.GetTeamshareKnowledgeProgressParams) {
		return fetch.post<WithPage<Knowledge.KnowledgeDatabaseProgress[]>>(
			RequestUrl.getTeamshareKnowledgeProgress,
			params,
		)
	},

	/**
	 * 发起知识库的向量创建
	 */
	createTeamshareKnowledgeVector(params: Knowledge.CreateTeamshareKnowledgeVectorParams) {
		return fetch.post<null>(RequestUrl.createTeamshareKnowledgeVector, params)
	},
})
