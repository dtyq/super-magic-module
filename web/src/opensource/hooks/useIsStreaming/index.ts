import { useEffect, useRef, useState } from "react"

/**
 * 判断是否正在流式输出
 * @param value 流式输出的值
 * @param delay 流式输出的延迟时间
 * @returns 是否正在流式输出
 */
export const useIsStreaming = (value: string, delay = 500) => {
	const [isStreaming, setIsStreaming] = useState(true)
	const timer = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		if (timer.current) {
			clearTimeout(timer.current)
		}
		setIsStreaming(true)
		timer.current = setTimeout(() => {
			setIsStreaming(false)
		}, delay)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value])

	return { isStreaming }
}
