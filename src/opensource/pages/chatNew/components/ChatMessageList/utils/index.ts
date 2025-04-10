export function isMessageInView(messageId: string, parentElement: HTMLElement | null) {
	if (!parentElement) return false

	const element = document.getElementById(messageId)
	console.log("element", element)
	if (!element) return false

	const rect = element.getBoundingClientRect()
	// 元素的顶部进入视图，判断为true
	return rect.top >= 0 && rect.top <= (parentElement.clientHeight || parentElement.scrollHeight)
}
