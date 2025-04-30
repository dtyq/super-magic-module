import MagicIcon from "@/opensource/components/base/MagicIcon"
import Render from "@/opensource/pages/superMagic/components/Detail/Render"
import type { DetailData } from "@/opensource/pages/superMagic/components/Detail/types"
import { IconX } from "@tabler/icons-react"
import { Popup, SafeArea } from "antd-mobile"
import type { Ref } from "react"
import { forwardRef, memo, useCallback, useImperativeHandle, useState } from "react"
import MobileButton from "../MobileButton"
import { useStyles } from "./styles"
import { useDetailActions } from "@/opensource/pages/superMagic/components/Detail/hooks/useDetailActions"
import { isEmpty } from "lodash-es"

export interface PreviewDetail<T extends keyof DetailData = any> {
	type: T
	data: DetailData[T]
	currentFileId: string
}

export interface PreviewDetailPopupRef {
	open: (options: PreviewDetail) => void
}

interface PreviewDetailPopupProps {
	setUserSelectDetail: (detail: any) => void
	onClose: () => void
}

function PreviewDetailPopup(props: PreviewDetailPopupProps, ref: Ref<PreviewDetailPopupRef>) {
	const { styles } = useStyles()
	const [previewDetail, setPreviewDetail] = useState<PreviewDetail>()
	const [visible, setVisible] = useState(false)
	const [attachments, setAttachments] = useState<any[]>([])
	const [userSelectDetail, setUserDetail] = useState<any>()
	const open = useCallback((options: PreviewDetail, attachmentList: any[]) => {
		setPreviewDetail(options)
		setAttachments(attachmentList || [])
		setUserDetail(options)
		setVisible(true)
	}, [])
	// @ts-ignore
	useImperativeHandle(ref, () => {
		return {
			open,
		}
	})

	const { setUserSelectDetail, onClose } = props

	const {
		isFromNode,
		handlePrevious,
		handleNext,
		handleFullscreen,
		handleDownload,
		allFiles,
		currentIndex,
		effectiveAttachments,
	} = useDetailActions({
		disPlayDetail: previewDetail,
		setUserSelectDetail,
		attachments,
	})

	return (
		<Popup
			position="bottom"
			visible={visible}
			onClose={() => setVisible(false)}
			bodyStyle={{ height: "100dvh", background: "#fff", borderRadius: 0 }}
			bodyClassName={styles.popupBody}
			style={{ zIndex: 1001 }}
		>
			<div className={styles.header}>
				<div className={styles.title}>预览</div>
				<div className={styles.close}>
					<MobileButton
						borderDisabled={visible}
						className={styles.closeButton}
						onClick={() => {
							setVisible(false)
						}}
					>
						<MagicIcon size={22} stroke={2} component={IconX} />
					</MobileButton>
				</div>
			</div>
			<div className={styles.body}>
				{!!previewDetail && (
					<Render
						type={previewDetail?.type}
						data={previewDetail?.data}
						attachments={effectiveAttachments}
						setUserSelectDetail={setUserSelectDetail}
						currentIndex={currentIndex}
						onPrevious={handlePrevious}
						onNext={handleNext}
						onFullscreen={handleFullscreen}
						onDownload={handleDownload}
						totalFiles={allFiles.length}
						hasUserSelectDetail={!isEmpty(previewDetail)}
						isFromNode={isFromNode}
						onClose={onClose}
						userSelectDetail={userSelectDetail}
					/>
				)}
				<SafeArea position="bottom" />
			</div>
		</Popup>
	)
}

export default memo(forwardRef(PreviewDetailPopup))
