import type { MagicListItemProps } from "@/opensource/components/MagicList/MagicListItem"
import type MagicListItem from "@/opensource/components/MagicList/MagicListItem"
import { useHover } from "ahooks"
import { Flex } from "antd"
import { createStyles } from "antd-style"
import { memo, useRef } from "react"

const useStyles = createStyles(({ css, token }) => ({
	container: css`
		background-color: ${token.magicColorScales.grey[0]};
		color: ${token.magicColorUsages.text[0]};
		min-height: 50px;
		padding: 0 12px;
		font-size: 14px;
		font-weight: 400;
		line-height: 20px;

		&:not(:last-child) {
			border-bottom: 1px solid ${token.colorBorder};
		}
	`,
	title: css`
		flex-shrink: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	`,
	extra: css`
		flex-shrink: 0;
	`,
}))

const SettingListItem = memo(({ data, className, onClick, ...props }: MagicListItemProps) => {
	const { styles, cx } = useStyles()

	const ref = useRef<HTMLDivElement>(null)
	const isHover = useHover(ref)

	return (
		<Flex
			ref={ref}
			align="center"
			justify="space-between"
			gap={4}
			className={cx(styles.container, className)}
			onClick={() => onClick?.(data)}
			{...props}
		>
			<div className={styles.title}>
				{typeof data.title === "function" ? data.title(isHover) : data.title}
			</div>
			{typeof data.extra === "function" ? data.extra(isHover) : data.extra}
		</Flex>
	)
})

export default SettingListItem as typeof MagicListItem
