import FileIcon from "@/opensource/pages/superMagic/assets/svg/file.svg"
import CommonHeader from "@/opensource/pages/superMagic/components/Detail/components/CommonHeader"
import { getLanguage } from "@/opensource/pages/superMagic/utils/handleFIle"
// @ts-ignore
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// @ts-ignore
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useStyles } from "./style"
import CommonFooter from "../../components/CommonFooter"
import { Flex } from "antd"
import { useMemo } from "react"
import MagicFileIcon from "@/opensource/components/base/MagicFileIcon"

export default function CodeViewer({
	data,
	file_name,
	type,
	currentIndex,
	onPrevious,
	onNext,
	onFullscreen,
	onDownload,
	totalFiles,
	hasUserSelectDetail,
	setUserSelectDetail,
	isFromNode,
	onClose,
	userSelectDetail,
	isFullscreen,
}: any) {
	const { styles } = useStyles()

	const { content, file_extension } = data
	const language = getLanguage(file_name)

	const Icon = useMemo(() => {
		return file_extension ? (
			<MagicFileIcon type={file_extension} size={20} />
		) : (
			<img src={FileIcon} width={20} height={20} alt="" />
		)
	}, [file_extension])

	return (
		<Flex vertical className={styles.container}>
			<CommonHeader
				title={file_name}
				icon={Icon}
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
			<SyntaxHighlighter
				language={language}
				style={tomorrow}
				customStyle={{ padding: "20px 20px 20px 40px", margin: 0, flex: 1 }}
				showLineNumbers={true}
				lineNumberStyle={{
					minWidth: "2.5em",
					paddingRight: "1em",
					color: "#606366",
					borderRight: "1px solid #282828",
				}}
			>
				{content}
			</SyntaxHighlighter>
			{isFromNode && (
				<CommonFooter
					userSelectDetail={userSelectDetail}
					setUserSelectDetail={setUserSelectDetail}
					onClose={onClose}
				/>
			)}
		</Flex>
	)
}
