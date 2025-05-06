import { useDeepCompareEffect } from "ahooks"
import { SafeArea } from "antd-mobile"
import { throttle } from "lodash-es"
import { memo, useRef, useState } from "react"
import MessageList from "@/opensource/pages/superMagic/components/MessageList/index"
import type { MessagePanelProps } from "../MessagePanel"
import MessagePanel from "@/opensource/pages/superMagic/components/MessagePanel/MessagePanel"
import { useStyles } from "./styles"

interface WorkspaceChatProps extends MessagePanelProps {
	data?: any
	selectedThreadInfo?: any
	handlePullMoreMessage?: () => void
	showLoading?: boolean
	onSelectDetail?: (detail: any) => void
	isEmptyStatus?: boolean
}

export default memo(function WorkspaceChat(props: WorkspaceChatProps) {
	const {
		data,
		selectedThreadInfo,
		handlePullMoreMessage,
		showLoading,
		onSelectDetail,
		isEmptyStatus,
		setFileList,
		...messagePanelProps
	} = props
	const { styles, cx } = useStyles()
	const footerRef = useRef<HTMLDivElement>(null)
	const nodesPanelRef = useRef<HTMLDivElement | null>(null)
	const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false)
	const scrollHeightRef = useRef<number>(0)
	const scrollTopRef = useRef<number>(0)

	// 保存滚动位置的函数
	const saveScrollPosition = () => {
		if (!nodesPanelRef.current) return
		const element = nodesPanelRef.current
		scrollHeightRef.current = element.scrollHeight
		scrollTopRef.current = element.scrollTop
	}

	// 优化滚动逻辑，使用 RAF 确保平滑滚动，并根据滚动条位置决定是否保持位置
	useDeepCompareEffect(() => {
		if (!nodesPanelRef.current || !data || data.length === 0) return

		const element = nodesPanelRef.current
		// 判断滚动条是否在底部或接近底部（距离底部50px以内）
		const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= 50

		if (isAtBottom) {
			// 如果在底部，则自动滚动到新内容
			setIsProgrammaticScroll(true)
			requestAnimationFrame(() => {
				element.scrollTo({
					top: element.scrollHeight,
					behavior: "smooth", // 可选
				})
				setIsProgrammaticScroll(false)
				saveScrollPosition()
			})
		} else if (scrollHeightRef.current > 0) {
			// 如果不在底部，且有之前的滚动高度记录
			// 计算滚动位置的偏移量以保持相对位置
			const heightDiff = element.scrollHeight - scrollHeightRef.current
			if (heightDiff > 0) {
				setIsProgrammaticScroll(true)
				requestAnimationFrame(() => {
					element.scrollTo({
						top: scrollTopRef.current + heightDiff,
						behavior: "auto", // 可选
					})
					setIsProgrammaticScroll(false)
					saveScrollPosition()
					// setTimeout(() => {

					// }, 100)
				})
			}
		}

		// 初次加载时保存滚动位置
		if (scrollHeightRef.current === 0) {
			saveScrollPosition()
		}
	}, [data.length])

	// 当selectedNodeId变化时，滚动到底部
	useDeepCompareEffect(() => {
		if (!nodesPanelRef.current || !selectedThreadInfo?.id) return

		const element = nodesPanelRef.current
		setIsProgrammaticScroll(true)
		setTimeout(() => {
			element.scrollTo({
				top: element.scrollHeight,
				behavior: "smooth", // 可选
			})
			setTimeout(() => {
				setIsProgrammaticScroll(false)
				saveScrollPosition()
			}, 100)
		}, 300)
	}, [selectedThreadInfo])

	// 添加滚动监听，当滚动到顶部时触发handlePullMoreMessage
	useDeepCompareEffect(() => {
		const handleScroll = throttle(() => {
			console.log("触发了handleScroll", nodesPanelRef.current?.scrollTop)
			if (!nodesPanelRef.current || isProgrammaticScroll) return

			// 保存用户手动滚动后的位置
			saveScrollPosition()

			if (nodesPanelRef.current.scrollTop <= 300 && handlePullMoreMessage) {
				handlePullMoreMessage()
			}
		}, 500)

		const element = nodesPanelRef.current
		if (element && handlePullMoreMessage) {
			element.addEventListener("scroll", handleScroll)
		}

		return () => {
			if (element && handlePullMoreMessage) {
				element.removeEventListener("scroll", handleScroll)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isProgrammaticScroll, nodesPanelRef])
	return (
		<div className={styles.container}>
			<div className={styles.body} ref={nodesPanelRef}>
				<MessageList
					data={data}
					setSelectedDetail={onSelectDetail}
					selectedThreadInfo={selectedThreadInfo}
					className={cx(isEmptyStatus && styles.emptyMessageWelcome)}
					handlePullMoreMessage={handlePullMoreMessage}
					showLoading={showLoading}
				/>
			</div>
			<div ref={footerRef} className={styles.footer}>
				<div className={styles.messagePanel}>
					<MessagePanel
						// {...messagePanelProps}
						showLoading={showLoading}
						selectedThreadInfo={selectedThreadInfo}
						setFileList={setFileList}
						onSendMessage={messagePanelProps.onSubmit}
						fileList={messagePanelProps.fileList}
						taskData={messagePanelProps.taskData}
						// textAreaWrapperClassName={messagePanelProps.textAreaWrapperClassName}
					/>
				</div>
			</div>
		</div>
	)
})
