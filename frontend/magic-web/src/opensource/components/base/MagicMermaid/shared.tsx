import eventBus from "@/utils/bridge/eventBus"
import type { BridgeEventData } from "@/utils/bridge/types"
import { BridgeCallNativeEvent, BridgeEventType } from "@/utils/bridge/types"
import { memo, useEffect, useState } from "react"
import { getJSBridge } from "@/utils/bridge/utils"
import { createStyles } from "antd-style"
import mermaid from "mermaid"
import { nanoid } from "nanoid"
import { convertSvgToPng } from "@/utils/image"
import MagicMermaid from "."

const useStyles = createStyles(({ css }) => ({
	mindMap: css`
		width: 100vw;
		height: 100vh;
	`,
}))

/**
 * 获取svg数据
 * @param data
 * @returns
 */
const getSvgData = (data: string) => {
	mermaid.initialize({ startOnLoad: false })
	const dom = document.createElement("div")
	const id = `mermaid-js-bridge/${nanoid()}`
	dom.setAttribute("id", id)
	dom.innerHTML = data
	return mermaid.render(id, data).then(({ svg }) => {
		return svg
	})
}

const MagicMermaidShared = memo(function MagicMermaidShared() {
	const [mermaidData, setMermaidData] = useState<string>("")
	const { styles } = useStyles()

	useEffect(() => {
		const callback = (event: BridgeEventData[BridgeEventType.InjectMermaidData]) => {
			setMermaidData(event.data)
		}
		eventBus.on(BridgeEventType.InjectMermaidData, callback)
		return () => {
			eventBus.off(BridgeEventType.InjectMermaidData, callback)
		}
	}, [])

	useEffect(() => {
		const callback = async (event: BridgeEventData[BridgeEventType.GetMermaidImage]) => {
			try {
				const svg = await getSvgData(event.data)
				const png = await convertSvgToPng(svg, event?.width, event?.height)
				getJSBridge()?.callNative(BridgeCallNativeEvent.getMermaidImage, png)
			} catch (err) {
				console.error("获取思维导图图片失败", err)
			}
		}

		eventBus.on(BridgeEventType.GetMermaidImage, callback)
		return () => {
			eventBus.off(BridgeEventType.GetMermaidImage, callback)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	if (!mermaidData) return null

	return (
		<MagicMermaid
			data={mermaidData}
			className={styles.mindMap}
			allowShowCode={false}
			copyText="复制"
		/>
	)
})

export default MagicMermaidShared
