import type { AvatarProps, BadgeProps } from "antd"
import { Avatar, Badge } from "antd"
import { createStyles } from "antd-style"
import { forwardRef, memo } from "react"
import { textToTextColor, textToBackgroundColor } from "./utils"

const isValidUrl = (url: string) => {
	return /^https?:\/\//.test(url)
}

export interface MagicAvatarProps extends AvatarProps {
	badgeProps?: BadgeProps
}

const useStyles = createStyles(
	({ css, token }, { url, content }: { url: string; content: string }) => {
		return {
			avatar: css`
				user-select: none;
				border: 1px solid ${token.magicColorUsages.border};
				font-weight: 500;
				text-shadow: 0px 1px 1px #00000030;
				${!url
					? `
        background: ${textToBackgroundColor(content)};
        color: ${textToTextColor(content)};
      `
					: ""}
			`,
		}
	},
)

const MagicAvatar = memo(
	forwardRef<HTMLSpanElement, MagicAvatarProps>(
		({ children, src, size = 40, style, badgeProps, className, ...props }, ref) => {
			const isUrl = typeof src === "string" ? isValidUrl(src) : true
			const { styles, cx } = useStyles({
				url: typeof src === "string" && isUrl ? src : "",
				content: typeof children === "string" ? children : "",
			})
			return (
				<Badge offset={[-size, 0]} {...badgeProps}>
					<Avatar
						ref={ref}
						style={{ flex: "none", ...style }}
						size={size}
						shape="square"
						draggable={false}
						className={cx(styles.avatar, className)}
						src={isUrl ? src : undefined}
						{...props}
					>
						{typeof children === "string" ? children.slice(0, 2) : children}
					</Avatar>
				</Badge>
			)
		},
	),
)

export default MagicAvatar
