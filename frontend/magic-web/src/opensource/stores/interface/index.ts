import { WebSocketReadyState } from "@/types/websocket"
import { makeAutoObservable } from "mobx"

class InterfaceStore {
	readyState: WebSocket["readyState"] = WebSocketReadyState.CLOSED
	isSwitchingOrganization: boolean = false
	isConnecting: boolean = false
	showReloadButton: boolean = false
	isShowStartPage: boolean = true

	constructor() {
		makeAutoObservable(this)
	}

	updateIsShowStartPage(isShowStartPage: boolean) {
		this.isShowStartPage = isShowStartPage
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
