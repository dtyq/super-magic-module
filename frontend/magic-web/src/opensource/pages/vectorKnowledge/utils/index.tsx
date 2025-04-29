import { nanoid } from "nanoid"
import type { FileData } from "../types"

export function genFileData(file: File): FileData {
	return {
		id: nanoid(),
		name: file.name,
		file,
		status: "init",
		progress: 0,
	}
}

/**
 * 处理字符串中的转义字符，确保保持用户输入的原始形式
 * 例如，将"\n"作为分隔符时，通过JSON后会变成"\\n"，此函数将其还原为"\n"
 * @param {string} str - 需要处理的字符串
 * @returns {string} 处理后的字符串
 */
export function processEscapeChars(str: string): string {
	if (!str) return str

	// 处理常见的转义字符
	return str.replace(/\\\\n/g, "\\n").replace(/\\\\t/g, "\\t").replace(/\\\\r/g, "\\r")
}

/**
 * 处理配置对象中所有分隔符字段的转义字符
 * @param {object} config - 配置对象，包含normal和parent_child等子对象
 * @returns {object} 处理后的配置对象
 */
export function processConfigSeparators(config: any): any {
	const { normal, parent_child } = config

	// 复制对象，避免直接修改原对象
	const processedNormal = { ...normal }
	const processedParentChild = { ...parent_child }

	// 处理normal中的分隔符
	if (processedNormal?.segment_rule?.separator) {
		processedNormal.segment_rule.separator = processEscapeChars(
			processedNormal.segment_rule.separator,
		)
	}

	// 处理parent_child中的分隔符
	if (processedParentChild?.parent_segment_rule?.separator) {
		processedParentChild.parent_segment_rule.separator = processEscapeChars(
			processedParentChild.parent_segment_rule.separator,
		)
	}

	if (processedParentChild?.child_segment_rule?.separator) {
		processedParentChild.child_segment_rule.separator = processEscapeChars(
			processedParentChild.child_segment_rule.separator,
		)
	}

	return {
		...config,
		normal: processedNormal,
		parent_child: processedParentChild,
	}
}
