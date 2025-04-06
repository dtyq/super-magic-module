import { useMemoizedFn } from "ahooks"
import type { MouseEvent } from "react"
import { magic } from "@/enhance/magicElectron"

const requestAnimationFrame =
	window.requestAnimationFrame ||
	((callback: () => void) => window.setTimeout(callback, 1000 / 60))
const cancelAnimationFrame = window.cancelAnimationFrame || ((id) => clearTimeout(id))

/**
 * @description electron 中全局拖拽事件
 */
const useDrag = () => {
	const onMouseDown = useMemoizedFn((event: MouseEvent<HTMLDivElement>) => {
		// 右击不移动，只有左击的时候触发
		if (event.button === 2) return

		let draggable = true
		let animationId: number = 0

		// 记录位置
		const mouseX: number = event.clientX
		const mouseY: number = event.clientY

		// 定义窗口移动
		const moveWindow = () => {
			magic?.view?.setViewPosition({
				x: mouseX,
				y: mouseY,
			})
			if (draggable) {
				animationId = requestAnimationFrame(moveWindow)
			}
		}

		const onMouseUp = () => {
			// 释放锁
			draggable = false
			// 移除 mouseup 事件
			document.removeEventListener("mouseup", onMouseUp)
			// 清除定时器
			cancelAnimationFrame(animationId)
		}

		// 注册 mouseup 事件
		document.addEventListener("mouseup", onMouseUp)
		// 启动通信
		animationId = requestAnimationFrame(moveWindow)
	})

	return {
		onMouseDown,
	}
}

export default useDrag
