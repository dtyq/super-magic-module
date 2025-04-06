import { createRoot } from "react-dom/client"
import { DetachComponentProviders } from "@/opensource/components/other/DetachComponentProviders"
import UrgentModal from "./index"

const openUrgentModal = (msgId: string) => {
	const root = document.createElement("div")
	document.body.appendChild(root)

	const close = () => {
		setTimeout(() => {
			root.remove()
		})
	}

	createRoot(root).render(
		<DetachComponentProviders>
			<UrgentModal msgId={msgId} onClose={close} />
		</DetachComponentProviders>,
	)
}

export default openUrgentModal
