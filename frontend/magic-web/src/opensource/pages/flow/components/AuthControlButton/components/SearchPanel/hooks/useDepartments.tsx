// 组织架构选择相关状态管理

import { useMemo, useState } from "react"
import OrganizationPanel from "@/opensource/components/business/OrganizationPanel"
import type { OrganizationSelectItem } from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import useStyles from "../../../style"

export default function useDepartments() {
	const { styles } = useStyles()

	const [organizationChecked, setOrganizationChecked] = useState<OrganizationSelectItem[]>([])

	/**
	 * 组织架构面板选中状态
	 */
	const organizationPanelCheckboxOptions = useMemo(
		() => ({
			checked: organizationChecked,
			onChange: setOrganizationChecked,
			disabled: [],
		}),
		[organizationChecked],
	)

	const OrganizationSelectPanel = useMemo(() => {
		return (
			<OrganizationPanel
				className={styles.organizationList}
				checkboxOptions={organizationPanelCheckboxOptions}
			/>
		)
	}, [organizationPanelCheckboxOptions, styles.organizationList])

	return {
		OrganizationSelectPanel,
		organizationChecked,
		setOrganizationChecked,
	}
}
