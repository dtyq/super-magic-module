import { getTemporaryDownloadUrl } from "@/opensource/pages/superMagic/utils/api"
import { memo, useEffect, useState } from "react"
import BrowserNavigate from "../../components/BrowserNavigate"
import CommonFooter from "../../components/CommonFooter"
import { DetailType } from "../../types"
import { useStyles } from "./styles"

interface BrowserProps {
	data: any
	userSelectDetail: any
	setUserSelectDetail?: (detail: any) => void
	isFromNode?: boolean
	onClose?: () => void
}

export default memo(function Browser(props: BrowserProps) {
	const { data, userSelectDetail, setUserSelectDetail, isFromNode, onClose } = props
	const { styles } = useStyles()
	const { url, title, file_id } = data || {}
	const [imgSrc, setImgSrc] = useState("")
	useEffect(() => {
		if (file_id) {
			getTemporaryDownloadUrl({ file_ids: [file_id] }).then((res: any) => {
				setImgSrc(res[0]?.url)
			})
		}
	}, [file_id])

	return (
		<div className={styles.browserContainer}>
			<BrowserNavigate url={url} />
			<div className={styles.content}>
				{imgSrc && <img className={styles.screenshot} src={imgSrc as any} alt={title} />}
			</div>
			{isFromNode && (
				<CommonFooter
					userSelectDetail={userSelectDetail}
					setUserSelectDetail={setUserSelectDetail}
					onClose={onClose}
				/>
			)}
		</div>
	)
})
