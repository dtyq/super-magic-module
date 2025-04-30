import { userStore } from "@/opensource/models/user"
import MagicAva from "@/opensource/pages/superMagic/assets/svg/magicAva.svg"
import UserDefault from "@/opensource/pages/superMagic/assets/svg/user_default.svg"
// eslint-disable-next-line import/order
import { useStyles } from "./style"

interface NodeHeaderProps {
	isUser: boolean
	timestamp: string
	isShare?: boolean
}

const NodeHeader = ({ isUser, timestamp, isShare }: NodeHeaderProps) => {
	const { styles } = useStyles()

	// 格式化时间戳
	const formatTimestamp = (time: string) => {
		if (!time) return ""

		let date: Date

		// 检查是否为ISO格式的时间字符串 (包含'-'、'T'、':'等字符)
		const timeStr = String(time) // 确保time是字符串
		if (timeStr.includes("-") || timeStr.includes("T") || timeStr.includes(":")) {
			date = new Date(time)
		} else {
			// 将时间戳转换为数字
			let timeValue = Number(time)

			// 检查是否为秒级时间戳 (10位数)，如果是则转换为毫秒
			if (timeValue < 10000000000) {
				timeValue *= 1000
			}

			date = new Date(timeValue)
		}

		// 检查日期是否有效
		if (Number.isNaN(date.getTime())) {
			return ""
		}

		const month = date.getMonth() + 1
		const day = date.getDate()
		const hours = date.getHours().toString().padStart(2, "0")
		const minutes = date.getMinutes().toString().padStart(2, "0")
		return `${month}/${day} ${hours}:${minutes}`
	}
	return (
		<div className={isUser ? styles.userNodeHeader : styles.nodeHeader}>
			{isUser ? (
				<>
					<span className={styles.timestamp}>{formatTimestamp(timestamp)}</span>
					<img
						src={
							isShare
								? UserDefault || userStore?.user?.userInfo?.avatar || UserDefault
								: userStore?.user?.userInfo?.avatar || UserDefault
						}
						alt="avatar"
						className={styles.avatar}
					/>
				</>
			) : (
				<>
					<img src={MagicAva} alt="avatar" className={styles.avatar} />
					<span className={styles.timestamp}>{formatTimestamp(timestamp)}</span>
				</>
			)}
		</div>
	)
}

export default NodeHeader
