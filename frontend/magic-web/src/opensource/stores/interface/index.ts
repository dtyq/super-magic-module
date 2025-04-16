import { WebSocketReadyState } from "@/types/websocket"
import { platformKey } from "@/utils/storage"
import { makeAutoObservable } from "mobx"

class InterfaceStore {
	readyState: WebSocket["readyState"] = WebSocketReadyState.CLOSED
	isSwitchingOrganization: boolean = false
	isConnecting: boolean = false
	showReloadButton: boolean = false
	isShowStartPageKey = platformKey("isShowStartPage")
	chatInputDefaultHeightKey = platformKey("chatInputDefaultHeight")

	/**
	 * 聊天输入框默认高度
	 */
	chatInputDefaultHeight = Number(localStorage.getItem(this.chatInputDefaultHeightKey)) || 240

	/**
	 * 是否显示启动页
	 */
	isShowStartPage: boolean = JSON.parse(localStorage.getItem(this.isShowStartPageKey) ?? "true")

	constructor() {
		makeAutoObservable(this)
	}

	closeStartPage() {
		this.isShowStartPage = false
		localStorage.setItem(this.isShowStartPageKey, "false")
	}

	setReadyState(readyState: WebSocket["readyState"]) {
		this.readyState = readyState
	}

	setIsSwitchingOrganization(isSwitchingOrganization: boolean) {
		this.isSwitchingOrganization = isSwitchingOrganization
	}

	setIsConnecting(isConnecting: boolean) {
		this.isConnecting = isConnecting
	}

	setShowReloadButton(showReloadButton: boolean) {
		this.showReloadButton = showReloadButton
	}

	setChatInputDefaultHeight(height: number) {
		this.chatInputDefaultHeight = height
		localStorage.setItem(this.chatInputDefaultHeightKey, height.toString())
	}
}

// 创建全局单例
export const interfaceStore = new InterfaceStore()
