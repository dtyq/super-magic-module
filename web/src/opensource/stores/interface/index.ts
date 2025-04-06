import { WebSocketReadyState } from "@/types/websocket"
import { create } from "zustand"

interface InterfaceStoreState {
	readyState: WebSocket["readyState"]
	isSwitchingOrganization: boolean
	isConnecting: boolean
	showReloadButton: boolean
	isShowStartPage: boolean
	updateIsShowStartPage: (isShowStartPage: boolean) => void
}

// 状态记录
// FIXME: 需要改名
export const useInterafceStore = create<InterfaceStoreState>((set) => ({
	readyState: WebSocketReadyState.CLOSED,
	isSwitchingOrganization: false,
	isConnecting: false,
	showReloadButton: false,
	isShowStartPage: true,
	updateIsShowStartPage: (isShowStartPage: boolean) => {
		set({ isShowStartPage })
	},
}))
