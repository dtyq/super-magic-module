import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { memo } from "react"
import Markdown from "react-markdown"
import logoJson from "./logo.json?raw"
import { useStyles } from "./styles"

const src = URL.createObjectURL(new Blob([logoJson], { type: "application/json" }))

interface DetailEmptyProps {
	title?: string
	text?: string
}

export default memo(function DetailEmpty(props: DetailEmptyProps) {
	const { title, text } = props
	const { styles } = useStyles()

	return (
		<div className={styles.detailEmptyContainer}>
			<div className={styles.icon}>{src && <DotLottieReact src={src} loop autoplay />}</div>
			<div className={styles.title}>{title || "超级麦吉"}</div>
			{!!text && (
				<div className={styles.text}>
					<Markdown>{text}</Markdown>
				</div>
			)}
		</div>
	)
})
