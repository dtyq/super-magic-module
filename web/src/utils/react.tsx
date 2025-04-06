import type { FC } from "react"
import { createRoot } from "react-dom/client"
import { DetachComponentProviders } from "@/opensource/components/other/DetachComponentProviders"
import type { ModalProps } from "antd"
import { debounce, last } from "lodash-es"

export type OpenableProps<P = ModalProps> = P & {
	onClose?: () => void
	rootDom?: HTMLElement
	getPopupContainer?: () => HTMLElement
	getContainer?: () => HTMLElement
}

const triggerlist: HTMLElement[] = [document.body]

export const openModal = <P extends {}>(
	ModalComponent: FC<P>,
	props: Omit<P, "onClose" | "rootDom" | "getPopupContainer" | "getContainer">,
	attach?: HTMLElement,
) => {
	const root = attach ?? document.createElement("div")

	const parent = last(triggerlist) ?? document.body
	parent?.appendChild(root)
	triggerlist.push(root)

	const close = debounce<() => void>(() => {
		setTimeout(() => {
			root.remove()
			if (triggerlist.length > 1) triggerlist.pop()
		}, 0)
	}, 200)

	const propsWithClose = {
		onClose: close as () => void,
		rootDom: root,
		getContainer: () => root,
		getPopupContainer: () => root,
		...props,
	} as OpenableProps<P>

	createRoot(root).render(
		<DetachComponentProviders>
			<div onClick={(e) => e.stopPropagation()}>
				<ModalComponent {...propsWithClose} />
			</div>
		</DetachComponentProviders>,
	)
}
