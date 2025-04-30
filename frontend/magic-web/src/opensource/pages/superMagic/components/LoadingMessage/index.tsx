import LoadingSvg from "@/assets/resources/stream-loading-2.png"
import { useStyles } from "./style"

export default function LoadingMessage() {
	const { styles } = useStyles()
	return (
		<>
			<span className={styles.loadingMessage}>
				<img src={LoadingSvg} alt="" className={styles.loadingMessageIcon} />
				<span className={styles.loadingMessageText}>正在思考</span>
			</span>
		</>
	)
}
