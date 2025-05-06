import { memo } from "react"
import magic from "@/opensource/pages/superMagic/assets/svg/magic.svg"
import CommonFooter from "../CommonFooter"
import { DetailType } from "../../types"
import { useStyles } from "./styles"

export default memo(function Empty() {
	const { styles } = useStyles()

	return (
		<div className={styles.emptyContainer}>
			<span className={styles.emptyHeader}>
				<span className={styles.title}>超级麦吉客户端</span>
			</span>
			<div className={styles.emptyBody}>
				<div className={styles.emptyContent}>
					<img src={magic} alt="Magic" />
					<p>超级麦吉已准备就绪，随时可执行任务</p>
				</div>
			</div>
			<CommonFooter type={DetailType.Empty} tips="麦吉正在等待指令" />
		</div>
	)
})
