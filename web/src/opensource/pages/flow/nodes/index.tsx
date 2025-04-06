import type { ReactNode } from "react"
import { customNodeType } from "../constants"
import { BranchComponentVersionMap } from "./Branch"
import { CacheGetterComponentVersionMap } from "./CacheGetter"
import { CacheSetterComponentVersionMap } from "./CacheSetter"
import { CodeComponentVersionMap } from "./Code"
import { EndComponentVersionMap } from "./End"
import { ExcelComponentVersionMap } from "./Excel"
import { GroupChatComponentVersionMap } from "./GroupChat"
import { HTTPComponentVersionMap } from "./HTTP"
import { IntentionRecognitionComponentVersionMap } from "./IntentionRecognition"
import { KnowledgeSearchComponentVersionMap } from "./KnowledgeSearch"
import { LLMComponentVersionMap } from "./LLM"
import { LLMCallComponentVersionMap } from "./LLMCall"
import { LoaderComponentVersionMap } from "./Loader"
import { LoopComponentVersionMap } from "./Loop"
import { MessageSearchComponentVersionMap } from "./MessageSearch"
import {
	RecordAddOperationComponentVersionMap,
	RecordDeleteOperationComponentVersionMap,
	RecordSearchOperationComponentVersionMap,
	RecordUpdateOperationComponentVersionMap,
} from "./RecordOperation"
import { ReplyComponentVersionMap } from "./Reply"
import { SearchUsersComponentVersionMap } from "./SearchUsers"
import { StartComponentVersionMap } from "./Start"
import { SubFlowComponentVersionMap } from "./SubFlow"
import { Text2ImageComponentVersionMap } from "./Text2Image"
import { TextSplitComponentVersionMap } from "./TextSplit"
import { ToolsComponentVersionMap } from "./Tools"
import { VariableSaveComponentVersionMap } from "./VariableSave"
import { VectorComponentVersionMap } from "./Vector"
import { VectorSearchComponentVersionMap } from "./VectorSearch"
import { WaitForReplyComponentVersionMap } from "./WaitForReply"
import { VectorDeleteComponentVersionMap } from "./VectorDelete"
import { VectorDatabaseMatchComponentVersionMap } from "./VectorDatabaseMatch"
import { LoopBodyComponentVersionMap } from "./LoopBody"
import { AgentComponentVersionMap } from "./Agent"
import { DocumentResolveComponentVersionMap } from "./DocumentResolve"
import { LoopEndComponentVersionMap } from "./LoopEnd"

export type ComponentVersionMap = {
	component: () => JSX.Element
	headerRight: ReactNode
}

type Version = string

export const nodeComponentVersionMap: Record<
	customNodeType,
	Record<Version, ComponentVersionMap>
> = {
	[customNodeType.Agent]: AgentComponentVersionMap,
	[customNodeType.If]: BranchComponentVersionMap,
	[customNodeType.CacheGetter]: CacheGetterComponentVersionMap,
	[customNodeType.CacheSetter]: CacheSetterComponentVersionMap,
	[customNodeType.Code]: CodeComponentVersionMap,
	[customNodeType.End]: EndComponentVersionMap,
	[customNodeType.Excel]: ExcelComponentVersionMap,
	[customNodeType.GroupChat]: GroupChatComponentVersionMap,
	[customNodeType.HTTP]: HTTPComponentVersionMap,
	[customNodeType.IntentionRecognition]: IntentionRecognitionComponentVersionMap,
	[customNodeType.KnowledgeSearch]: KnowledgeSearchComponentVersionMap,
	[customNodeType.LLM]: LLMComponentVersionMap,
	[customNodeType.LLMCall]: LLMCallComponentVersionMap,
	[customNodeType.Loader]: LoaderComponentVersionMap,
	[customNodeType.Loop]: LoopComponentVersionMap,
	[customNodeType.LoopBody]: LoopBodyComponentVersionMap,
	[customNodeType.LoopEnd]: LoopEndComponentVersionMap,
	[customNodeType.MessageSearch]: MessageSearchComponentVersionMap,
	[customNodeType.AddRecord]: RecordAddOperationComponentVersionMap,
	[customNodeType.UpdateRecord]: RecordUpdateOperationComponentVersionMap,
	[customNodeType.DeleteRecord]: RecordDeleteOperationComponentVersionMap,
	[customNodeType.FindRecord]: RecordSearchOperationComponentVersionMap,
	[customNodeType.ReplyMessage]: ReplyComponentVersionMap,
	[customNodeType.SearchUsers]: SearchUsersComponentVersionMap,
	[customNodeType.Start]: StartComponentVersionMap,
	[customNodeType.Sub]: SubFlowComponentVersionMap,
	[customNodeType.Text2Image]: Text2ImageComponentVersionMap,
	[customNodeType.TextSplit]: TextSplitComponentVersionMap,
	[customNodeType.Tools]: ToolsComponentVersionMap,
	[customNodeType.VariableSave]: VariableSaveComponentVersionMap,
	[customNodeType.VectorStorage]: VectorComponentVersionMap,
	[customNodeType.VectorDatabaseMatch]: VectorDatabaseMatchComponentVersionMap,
	[customNodeType.VectorDelete]: VectorDeleteComponentVersionMap,
	[customNodeType.VectorSearch]: VectorSearchComponentVersionMap,
	[customNodeType.WaitForReply]: WaitForReplyComponentVersionMap,
	[customNodeType.MessageMemory]: ReplyComponentVersionMap,
	[customNodeType.DocumentResolve]: DocumentResolveComponentVersionMap,
	[customNodeType.Instructions]: DocumentResolveComponentVersionMap,
}
