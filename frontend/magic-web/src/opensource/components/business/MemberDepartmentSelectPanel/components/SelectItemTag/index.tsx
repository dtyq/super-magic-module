import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import MagicTag from "@/opensource/components/base/MagicTag"
import { IconSitemap } from "@tabler/icons-react"
import type { TagProps } from "antd"
import { Flex } from "antd"
import { createStyles } from "antd-style"
import { memo } from "react"
import { isDepartment, isGroup, isMember } from "../../../OrganizationPanel/utils"
import type { OrganizationSelectItem } from "../../types"

const useStyles = createStyles(({ css, token }) => ({
	tag: css`
		height: min-content;
	`,
	departmentIcon: css`
		color: white;
		border-radius: 4.5px;
		padding: 3px;
		background: ${token.magicColorScales.brand[5]};
	`,
}))

const SelectItemTag = memo(function SelectItemTag({
	data,
	onClose,
	...props
}: TagProps & { data: OrganizationSelectItem }) {
	const { styles } = useStyles()

	return (
		<MagicTag closable onClose={onClose} className={styles.tag} {...props}>
			{(() => {
				switch (true) {
					case isMember(data):
						return (
							<Flex align="center" gap={10}>
								<MagicAvatar size={20} src={data.avatar_url}>
									{data.real_name}
								</MagicAvatar>
								{data.real_name}
							</Flex>
						)
					case isDepartment(data):
						return (
							<Flex align="center" gap={10}>
								<MagicIcon
									color="currentColor"
									component={IconSitemap}
									size={18}
									className={styles.departmentIcon}
								/>
								{data.name}
							</Flex>
						)
					case isGroup(data):
						return (
							<Flex align="center" gap={10}>
								<MagicAvatar size={20} src={data.group_avatar} />
								{data.group_name}
							</Flex>
						)
					default:
						return null
				}
			})()}
		</MagicTag>
	)
})

export default SelectItemTag
