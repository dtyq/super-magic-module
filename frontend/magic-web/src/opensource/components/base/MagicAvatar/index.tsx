import type { AvatarProps, BadgeProps } from "antd"
import { Avatar, Badge } from "antd"
import { forwardRef, memo, useMemo, useState } from "react"
import AvatarService from "@/opensource/services/chat/avatar"
import { useMemoizedFn } from "ahooks"

export interface MagicAvatarProps extends AvatarProps {
	badgeProps?: BadgeProps
}

const MagicAvatar = memo(
	forwardRef<HTMLSpanElement, MagicAvatarProps>(
		({ children, src, size = 40, style, badgeProps, className, ...props }, ref) => {
			const [innerSrc, setInnerSrc] = useState<string>(
				typeof src === "string" && src ? src : "",
			)

			const mergedStyle = useMemo(
				() => ({
					flex: "none",
					...style,
				}),
				[style],
			)

			const handleError = useMemoizedFn(() => {
				if (typeof children !== "string") {
					return
				}

				const res = AvatarService.drawTextAvatar(
					typeof children === "string" ? children : "未知",
					style?.backgroundColor,
					style?.color,
				)
				if (res) {
					setInnerSrc(res)
				}
			})

			const srcNode = useMemo(() => {
				return <img src={innerSrc} alt="" onError={handleError} />
			}, [handleError, innerSrc])

			const avatarContent = (
				<Avatar
					ref={ref}
					style={mergedStyle}
					size={size}
					shape="square"
					draggable={false}
					className={className}
					src={typeof src === "string" ? srcNode : src}
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
	),
)

export default MagicAvatar
