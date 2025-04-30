import { messageFilter } from "@/opensource/pages/superMagic/utils/handleMessage"
import { isEmpty, pick } from "lodash-es"
import { Attachment } from "../MessageAttachment"
import NodeHeader from "../NodeHeader"
import Text from "../Text"
import Tool from "../Tool"
import { useStyles } from "./style"

interface NodeProps {
	node: any
	prevNode?: any
	onSelectDetail?: (detail: any) => void
	isSelected?: boolean
	isShare?: boolean
}

const Node = ({ node, prevNode, onSelectDetail, isSelected, isShare }: NodeProps) => {
	const { styles } = useStyles()
	const parentNodeRole = prevNode?.role
	const isUser = node?.role !== "assistant"
	// 判断是否需要显示 NodeHeader
	// 如果没有前一条消息，或者当前消息的 role 与前一条消息的 role 不同，则显示头部
	const shouldShowHeader = !prevNode || parentNodeRole !== node.role
	// 调用onSelectDetail时检查是否为选中节点并添加isFromNode标记
	const handleSelectDetail = (detail: any) => {
		// 确保onSelectDetail存在，且节点被选中或选中状态未定义
		if (onSelectDetail && (isSelected || isSelected === undefined)) {
			onSelectDetail({
				...detail,
				isFromNode: true,
			})
		}
	}
	const handleClick = () => {
		console.log(node, "handleClickhandleClick")
		if (!isEmpty(node?.tool?.detail)) {
			const toolInfo = pick(node.tool, ["name", "url", "action", "remark"])
			handleSelectDetail({ ...node.tool.detail, ...toolInfo })
		}
	}
	// }

	return (
		<>
			{shouldShowHeader && (
				<NodeHeader
					isUser={isUser}
					timestamp={node?.send_timestamp || node?.send_time}
					isShare={isShare}
				/>
			)}
			{messageFilter(node) ? null : (
				<div
					className={`${styles.defaultNode} ${
						isUser ? styles.userNode : styles.agentNode
					}`}
					onClick={handleClick}
					data-has-detail={!isEmpty(node?.tool?.detail)}
				>
					{!isEmpty(node?.tool) && <Tool data={node?.tool} />}
					{node?.status === "finished" && node?.tool?.attachments && (
						<Attachment
							attachments={node?.tool?.attachments}
							onSelectDetail={onSelectDetail}
						/>
					)}
					{node?.event === "before_llm_request" ||
					node.status === "finished" ||
					node.status === "error" ? null : (
						<Text data={node} isUser={isUser} hideHeader />
					)}
					<Attachment attachments={node.attachments} onSelectDetail={onSelectDetail} />

					{node?.text?.attachments?.length > 0 && (
						<Attachment
							attachments={node.text?.attachments}
							onSelectDetail={onSelectDetail}
						/>
					)}
				</div>
			)}
			{node?.status === "error" && (
				<div className={styles.errorTextContainer}>
					<Text
						data={isEmpty(node?.content) ? { content: "任务异常，已经终止。" } : node}
						isUser={isUser}
						hideHeader
					/>
				</div>
			)}
			{node?.status === "finished" && (
				<div className={styles.finishedTextContainer}>
					<Text
						data={{ content: "已完成当前任务，随时准备接收新的请求或修改。" }}
						isUser={isUser}
						hideHeader
						isFinished
					/>
				</div>
			)}
		</>
	)
}

export default Node
