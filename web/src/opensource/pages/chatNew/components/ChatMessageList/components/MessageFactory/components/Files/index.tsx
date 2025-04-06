import { memo } from "react"
import MagicFiles from "../../../../../MagicFiles"

interface Props {
	files?: any[]
	messageId: string
}

const Files = memo(
	({ files, messageId }: Props) => {
		return <MagicFiles data={files} messageId={messageId} />
	},
	(prev, next) => prev.messageId === next.messageId,
)

export default Files
