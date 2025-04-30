import PDFIcon from "@/opensource/pages/superMagic/assets/file_icon/pdf.svg"
import CommonHeader from "@/opensource/pages/superMagic/components/Detail/components/CommonHeader"
import { useState, useEffect, useRef } from "react"
import { IconZoomIn, IconZoomOut } from "@tabler/icons-react"
//@ts-ignore
import { Document, Page, pdfjs } from "react-pdf"
import { useStyles } from "./style"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
// import "react-pdf/dist/esm/Page/TextLayer.css"
import CommonFooter from "../../components/CommonFooter"

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"

export default function PDFViewer(props: any) {
	const { styles } = useStyles()
	const {
		type,
		currentIndex,
		onPrevious,
		onNext,
		onFullscreen,
		onDownload,
		totalFiles,
		hasUserSelectDetail,
		setUserSelectDetail,
		userSelectDetail,
		isFromNode,
		onClose,
		isFullscreen,
		data,
	} = props

	const containerRef = useRef<HTMLDivElement>(null)
	const [containerWidth, setContainerWidth] = useState(0)
	const [pdfData, setPdfData] = useState<any>(null)
	const [numPages, setNumPages] = useState<number>(0)
	const [scale, setScale] = useState(1)
	const { file_extension, file_name, file_url } = data

	useEffect(() => {
		const getPdfData = async () => {
			const response = await fetch(file_url)
			const blob = await response.blob()
			setPdfData(blob)
		}
		getPdfData()
	}, [file_url])

	useEffect(() => {
		const updateWidth = () => {
			if (containerRef.current) {
				setContainerWidth(containerRef.current.offsetWidth)
			}
		}
		updateWidth()

		window.addEventListener("resize", updateWidth)
		return () => window.removeEventListener("resize", updateWidth)
	}, [])

	const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
		setNumPages(numPages)
	}

	return (
		<div ref={containerRef} className={styles.pdfViewer}>
			{/* <div className={styles.pdfViewerContainer}>
				<div onClick={() => setScale((prev) => Math.max(prev - 0.1, 0.5))}>
					<IconZoomOut className={styles.zoomIcon} />
				</div>
				<div onClick={() => setScale((prev) => Math.min(prev + 0.1, 3.0))}>
					<IconZoomIn className={styles.zoomIcon} />
				</div>
			</div> */}
			<CommonHeader
				title={file_name}
				icon={<img src={PDFIcon} alt="" />}
				type={type}
				currentAttachmentIndex={currentIndex}
				totalFiles={totalFiles}
				onPrevious={onPrevious}
				onNext={onNext}
				onFullscreen={onFullscreen}
				onDownload={onDownload}
				hasUserSelectDetail={hasUserSelectDetail}
				setUserSelectDetail={setUserSelectDetail}
				isFromNode={isFromNode}
				onClose={onClose}
				isFullscreen={isFullscreen}
			/>
			<div className={styles.pdfContainer}>
				{pdfData && (
					<Document
						file={pdfData}
						onLoadSuccess={onDocumentLoadSuccess}
						onLoadError={(error: any) => console.error("Error loading PDF:", error)}
					>
						{Array.from(new Array(numPages), (el, index) => (
							<Page
								key={`page_${index + 1}`}
								pageNumber={index + 1}
								width={containerWidth * 0.95}
								style={{ marginBottom: "16px" }}
								scale={scale}
								renderTextLayer={false}
								renderAnnotationLayer={false}
							/>
						))}
					</Document>
				)}
			</div>
			{isFromNode && (
				<CommonFooter
					setUserSelectDetail={setUserSelectDetail}
					userSelectDetail={userSelectDetail}
					onClose={onClose}
				/>
			)}
		</div>
	)
}
