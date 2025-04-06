import { RequestUrl } from "@/opensource/apis/constant"
import type {
	FlowDraft,
	PlatformItem,
	TestResult,
	TriggerConfig,
	WithPage,
	FlowTool,
	GetFlowListParams,
	UseableToolSet,
	LLMModalOption,
	Flow,
} from "@/types/flow"
import type { MagicFlow } from "@dtyq/magic-flow/MagicFlow/types/flow"
import type { SWRResponse } from "swr"
import useSWR from "swr"
import { create } from "zustand"
import type { Knowledge } from "@/types/knowledge"
import type { DataSourceOption } from "@dtyq/magic-flow/common/BaseUI/DropdownRenderer/Reference"
import { FlowApi } from "@/apis"
import type { FlowState } from "./types"

const defaultState: FlowState = {
	subFlows: [],
	draftList: [],
	publishList: [],
	isGlobalVariableChanged: false,
	toolInputOutputMap: {},
	useableToolSets: [],
	models: [],
	useableDatabases: [],
	useableTeamshareDatabase: [],
	methodsDataSource: [],
	visionModels: [], // 添加视觉理解模型数组
}

export interface FlowStoreState {
	subFlows: MagicFlow.Flow[]
	draftList: FlowDraft.ListItem[]
	publishList: FlowDraft.ListItem[]
	useableToolSets: UseableToolSet.Item[]
	models: LLMModalOption[]
	useableDatabases: Knowledge.KnowledgeItem[]
	useableTeamshareDatabase: Knowledge.TeamshareKnowledgeItem[]
	methodsDataSource: DataSourceOption[]
	toolInputOutputMap: Record<string, MagicFlow.Flow>
	visionModels: Flow.VLMProvider[] // 使用Flow命名空间下的类型
	updateVisionModels: (visionModels: Flow.VLMProvider[]) => void // 使用Flow命名空间下的类型
	updateToolInputOutputMap: (toolInputOutputMap: Record<string, MagicFlow.Flow>) => void
	updateMethodDataSource: (dataSource: DataSourceOption[]) => void
	updateSubFlowList: (flows: MagicFlow.Flow[]) => void
	updateUseableTeamshareDatabase: (databases: Knowledge.TeamshareKnowledgeItem[]) => void
	updateUseableDatabases: (databases: Knowledge.KnowledgeItem[]) => void
	updateModels: (models: LLMModalOption[]) => void
	updateUseableToolSets: (toolSets: UseableToolSet.Item[]) => void
	useFlowList: (params: GetFlowListParams) => SWRResponse<WithPage<MagicFlow.Flow[]>>
	updateFlowDraftList: (flowList: FlowDraft.ListItem[]) => void
	updateFlowPublishList: (flowList: FlowDraft.ListItem[]) => void
	useFlowDetail: (flowId: string) => SWRResponse<MagicFlow.Flow>
	useTestFlow: (
		flow: MagicFlow.Flow & { trigger_config: TriggerConfig & { debug: boolean } },
	) => SWRResponse<TestResult>
	useGetOpenApiAccountList: (flowId: string) => SWRResponse<WithPage<PlatformItem[]>>
	useGetOpenPlatformAccountsOfMine: () => SWRResponse<WithPage<PlatformItem[]>>
	useFlowToolList: (params: FlowTool.GetToolListParams) => SWRResponse<WithPage<MagicFlow.Flow[]>>
	isGlobalVariableChanged: boolean
	updateIsGlobalVariableChanged: (value: boolean) => void
}
export const useFlowStore = create<FlowStoreState>((set) => ({
	...defaultState,
	useFlowList: (params: GetFlowListParams) => {
		return useSWR(RequestUrl.getFlowList, () => FlowApi.getFlowList(params))
	},

	useFlowDetail: (flowId: string) => {
		return useSWR(`${RequestUrl.getFlow}/${flowId}`, () => FlowApi.getFlow(flowId))
	},

	useTestFlow: (
		flow: MagicFlow.Flow & { trigger_config: TriggerConfig & { debug: boolean } },
	) => {
		return useSWR(RequestUrl.testFlow, () => FlowApi.testFlow(flow))
	},

	useGetOpenApiAccountList: (flowId: string) => {
		return useSWR(RequestUrl.getOpenApiAccountList, () => FlowApi.getOpenApiAccountList(flowId))
	},

	useGetOpenPlatformAccountsOfMine: () => {
		return useSWR(RequestUrl.getOpenApiAccountList, () => FlowApi.getOpenPlatformOfMine())
	},

	updateFlowDraftList: (flowList: FlowDraft.ListItem[]) => {
		set(() => ({
			draftList: flowList,
		}))
	},

	updateFlowPublishList: (flowList: FlowDraft.ListItem[]) => {
		set(() => ({
			publishList: flowList,
		}))
	},

	useFlowToolList: ({ page, pageSize, name }: FlowTool.GetToolListParams) => {
		return useSWR(RequestUrl.getToolList, () =>
			FlowApi.getToolList({
				page,
				pageSize,
				name,
			}),
		)
	},

	updateIsGlobalVariableChanged: (changed: boolean) => {
		set({
			isGlobalVariableChanged: changed,
		})
	},

	updateUseableToolSets: (toolSets: UseableToolSet.Item[]) => {
		set({
			useableToolSets: toolSets,
		})
	},

	updateModels: (models: LLMModalOption[]) => {
		set({
			models,
		})
	},

	updateUseableDatabases: (databases: Knowledge.KnowledgeItem[]) => {
		set({
			useableDatabases: databases,
		})
	},

	updateUseableTeamshareDatabase: (databases: Knowledge.TeamshareKnowledgeItem[]) => {
		set({
			useableTeamshareDatabase: databases,
		})
	},

	updateSubFlowList: (flowList: MagicFlow.Flow[]) => {
		set({
			subFlows: flowList,
		})
	},

	updateMethodDataSource: (dataSource: DataSourceOption[]) => {
		set({
			methodsDataSource: dataSource,
		})
	},

	updateVisionModels: (visionModels: Flow.VLMProvider[]) => {
		set({
			visionModels,
		})
	},

	updateToolInputOutputMap: (toolInputOutputMap: Record<string, MagicFlow.Flow>) => {
		set({
			toolInputOutputMap,
		})
	},
}))
