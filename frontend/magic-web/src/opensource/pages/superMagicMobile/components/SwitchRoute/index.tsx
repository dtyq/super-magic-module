import { IconLayoutGrid } from "@tabler/icons-react"
import { memo } from "react"
import { useStyles } from "./style"

export default memo(function SwitchRoute() {
	const { styles, cx } = useStyles()
	return (
		<div className={styles.container}>
			<div className={styles.title}>导航</div>
			<div>
				<div className={cx(styles.item, styles.itemActive)}>
					<IconLayoutGrid className={styles.icon} /> <span>工作区</span>
				</div>
				{/* <div className={styles.item}>
                    <IconLayoutGrid /> <span>归档</span>
                </div>
                <div className={styles.item}>
                    <IconLayoutGrid /> <span>快捷访问</span>
                </div> */}
			</div>
		</div>
	)
})
