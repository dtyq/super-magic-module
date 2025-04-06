import { DefaultNodeVersion } from "@/MagicFlow/constants"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { copyToClipboard } from "@/MagicFlow/utils"
import { message } from "antd"
import { useMemoizedFn } from "ahooks"
import i18next from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import { useCurrentNode } from "../../context/CurrentNode/useCurrentNode"
import "./index.less"

type DebuggerCompProps = {
	id: string
}

export default function DebuggerComp({ id }: DebuggerCompProps) {
	const { t } = useTranslation()
	const { debuggerMode, nodeConfig } = useFlow()

	const clickNode = useMemoizedFn(() => {
		console.log("debug node", nodeConfig?.[id])
		copyToClipboard(id)
		message.success(i18next.t("common.copySuccess", { ns: "magicFlow" }))
	})

	const { currentNode } = useCurrentNode()

	return (
		<>
			{debuggerMode ? (
				<p className="debugger-id" onClick={clickNode}>
					<span>
						{i18next.t("flow.nodeId", { ns: "magicFlow" })}：{id}
					</span>
					<br />
					<span>
						{i18next.t("flow.nodeVersion", { ns: "magicFlow" })}：
						{currentNode?.node_version || DefaultNodeVersion}
					</span>

					{/* <br />
					<span>{width + "," + height}</span>
					<br />
					<span>{x + "," + y}</span> */}
				</p>
			) : null}
		</>
	)
}
