import { VisibleRangeType } from "@/types/bot"
import type { RadioChangeEvent } from "antd"
import { Flex, Form, Radio } from "antd"
import { memo, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import MagicButton from "@/opensource/components/base/MagicButton"
import { IconPlus, IconSitemap, IconX } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import { openModal } from "@/utils/react"
import type { OrganizationSelectItem } from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { StructureItemType } from "@/types/organization"
import { AddMemberModal } from "./AddMemberModal"
import { useStyles } from "./style"

interface VisibleRangeProps {
	selected: OrganizationSelectItem[]
	setSelected: React.Dispatch<React.SetStateAction<OrganizationSelectItem[]>>
}
const VisibleRange = memo(({ selected, setSelected }: VisibleRangeProps) => {
	const { t } = useTranslation("interface")
	const { styles } = useStyles()

	const [scope, setScope] = useState<VisibleRangeType>(VisibleRangeType.AllMember)

	const options = useMemo(
		() => [
			{
				value: VisibleRangeType.AllMember,
				label: t("explore.form.allMember"),
			},
			{
				value: VisibleRangeType.SpecifiedMemberOrDepartment,
				label: t("explore.form.specificMember"),
			},
		],
		[t],
	)

	const onSubmitAddMember = useMemoizedFn((checked: OrganizationSelectItem[]) => {
		setSelected(checked)
	})

	const handleAddMember = useMemoizedFn(() => {
		openModal(AddMemberModal, {
			selected,
			onSubmit: onSubmitAddMember,
		})
	})

	const handleChange = useMemoizedFn((e: RadioChangeEvent) => {
		setScope(e.target.value)
	})

	const handleRemove = (id: string) => {
		setSelected(selected.filter((item) => item.id !== id))
	}

	const getUserItem = useMemoizedFn((item: OrganizationSelectItem) => {
		switch (item.dataType) {
			case StructureItemType.User:
				return (
					<>
						<MagicAvatar src={item.avatar_url} size={18} />
						<div>{item.nickname || ""}</div>
					</>
				)
			case StructureItemType.Department:
				return (
					<>
						<MagicIcon
							color="currentColor"
							component={IconSitemap}
							size={18}
							className={styles.departmentIcon}
						/>
						<div>{item.name || ""}</div>
					</>
				)
			default:
				return null
		}
	})

	return (
		<Form.Item>
			<Flex vertical gap={10}>
				<Flex vertical>
					<div className={styles.title}>{t("explore.form.visibleRange")}</div>
					<div className={styles.desc}>{t("explore.form.visibleRangeDesc")}</div>
				</Flex>
				<Form.Item
					noStyle
					name={["visibility_config", "visibility_type"]}
					initialValue={scope}
				>
					<Radio.Group options={options} onChange={handleChange} />
				</Form.Item>
				{scope === VisibleRangeType.SpecifiedMemberOrDepartment && (
					<div className={styles.member}>
						<MagicButton
							icon={<IconPlus size={20} />}
							type="primary"
							ghost
							onClick={handleAddMember}
						>
							{t("explore.form.addMemberOrDepartment")}
						</MagicButton>
						<Flex gap={8} className={styles.memberList}>
							{selected.map((item) => (
								<Flex
									gap={4}
									key={item.id}
									className={styles.memberItem}
									align="center"
								>
									{getUserItem(item)}
									<MagicIcon
										component={IconX}
										size={16}
										onClick={() => handleRemove(item.id)}
									/>
								</Flex>
							))}
						</Flex>
					</div>
				)}
			</Flex>
		</Form.Item>
	)
})

export default VisibleRange
