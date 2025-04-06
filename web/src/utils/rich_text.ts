import type { JSONContent } from "@tiptap/core"

/**
 * 添加 doc 包裹
 * @param content
 * @returns
 */
export const addDocWrapper = (content: JSONContent[] = []) => {
	return {
		type: "doc",
		content,
	}
}
