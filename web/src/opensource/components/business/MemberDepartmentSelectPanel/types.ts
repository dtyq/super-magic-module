import type { MagicModalProps } from "@/opensource/components/base/MagicModal"
import type { GroupConversationDetailWithConversationId } from "@/types/chat/conversation"
import type {
	WithIdAndDataType,
	StructureItem,
	StructureItemType,
	StructureUserItem,
} from "@/types/organization"

export type DepartmentSelectItem = WithIdAndDataType<StructureItem, StructureItemType.Department>

export type UserSelectItem = WithIdAndDataType<StructureUserItem, StructureItemType.User>

export type GroupSelectItem = WithIdAndDataType<
	GroupConversationDetailWithConversationId,
	StructureItemType.Group
>

export type PartnerSelectItem = WithIdAndDataType<{}, StructureItemType.Partner>

export type OrganizationSelectItem =
	| DepartmentSelectItem
	| UserSelectItem
	| GroupSelectItem
	| PartnerSelectItem

export type SelectedResult = Record<StructureItemType, OrganizationSelectItem[]>

export interface MemberDepartmentSelectPanelProps
	extends Omit<MagicModalProps, "onOk" | "onCancel"> {
	title?: string
	disabledValues?: OrganizationSelectItem[]
	selectValue?: OrganizationSelectItem[]
	initialSelectValue?: OrganizationSelectItem[]
	onSelectChange?: (value: OrganizationSelectItem[]) => void
	onOk?: (selected: SelectedResult) => void
	onCancel?: () => void
}
