import MagicInfiniteScrollList from "@/opensource/components/MagicInfiniteScrollList"
import type { MagicListItemData } from "@/opensource/components/MagicList/types"
import { useContactStore } from "@/opensource/stores/contact/hooks"
import type { GroupConversationDetailWithConversationId } from "@/types/chat/conversation"
import { StructureItemType } from "@/types/organization"
import { useControllableValue } from "ahooks"
import { memo, useMemo } from "react"
import type { OrganizationSelectItem } from "../MemberDepartmentSelectPanel/types"

type GroupSelectItem = OrganizationSelectItem & MagicListItemData

const itemsTransform = (item: GroupConversationDetailWithConversationId): GroupSelectItem => ({
	...item,
	dataType: StructureItemType.Group,
	title: item.group_name,
	avatar: item.group_avatar || {
		children: item.group_name,
	},
})

interface GroupSelectPanelProps {
	value: OrganizationSelectItem[]
	onChange: (value: OrganizationSelectItem[]) => void
	className?: string
	style?: React.CSSProperties
}

/**
 * 群组选择面板
 */
const GroupSelectPanel = memo((props: GroupSelectPanelProps) => {
	const { trigger, data } = useContactStore((s) => s.useUserGroups)()

	const [value, setValue] = useControllableValue<GroupSelectItem[]>(props, {
		defaultValue: [],
	})

	const checkboxOptions = useMemo(
		() => ({
			checked: value,
			onChange: setValue,
			dataType: StructureItemType.Group,
		}),
		[setValue, value],
	)

	return (
		<MagicInfiniteScrollList<GroupConversationDetailWithConversationId, GroupSelectItem>
			data={data}
			trigger={trigger}
			itemsTransform={itemsTransform}
			checkboxOptions={checkboxOptions}
			className={props.className}
			style={props.style}
			noDataFallback={<div />}
		/>
	)
})

export default GroupSelectPanel
