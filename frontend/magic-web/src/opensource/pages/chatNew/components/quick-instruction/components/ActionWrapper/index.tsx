import type { MagicIconProps } from "@/opensource/components/base/MagicIcon"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import IconWandColorful from "@/enhance/tabler/icons-react/icons/IconWandColorful"
import { IconWand } from "@tabler/icons-react"
import { Flex } from "antd"
import { createStyles } from "antd-style"
import type { HTMLAttributes } from "react"
import { memo } from "react"

const useStyles = createStyles(
	({ css, token, isDarkMode }, { disabled }: { disabled?: boolean }) => {
		return {
			instructionItem: css`
				padding: 4px 12px;
				cursor: pointer;
				user-select: none;
				flex-shrink: 0;

				${disabled &&
				`
          cursor: not-allowed;
          opacity: 0.5;
          pointer-events: none;
        `}

				&:hover {
					background: ${token.magicColorUsages.fill[0]};
				}
			`,
			active: css`
				color: ${isDarkMode ? token.colorWhite : token.colorPrimary};
				background: ${isDarkMode
					? token.magicColorScales.brand[1]
					: token.magicColorScales.brand[0]};
			`,
		}
	},
)

interface ActionWrapperProps extends HTMLAttributes<HTMLDivElement> {
	disabled?: boolean
	active?: boolean
	iconComponent?: MagicIconProps["component"]
}

const ActionWrapper = ({
	children,
	iconComponent,
	active = false,
	className,
	disabled,
	...rest
}: ActionWrapperProps) => {
	const { styles, cx } = useStyles({ disabled })

	return (
		<Flex
			className={cx(className, styles.instructionItem, active && styles.active)}
			align="center"
			gap={4}
			{...rest}
		>
			<MagicIcon
				component={iconComponent ?? (active ? IconWandColorful : IconWand)}
				color="currentColor"
				size={18}
			/>
			{children}
		</Flex>
	)
}

export default memo(ActionWrapper)
