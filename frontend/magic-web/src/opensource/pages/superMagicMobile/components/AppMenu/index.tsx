import { IconEdit, IconFolder, IconShare, IconTrash, IconInfoCircle } from "@tabler/icons-react"
import { useStyles } from "./style"

export default function AppMenu() {
	const { styles, cx } = useStyles()

	const handleOpenAbout = () => {
		window.location.href = "magic://magic.app/openwith?name=gotoAbout"
	}

	return (
		<div className={styles.container}>
			<div className={styles.title}>关于</div>
			<div>
				<div className={cx(styles.item)} onClick={handleOpenAbout} role="button">
					<IconInfoCircle className={styles.icon} /> <span>超级麦吉</span>
				</div>
				{/* <div className={styles.item}>
					<IconShare /> <span>分享话题</span>
				</div>
				<div className={styles.item}>
					<IconEdit className={styles.icon} /> <span>重命名</span>
				</div>
				<div className={styles.item}>
					<IconTrash className={styles.icon} /> <span>删除话题</span>
				</div> */}
			</div>
		</div>
	)
}
