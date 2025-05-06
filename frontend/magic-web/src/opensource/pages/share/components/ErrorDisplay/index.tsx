import ShareIcon from "@/opensource/pages/share/assets/icon/replay_icon.svg"
import { Button } from "antd"
import { useStyles } from "./style"

interface ErrorDisplayProps {
	errorMessage?: string
	onRetry?: () => void
}

export default function ErrorDisplay({
	errorMessage = "加载失败，请稍后重试",
	onRetry,
}: ErrorDisplayProps) {
	const { styles } = useStyles()

	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<div className={styles.icon}>
					<img src={ShareIcon} alt="" />
				</div>
				<div className={styles.message}>{errorMessage}</div>
				<span className={styles.description}>抱歉，该回放暂无权限查看或回放已被删除</span>
				{onRetry && (
					<Button
						type="primary"
						onClick={() => {
							window.location.href = "https://www.letsmagic.cn"
						}}
						className={styles.button}
					>
						返回首页
					</Button>
				)}
			</div>
		</div>
	)
}
