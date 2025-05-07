import type {
	QuickInstruction,
	InstructionGroupType,
	SystemInstruct,
	SystemInstructType,
} from "@/types/bot"
import { InstructionType, DisplayType } from "@/types/bot"
import { Flex } from "antd"
import type { HTMLAttributes } from "react"
import { observer } from "mobx-react-lite"
import ConversationBotDataService from "@/opensource/services/chat/conversation/ConversationBotDataService"
import SelectorAction from "./components/SelectorAction"
import SwitchAction from "./components/SwitchAction"
import TextAction from "./components/TextAction/Index"
import { useStyles } from "./styles"
import StatusAction from "./components/StatusAction"
import SystemAction from "./components/SystemAction/Index"

interface InstructionSelectorProps {
	position: InstructionGroupType
	systemButtons?: Partial<Record<SystemInstructType, React.ReactNode>>
}

interface InstructionItemProps extends HTMLAttributes<HTMLDivElement> {
	instruction: QuickInstruction
	systemButtons?: Partial<Record<SystemInstructType, React.ReactNode>>
}

const InstructionAction = ({ instruction, systemButtons, ...rest }: InstructionItemProps) => {
	if ((instruction as SystemInstruct)?.display_type === DisplayType.SYSTEM) {
		return (
			<SystemAction
				instruction={instruction as SystemInstruct}
				systemButtons={systemButtons}
				{...rest}
			/>
		)
	}

	switch (instruction.type) {
		case InstructionType.SINGLE_CHOICE:
			return <SelectorAction instruction={instruction} {...rest} />
		case InstructionType.SWITCH:
			return <SwitchAction instruction={instruction} {...rest} />
		case InstructionType.TEXT:
			return <TextAction instruction={instruction} {...rest} />
		case InstructionType.STATUS:
			return <StatusAction instruction={instruction} {...rest} />
		default:
			return null
	}
}

/**
 * 指令选择器
 */
const InstructionActions = observer(({ position, systemButtons }: InstructionSelectorProps) => {
	const { styles } = useStyles({ position })
	/** 指令列表 */
	const instructions = ConversationBotDataService.getQuickInstructionsByPosition(position)

	if (!instructions || !instructions.items?.length) {
		return null
	}

	return (
		<Flex className={styles.instructionSelector}>
			{instructions?.items?.map((instruction) => (
				<InstructionAction
					className={styles[`actionWrapper${position}`]}
					key={instruction.id}
					instruction={instruction}
					systemButtons={systemButtons}
				/>
			))}
		</Flex>
	)
})

export default InstructionActions
