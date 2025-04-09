import type { AvatarProps, BadgeProps } from "antd"
import { Avatar, Badge } from "antd"
import { forwardRef, memo, useMemo } from "react"
import { useStyles } from "./style"
import { isValidUrl } from "./utils"

export interface MagicAvatarProps extends AvatarProps {
	badgeProps?: BadgeProps
}

const MagicAvatar = memo(
	forwardRef<HTMLSpanElement, MagicAvatarProps>(
		({ children, src, size = 40, style, badgeProps, className, ...props }, ref) => {
			const isUrl = useMemo(() => {
				return typeof src === "string" ? isValidUrl(src) : true
			}, [src])

			const isStringChildren = useMemo(() => typeof children === "string", [children])

			const displayChildren = useMemo(() => {
				if (isStringChildren && children) {
					return (children as string).slice(0, 2)
				}
				return children
			}, [children, isStringChildren])

			const mergedStyle = useMemo(
				() => ({
					flex: "none",
					...style,
				}),
				[style],
			)

			const { styles, cx } = useStyles({
				url: typeof src === "string" && isUrl ? src : "",
				content: isStringChildren ? (children as string) || "" : "",
			})

			const avatarClassNames = useMemo(
				() => cx(styles.avatar, className),
				[styles.avatar, className, cx],
			)

			const avatarContent = (
				<Avatar
					ref={ref}
					style={mergedStyle}
					size={size}
					shape="square"
					draggable={false}
					className={avatarClassNames}
					src={src}
					{...props}
				>
					{displayChildren}
				</Avatar>
			)

			if (!badgeProps) {
				return avatarContent
			}

			return (
				<Badge offset={[-size, 0]} {...badgeProps}>
					{avatarContent}
				</Badge>
			)
		},
	),
)

export default MagicAvatar
