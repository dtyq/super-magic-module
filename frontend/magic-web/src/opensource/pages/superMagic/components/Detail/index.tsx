import { isEmpty } from "lodash-es"
import { memo } from "react"
import Render from "./Render"
import DetailEmpty from "./components/DetailEmpty"
import { useStyles } from "./styles"
import { useDetailActions } from "./hooks/useDetailActions"

interface DetailProps {
	disPlayDetail: any
	setUserSelectDetail?: (detail: any) => void
	userSelectDetail?: any
	attachments?: any[] // 话题的所有附件
}

function Detail(props: DetailProps) {
	const { disPlayDetail, setUserSelectDetail, userSelectDetail, attachments } = props
	const { styles } = useStyles()

	// 使用hooks封装操作逻辑
	const {
		isFullscreen,
		isFromNode,
		handlePrevious,
		handleNext,
		handleFullscreen,
		handleDownload,
		allFiles,
		currentIndex,
		effectiveAttachments,
	} = useDetailActions({
		disPlayDetail,
		setUserSelectDetail,
		attachments,
	})
	return (
		<div className={`${styles.detailContainer} ${isFullscreen ? styles.fullscreen : ""}`}>
			{!isEmpty(disPlayDetail) ? (
				<Render
					type={disPlayDetail?.type}
					data={disPlayDetail?.data}
					attachments={effectiveAttachments}
					setUserSelectDetail={setUserSelectDetail}
					currentIndex={currentIndex}
					onPrevious={handlePrevious}
					onNext={handleNext}
					onFullscreen={handleFullscreen}
					onDownload={handleDownload}
					totalFiles={allFiles.length}
					hasUserSelectDetail={!isEmpty(userSelectDetail)}
					isFromNode={isFromNode}
					disPlayDetail={disPlayDetail}
					userSelectDetail={userSelectDetail}
					isFullscreen={isFullscreen}
				/>
			) : (
				<DetailEmpty />
			)}
		</div>
	)
}

const MemoizedDetail = memo(Detail)

export default MemoizedDetail
