import type { MagicModalProps } from "@/opensource/components/base/MagicModal"

/** 分享类型 */
export enum ShareType {
	OnlySelf = 1,
	Organization = 2,
	DepartmentOrMember = 3,
	Internet = 4,
}

/** 分享上下文类型 */
export enum ShareContextType {
	/** 话题 */
	Topic = 1,
}
export enum ResourceType {
	/** 话题 */
	Topic = 5,
}

/** 分享上下文 */
export type ShareContext = TopicShareContext

/** 分享上下文 - 话题 */
export interface TopicShareContext {
	resource_type: ResourceType.Topic
	resource_id: string
}

export interface ShareProps {
	shareContext: ShareContext
	types: ShareType[]
	type: ShareType
	onChangeType?: (type: ShareType) => void
	extraData?: any
	setExtraData?: (extraData: any) => void
	/** 获取分享设置验证函数 */
	getValidateShareSettings?: (validate: () => boolean) => void
	handleOk?: (type: ShareType, extraData?: any) => void
}

export interface ShareModalProps extends Omit<ShareProps, "type">, MagicModalProps {
	afterSubmit?: ({ type, extraData }: { type: ShareType; extraData: any }) => void
}
