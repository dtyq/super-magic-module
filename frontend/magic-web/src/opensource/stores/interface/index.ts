import { WebSocketReadyState } from "@/types/websocket"
import { platformKey } from "@/utils/storage"
import { makeAutoObservable } from "mobx"

class InterfaceStore {
	readyState: WebSocket["readyState"] = WebSocketReadyState.CLOSED
	isSwitchingOrganization: boolean = false
	isConnecting: boolean = false
	showReloadButton: boolean = false
	isShowStartPageKey = platformKey("isShowStartPage")

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
}

// 创建全局单例
export const interfaceStore = new InterfaceStore()
