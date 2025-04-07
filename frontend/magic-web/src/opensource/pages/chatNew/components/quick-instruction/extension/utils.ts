import type { QuickInstruction } from "@/types/bot"
import { ExtensionName } from "./constants"

/** 生成模板指令节点 */
export const genTemplateInstructionNode = (instruction?: QuickInstruction, value?: string) => {
	return {
		type: ExtensionName,
		attrs: {
			instruction,
			value: value ?? "",
		},
	}
}
