import type { AvatarProps, BadgeProps } from "antd"
import { Avatar, Badge } from "antd"
import { forwardRef, memo, useEffect, useMemo, useState } from "react"
import { isValidUrl } from "./utils"
import AvatarService from "@/opensource/services/chat/avatar"

export interface MagicAvatarProps extends AvatarProps {
	badgeProps?: BadgeProps
}

const MagicAvatar = memo(
	forwardRef<HTMLSpanElement, MagicAvatarProps>(
		({ children, src, size = 40, style, badgeProps, className, ...props }, ref) => {
			const [innerSrc, setInnerSrc] = useState<string | null>(
				isValidUrl(src as string) ? (src as string) : null,
			)

			useEffect(() => {
				if (typeof children === "string") {
					const res = AvatarService.drawTextAvatar(
						children,
						style?.backgroundColor,
						style?.color,
					)
					if (res && !isValidUrl(res)) {
						setInnerSrc(res)
					}
				}
			}, [children])

			const mergedStyle = useMemo(
				() => ({
					flex: "none",
					...style,
				}),
				[style],
			)

			// 处理图片加载失败
			const handleError = () => {
				if (typeof children === "string") {
					const res = AvatarService.drawTextAvatar(
						children,
						style?.backgroundColor,
						style?.color,
					)
					if (res) {
						setInnerSrc(res)
					}
					return true
				}
				return false
			}

			const avatarContent = (
				<Avatar
					ref={ref}
					style={mergedStyle}
					size={size}
					shape="square"
					draggable={false}
					className={className}
					src={innerSrc}
					onError={handleError}
					{...props}
				>
					{children}
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
