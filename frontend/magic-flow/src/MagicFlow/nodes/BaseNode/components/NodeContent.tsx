import { Skeleton } from "antd"
import clsx from "clsx"
import React, { memo } from "react"
import { prefix } from "@/MagicFlow/constants"
import styles from "../index.module.less"

interface NodeContentProps {
	showParamsComp: boolean
	ParamsComp: React.ComponentType | null
}

const NodeContent = memo(({ showParamsComp, ParamsComp }: NodeContentProps) => {
	return (
		<div
			className={clsx(styles.paramsComp, `${prefix}params-comp`, {
				[styles.isEmpty]: !showParamsComp,
				"is-empty": !showParamsComp,
			})}
		>
			{ParamsComp && showParamsComp && <ParamsComp />}
			{!showParamsComp && (
				<>
					<Skeleton />
					<Skeleton />
				</>
			)}
		</div>
	)
})

export default NodeContent
