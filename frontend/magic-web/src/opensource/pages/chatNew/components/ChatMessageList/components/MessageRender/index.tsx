import MessageRenderFactory from "./factory"
import { Suspense } from "react"
import { ControlEventMessageType } from "@/types/chat"

function MessageRender(props: { message: any }) {
	const { message } = props

	// 处理组件类型
	let componentType = message.type

	// 不是控制类消息，默认为default类型
	if (!Object.values(ControlEventMessageType).includes(componentType)) {
		componentType = "default"
	}

	// 如果是撤回的
	if (message.revoked) {
		componentType = "RevokeTip"
	}

	// 获取组件
	const MessageComponent = MessageRenderFactory.getComponent(componentType)

	if (!MessageComponent) {
		return null
	}

	// 生成组件props
	const componentProps = MessageRenderFactory.generateProps(componentType, message)

	return (
		<Suspense fallback={<></>}>
			<MessageComponent key={message.id} {...componentProps} />
		</Suspense>
	)
}

export default MessageRender
