import { makeAutoObservable } from "mobx"

class AiCompletionTip {
	/** 是否显示 */
	visible: boolean = false
	/** 位置 */
	position: { top: number; left: number } = { top: -100, left: -100 }

	constructor() {
		makeAutoObservable(this, {}, { autoBind: true })
	}

	tip: string = ""

	/**
	 * 显示
	 * @param position 位置
	 */
	show(position: { top: number; left: number }) {
		this.position = position
		this.visible = true
	}

	/**
	 * 隐藏
	 */
	hide() {
		this.visible = false
		this.position = { top: -100, left: -100 }
	}
}

export default new AiCompletionTip()
