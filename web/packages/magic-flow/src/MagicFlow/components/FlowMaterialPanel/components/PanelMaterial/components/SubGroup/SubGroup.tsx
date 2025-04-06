import { prefix } from "@/MagicFlow/constants"
import { MaterialGroup } from "@/MagicFlow/context/MaterialSourceContext/MaterialSourceContext"
import { BaseNodeType, NodeGroup, NodeWidget } from "@/MagicFlow/register/node"
import { Collapse, Tooltip } from "antd"
import { IconChevronDown, IconHelp } from "@tabler/icons-react"
import clsx from "clsx"
import React, { ReactNode, useMemo } from "react"
import useAvatar from "../../MaterialItem/hooks/useAvatar"
import styles from "./SubGroup.module.less"

const { Panel } = Collapse

type SubGroupProps = {
	subGroup: NodeGroup | MaterialGroup
	getGroupNodeList: (nodeTypes: BaseNodeType[]) => NodeWidget[]
	materialFn: (n: NodeWidget, extraProps: Record<string, any>) => ReactNode
}

export default function SubGroup({ subGroup, getGroupNodeList, materialFn }: SubGroupProps) {
	const { AvatarComponent } = useAvatar({
		icon: subGroup?.icon || "",
		color: subGroup?.color || "",
		avatar: subGroup.avatar,
		showIcon: true,
	})

	const SubGroupHeader = useMemo(() => {
		return (
			<>
				{AvatarComponent}
				<span className={clsx(styles.title, `${prefix}title`)}>{subGroup.groupName}</span>
				{subGroup.desc && (
					<Tooltip title={subGroup.desc}>
						<IconHelp
							color="#1C1D2359"
							size={22}
							className={clsx(styles.help, `${prefix}help`)}
						/>
					</Tooltip>
				)}
			</>
		)
	}, [subGroup])

	const items = useMemo(() => {
		return getGroupNodeList((subGroup as NodeGroup)?.nodeTypes).map((n, i) => {
			return materialFn(n, {
				key: i,
				showIcon: false,
				inGroup: true,
			})
		})
	}, [subGroup, getGroupNodeList])

	return (
		<div className={clsx(styles.subGroup, `${prefix}sub-group`)}>
			<Collapse
				expandIcon={() => <IconChevronDown color="#1C1D2399" size={20} />}
				defaultActiveKey={subGroup.groupName}
			>
				<Panel header={SubGroupHeader} key={subGroup.groupName!}>
					{items}
				</Panel>
			</Collapse>
		</div>
	)
}
