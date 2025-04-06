// 组织架构选择相关状态管理
import { useEffect, useMemo, useState } from "react"
import OrganizationPanel from "@/opensource/components/business/OrganizationPanel"
import type {
	OrganizationSelectItem,
	UserSelectItem,
} from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import { StructureItemType } from "@/types/organization"
import { useUserInfo } from "@/opensource/models/user/hooks"
import useStyles from "../../../../style"
import { defaultOperation } from "../../../../constants"
import { TargetTypes } from "../../../../types"
import { useAuthControl } from "../../../../AuthManagerModal/context/AuthControlContext"
import { getDisabledMemberIds } from "../../../../utils/authUtils"

export default function OrganizationSelectPanel() {
	const { styles } = useStyles()
	const { setAuthList, authList, originalAuthList } = useAuthControl()
	const { userInfo } = useUserInfo()
	const uId = userInfo?.user_id

	const [organizationChecked, setOrganizationChecked] = useState<OrganizationSelectItem[]>([])

	// 获取当前用户的权限
	const currentUserAuth = useMemo(() => {
		return authList.find((auth) => auth.target_id === uId)?.operation
	}, [authList, uId])

	useEffect(() => {
		// 从 authList 中提取已选择的部门和用户，并转换为对应的 OrganizationSelectItem 类型
		const selectedItems = authList
			.filter(
				(auth) =>
					auth.target_type === TargetTypes.Department ||
					auth.target_type === TargetTypes.User,
			)
			.map((auth) => {
				if (auth.target_type === TargetTypes.Department) {
					// 转换为 DepartmentSelectItem
					return {
						id: auth.target_id,
						name: auth.target_info?.name || "",
						dataType: StructureItemType.Department,
						operation: auth.operation,
					}
				}
				// 转换为 UserSelectItem
				return {
					id: auth.target_id,
					user_id: auth.target_id,
					nickname: auth.target_info?.name || "",
					real_name: auth.target_info?.name || "",
					avatar_url: auth.target_info?.icon || "",
					description: auth.target_info?.description || "",
					operation: auth.operation,
					dataType: StructureItemType.User,
				}
			})

		setOrganizationChecked(selectedItems as OrganizationSelectItem[])
	}, [authList])

	/**
	 * 组织架构面板选中状态
	 */
	const organizationPanelCheckboxOptions = useMemo(
		() => ({
			checked: organizationChecked,
			onChange: (value: OrganizationSelectItem[]) => {
				setOrganizationChecked(value)
				// @ts-ignore
				setAuthList((prevAuthList) => {
					// 过滤掉原有的部门和用户
					const filteredAuthList = prevAuthList.filter((auth) => {
						return (
							auth.target_type !== TargetTypes.Department &&
							auth.target_type !== TargetTypes.User
						)
					})

					// 添加新选择的部门和用户
					const newItems = value
						.map((item) => {
							if (item.dataType === StructureItemType.Department) {
								// 处理部门
								return {
									target_id: item.id,
									// @ts-ignore
									operation: item.operation || defaultOperation,
									target_type: TargetTypes.Department,
									target_info: {
										id: item.id,
										name: item.name,
										description: "",
										icon: "",
									},
								}
							}
							if (item.dataType === StructureItemType.User) {
								// 处理用户
								const userItem = item as UserSelectItem
								return {
									target_id: item.user_id,
									// @ts-ignore
									operation: item.operation || defaultOperation,
									target_type: TargetTypes.User,
									target_info: {
										id: item.user_id,
										name: item.nickname || item.real_name,
										description: userItem.description || "",
										icon: userItem.avatar_url || "",
										// 可以添加用户特有的信息
									},
								}
							}
							// 如果有其他类型，可以在这里处理
							return null
						})
						.filter(Boolean) // 过滤掉可能的 null 值

					return [...filteredAuthList, ...newItems]
				})
			},
			disabled: getDisabledMemberIds(originalAuthList, uId!, currentUserAuth),
		}),
		[organizationChecked, originalAuthList, setAuthList, currentUserAuth, uId],
	)

	return (
		<OrganizationPanel
			className={styles.organizationList}
			checkboxOptions={{
				...organizationPanelCheckboxOptions,
				disabled: organizationPanelCheckboxOptions.disabled.map((item) => ({
					...item,
					dataType: StructureItemType.Partner,
				})),
			}}
		/>
	)
}
