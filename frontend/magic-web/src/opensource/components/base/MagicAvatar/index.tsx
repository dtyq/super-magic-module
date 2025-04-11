import type { AvatarProps, BadgeProps } from "antd"
import { Avatar, Badge } from "antd"
import { forwardRef, useEffect, useMemo, useState } from "react"
import AvatarService from "@/opensource/services/chat/avatar"
import { useMemoizedFn } from "ahooks"
import { createStyles } from "antd-style"

export interface MagicAvatarProps extends AvatarProps {
	badgeProps?: BadgeProps
}

const useStyles = createStyles(({ token }) => ({
	avatar: {
		backgroundColor: token.magicColorScales.white,
	},
}))

const MagicAvatar = forwardRef<HTMLSpanElement, MagicAvatarProps>(
	({ children, src, size = 40, style, badgeProps, className, ...props }, ref) => {
		const { styles } = useStyles()

		const [innerSrc, setInnerSrc] = useState<string>(src && typeof src === "string" ? src : "")

		useEffect(() => {
			setInnerSrc(typeof src === "string" && src ? src : "")
		}, [src])

		const mergedStyle = useMemo(
			() => ({
				flex: "none",
				...style,
			}),
			[style],
		)

		const handleError = useMemoizedFn(() => {
			const text = typeof children === "string" ? children : "未知"

			const res = AvatarService.drawTextAvatar(text, style?.backgroundColor, style?.color)
			if (res) {
				setInnerSrc(res)
			}
		})

		const srcNode = useMemo(() => {
			return (
				<img
					src={innerSrc}
					className={styles.avatar}
					alt={typeof children === "string" ? children : "avatar"}
					onError={handleError}
				/>
			)
		}, [children, handleError, innerSrc, styles.avatar])

		const avatarContent = (
			<Avatar
				ref={ref}
				style={mergedStyle}
				size={size}
				shape="square"
				draggable={false}
				className={className}
				src={typeof src === "object" ? src : srcNode}
				{...props}
			/>
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
)

export default MagicAvatar
