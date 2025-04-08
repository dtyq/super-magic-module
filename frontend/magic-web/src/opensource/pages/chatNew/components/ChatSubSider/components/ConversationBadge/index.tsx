import type { BadgeProps } from "antd"
import { Badge } from "antd"
import { memo, useMemo } from "react"

const ConversationBadge = memo(
	({ count = 0, children, ...props }: BadgeProps & { count?: number }) => {
		const offset = useMemo<[number, number]>(() => {
			if (count && count > 99) {
				return [-30, 0]
			}
			return [-40, 0]
		}, [count])

		return (
			<Badge offset={offset} count={count} {...props}>
				{children}
			</Badge>
		)
	},
)

export default ConversationBadge
