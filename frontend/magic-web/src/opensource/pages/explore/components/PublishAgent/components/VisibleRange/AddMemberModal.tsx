import { useMemoizedFn } from "ahooks"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { OrganizationSelectItem } from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import type { OpenableProps } from "@/utils/react"
import MemberDepartmentSelectPanel from "@/opensource/components/business/MemberDepartmentSelectPanel"

import { StructureItemType } from "@/types/organization"
import { message } from "antd"

export interface UserSelectProps {
	selected?: OrganizationSelectItem[]
	onSubmit: (checked: OrganizationSelectItem[]) => void
	onClose?: () => void
}

export const AddMemberModal = ({ selected, onSubmit, onClose }: OpenableProps<UserSelectProps>) => {
	const { t } = useTranslation("interface")
	const [open, setOpen] = useState(true)

	const [organizationChecked, setOrganizationChecked] = useState<OrganizationSelectItem[]>([])

	const selectedCount = useMemo(() => {
		return organizationChecked.reduce((acc, curr) => {
			if (curr.dataType === StructureItemType.Department) {
				return acc + 1
			}
			return acc + 1
		}, 0)
	}, [organizationChecked])

	const onCancel = useMemoizedFn(() => {
		setOpen(false)
		onClose?.()
	})

	const onOk = useMemoizedFn(async () => {
		if (selectedCount <= 0) {
			message.warning(t("chat.groupSetting.addMember.PleaseSelectAtLeastOneMember"))
			return
		}

		await onSubmit(organizationChecked)
		onCancel()
	})

	useEffect(() => {
		if (selected?.length) {
			setOrganizationChecked(selected)
		}
	}, [selected])

	return (
		<MemberDepartmentSelectPanel
			title={t("explore.form.addMemberOrDepartment")}
			open={open}
			selectValue={organizationChecked}
			onSelectChange={setOrganizationChecked}
			onOk={onOk}
			onCancel={onCancel}
		/>
	)
}
