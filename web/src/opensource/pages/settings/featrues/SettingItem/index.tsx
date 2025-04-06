import { Flex } from "antd"
import { createStyles } from "antd-style"
import { memo, type ReactNode } from "react"

const useSettingItemStyles = createStyles(({ css, isDarkMode, token }) => {
	return {
		container: css`
			padding: 12px 20px;
			&:not(:last-child) {
				border-bottom: 1px solid ${token.colorBorder};
			}
		`,
		title: css`
			color: ${isDarkMode ? token.magicColorScales.grey[8] : token.magicColorUsages.text[1]};
			font-size: 16px;
			font-weight: 400;
			line-height: 22px;
			min-width: 200px;
		`,
		description: css`
			color: ${isDarkMode ? token.magicColorScales.grey[4] : token.magicColorUsages.text[3]};
			font-size: 14px;
			font-weight: 400;
			line-height: 20px;
		`,
		extra: css`
			min-width: 270px;
		`,
	}
})
interface SettingItemProps {
	icon?: ReactNode
	title: ReactNode
	description?: ReactNode
	extra?: ReactNode
}

const SettingItem = memo(({ icon, title, description, extra }: SettingItemProps) => {
	const { styles } = useSettingItemStyles()
	return (
		<Flex align="center" justify="space-between" className={styles.container}>
			<Flex align="center" gap={10}>
				{icon}
				<Flex justify="center" vertical gap={2} flex={1}>
					<div className={styles.title}>{title}</div>
					{description ? <div className={styles.description}>{description}</div> : null}
				</Flex>
			</Flex>
			<Flex className={styles.extra} align="center" justify="flex-end">
				{extra}
			</Flex>
		</Flex>
	)
})

export default SettingItem
