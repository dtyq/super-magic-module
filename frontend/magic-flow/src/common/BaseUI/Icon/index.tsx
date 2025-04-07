import { toCamelCase } from "@/common/utils"
import * as icons from "@tabler/icons-react"
import React from "react"

type Props = icons.IconProps & {
	name: string
}

export const MagicIcon = ({ name, ...props }: Props) => {
	if (!name) return null
	const iconName = toCamelCase(name)

	// @ts-ignore
	const Icon = icons[iconName] as unknown as IconProps

	if (!Icon) return null

	return <Icon name={name} {...props} />
}
