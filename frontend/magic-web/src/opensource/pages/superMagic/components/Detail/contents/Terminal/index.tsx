import ShellIcon from "@/opensource/pages/superMagic/assets/svg/Frame.svg"
import { isString } from "lodash-es"
import { memo, useEffect, useRef } from "react"
import CommonFooter from "../../components/CommonFooter"
import CommonHeader from "../../components/CommonHeader"
import { Terminal } from "xterm"
import { FitAddon } from "xterm-addon-fit"
import "xterm/css/xterm.css"
import "./index.css"
import { useStyles } from "./styles"

interface TerminalProps {
	data: any
	totalFiles: number
	type: string
	currentIndex: number
	onPrevious: () => void
	onNext: () => void
	onFullscreen: () => void
	onDownload: () => void
	hasUserSelectDetail: boolean
	setUserSelectDetail: (detail: any) => void
	isFromNode: boolean
	onClose: () => void
	userSelectDetail: any
	isFullscreen?: boolean
}

// 简单的字符串哈希函数，避免使用特定操作符以符合eslint规则
const hashString = (str: string): string => {
	let hash = 0
	for (let i = 0; i < str.length; i += 1) {
		const char = str.charCodeAt(i)
		hash = hash * 5 - hash + char
		hash = Math.floor(hash % 2147483647) // 保持在32位整数范围内
	}
	return hash.toString(36)
}

// 简单的语法高亮处理函数
const highlightSyntax = (code: string): React.ReactNode => {
	// 关键字正则
	const keywordRegex =
		/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|super|extends|implements|interface|type|enum|public|private|protected|static|get|set)\b/g
	// 字符串正则
	const stringRegex = /(["'`])(.*?)\1/g
	// 注释正则
	const commentRegex = /\/\/(.*?)($|\n)|\/\*(.*?)\*\//gs
	// 函数正则
	const functionRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g
	// 数字正则
	const numberRegex = /\b\d+\.?\d*\b/g

	// 先处理注释，避免注释内的代码被错误高亮
	let highlighted = code.replace(commentRegex, '<span class="comment">$&</span>')

	// 处理其他语法元素
	highlighted = highlighted
		.replace(keywordRegex, '<span class="keyword">$&</span>')
		.replace(stringRegex, '<span class="string">$&</span>')
		.replace(functionRegex, '<span class="function">$1</span>(')
		.replace(numberRegex, '<span class="number">$&</span>')

	// 将HTML字符串转换为dangerouslySetInnerHTML对象
	return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}

export default memo(function Shell(props: TerminalProps) {
	const {
		data,
		totalFiles,
		type,
		currentIndex,
		onPrevious,
		onNext,
		onFullscreen,
		onDownload,
		hasUserSelectDetail,
		setUserSelectDetail,
		isFromNode,
		onClose,
		userSelectDetail,
		isFullscreen,
	} = props
	const { styles } = useStyles()
	const terminalRef = useRef(null) as any
	const term = useRef(null) as any

	const { command, output, exit_code } = data
	const renderCodeContent = (codeData: string) => {
		// if (!code) return null

		// 将代码按行分割，以便逐行显示和添加行号
		const codeLines = codeData.split("\n")
		return (
			<div className={styles.outputSection}>
				{codeLines.map((line: string, index: number) => (
					<div key={`code-${hashString(line)}`} className="output-line">
						<span className={styles.lineNumber}>{index + 1}</span>
						<span className={styles.codeLine}>{highlightSyntax(line)}</span>
					</div>
				))}
			</div>
		)
	}

	// 获取退出码的样式类
	const getExitCodeClass = () => {
		return exit_code === 0 ? styles.exitCodeSuccess : styles.exitCodeError
	}

	useEffect(() => {
		const termInstance = new Terminal({
			disableStdin: true,
			theme: {
				background: "#000000",
				foreground: "#00ff00",
			},
		})
		const fitAddon = new FitAddon()
		termInstance.loadAddon(fitAddon)
		termInstance.open(terminalRef.current)
		fitAddon.fit()

		const observer = new ResizeObserver(() => fitAddon.fit())
		observer.observe(terminalRef.current)

		term.current = termInstance

		return () => {
			observer.disconnect()
			termInstance.dispose()
		}
	}, [])

	useEffect(() => {
		if (terminalRef.current) {
			console.log(command, output, exit_code, "xxxx")
			term.current.writeln(`$ ${command}`)
			const processedOutput = output.replace(/\n/g, "\r\n")
			term.current.writeln(processedOutput)
			term.current.writeln(`Exit code: ${exit_code}`)
		} else {
			return undefined
		}

		return () => {
			term.current.dispose()
		}
	}, [command, output, exit_code])

	return (
		<div className={styles.terminalContainer}>
			<CommonHeader
				title="终端"
				icon={<img src={ShellIcon} alt="" />}
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
			<div className={styles.terminalBody} ref={terminalRef}>
				{/* {command && (
					<div className={styles.commandSection}>
						<span className={styles.promptSymbol}>
							$<span className={styles.commandText}>{command}</span>
						</span>
					</div>
				)}

				{isString(data) && renderCodeContent(data)}
				{output && output.length > 0 && (
					<div className={styles.outputSection}>
						<div className="output-line">{output}</div>
					</div>
				)}
				{exit_code !== undefined && (
					<div className={`${styles.exitCode} ${getExitCodeClass()}`}>
						退出码：{exit_code}
					</div>
				)} */}
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
})
