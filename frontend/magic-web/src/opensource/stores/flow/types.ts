import type { MagicFlow } from "@dtyq/magic-flow/MagicFlow/types/flow"
import type { FlowDraft, LLMModalOption, UseableToolSet, Flow } from "@/types/flow"
import type { Knowledge } from "@/types/knowledge"
import type { DataSourceOption } from "@dtyq/magic-flow/common/BaseUI/DropdownRenderer/Reference"
import type { useFlowStore } from "."

export interface FlowState {
	subFlows: MagicFlow.Flow[]
	draftList: FlowDraft.ListItem[]
	publishList: FlowDraft.ListItem[]
	isGlobalVariableChanged: boolean
	toolInputOutputMap: Record<string, MagicFlow.Flow>
	useableToolSets: UseableToolSet.Item[]
	models: LLMModalOption[]
	useableDatabases: Knowledge.KnowledgeItem[]
	useableTeamshareDatabase: Knowledge.TeamshareKnowledgeItem[]
	methodsDataSource: DataSourceOption[]
	visionModels: Flow.VLMProvider[]
}

export type FlowStore = ReturnType<typeof useFlowStore>
