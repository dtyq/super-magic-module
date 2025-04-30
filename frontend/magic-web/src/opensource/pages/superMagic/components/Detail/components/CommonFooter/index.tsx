import { memo, useMemo } from "react"
import browserSVG from "../../../../assets/svg/detail-browser.svg"
import searchSVG from "../../../../assets/svg/detail-search.svg"
import terminalSVG from "../../../../assets/svg/detail-terminal.svg"
import textSVG from "../../../../assets/svg/detail-text.svg"
import EmptySVG from "../../../../assets/svg/empty_detail.svg"
import { DetailType } from "../../types"
import { useStyles } from "./styles"
import { isEmpty } from "lodash-es"
import { Button, Flex, Tooltip } from "antd"
import ToolIcon from "../../../MessageList/components/Tool/components/ToolIcon"

interface CommonFooterProps {
	setUserSelectDetail?: (detail: any) => void
	userSelectDetail?: any
	onClose?: () => void
}

export default memo(function CommonFooter(props: CommonFooterProps) {
	const { userSelectDetail, setUserSelectDetail, onClose } = props

	const { name, action, remark } = userSelectDetail || {}

	const { styles } = useStyles()

	const img = useMemo(() => {
		switch (name) {
			case DetailType.Terminal:
				return terminalSVG

			case DetailType.Browser:
			case DetailType.Html:
				return browserSVG

			case DetailType.Search:
				return searchSVG

			case DetailType.Text:
			case DetailType.Md:
				return textSVG

			default:
				return EmptySVG
		}
	}, [name])

	return (
		<Flex className={styles.commonFooter} align="center" justify="space-between">
			<Flex className={styles.left} align="center" gap={4}>
				<ToolIcon type={name} className={styles.icon} />
				<span className={styles.tips}>{action}</span>
				{remark && (
					<Tooltip title={remark}>
						<span className={styles.remark}>{remark}</span>
					</Tooltip>
				)}
			</Flex>
			{!isEmpty(userSelectDetail) && (
				<Button
					onClick={() => {
						if (onClose) {
							onClose()
						} else {
							setUserSelectDetail?.(null)
						}
					}}
					type="primary"
					className={styles.goTheLatestButton}
				>
					返回最新
				</Button>
			)}
		</Flex>
	)
})
