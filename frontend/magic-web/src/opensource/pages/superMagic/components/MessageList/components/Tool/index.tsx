import { IconLink } from "@tabler/icons-react"
import { Tooltip } from "antd"
import { isEmpty } from "lodash-es"
import { useResponsive } from "ahooks"
import ToolIcon from "./components/ToolIcon"
import { useStyles } from "./styles"

export default function Tool(props: { data: any }) {
	const { data } = props
	const { styles, cx } = useStyles()
	const responsive = useResponsive()
	const isMobile = responsive.md === false

	const tooltipContent = (
		<div>
			<div>
				<strong>{data.action}</strong>
			</div>
			{data.remark && <div>{data.remark}</div>}
		</div>
	)
	const handleClick = (url: string) => {
		window.open(url, "_blank")
	}
	if (isEmpty(data?.action) && isEmpty(data?.remark)) {
		return null
	}

	const isLoading = data?.status !== "finished"

	const toolContent = (
		<div className={cx(styles.toolFooter, isLoading && styles.toolFooterLoading)}>
			<ToolIcon type={data?.name} className={styles.icon} />
			{data?.action && <span className={styles.action}>{data.action}</span>}
			{data?.remark && <span className={styles.remark}>{data.remark}</span>}
			{data?.url && (
				<IconLink
					className={styles.urlIcon}
					onClick={() => {
						handleClick(data.url)
					}}
				/>
			)}
		</div>
	)

	if (isMobile) {
		return toolContent
	}

	return (
		<Tooltip title={tooltipContent} placement="top">
			{toolContent}
		</Tooltip>
	)
}
