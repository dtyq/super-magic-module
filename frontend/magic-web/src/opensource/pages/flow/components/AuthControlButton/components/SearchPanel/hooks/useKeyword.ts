/**
 * 搜索关键词相关数据状态
 */
import { useState } from "react"

export default function useKeyword() {
	const [keyword, setKeyword] = useState("")

	return {
		keyword,
		setKeyword,
	}
}
