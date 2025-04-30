/**
 * 简单的发布订阅系统
 */

type Listener = (...args: any[]) => void

class PubSub {
	private events: Record<string, Listener[]> = {}

	/**
	 * 订阅事件
	 * @param event 事件名称
	 * @param callback 回调函数
	 */
	subscribe(event: string, callback: Listener): void {
		if (!this.events[event]) {
			this.events[event] = []
		}
		this.events[event].push(callback)
	}

	/**
	 * 取消订阅事件
	 * @param event 事件名称
	 * @param callback 可选，特定的回调函数。如果不提供，将取消该事件的所有订阅
	 */
	unsubscribe(event: string, callback?: Listener): void {
		if (!this.events[event]) {
			return
		}

		if (callback) {
			this.events[event] = this.events[event].filter((cb) => cb !== callback)
		} else {
			delete this.events[event]
		}
	}

	/**
	 * 发布事件
	 * @param event 事件名称
	 * @param args 传递给订阅者的参数
	 */
	publish(event: string, ...args: any[]): void {
		if (!this.events[event]) {
			return
		}

		this.events[event].forEach((callback) => {
			try {
				callback(...args)
			} catch (err) {
				console.error(`Error in pubsub event handler for "${event}":`, err)
			}
		})
	}

	/**
	 * 清除所有事件订阅
	 */
	clear(): void {
		this.events = {}
	}
}

// 创建并导出单例实例
const pubsub = new PubSub()
export default pubsub
