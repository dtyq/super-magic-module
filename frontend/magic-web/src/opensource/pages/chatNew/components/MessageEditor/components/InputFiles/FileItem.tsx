import MagicIcon from "@/opensource/components/base/MagicIcon"
import { IconX } from "@tabler/icons-react"
import { Flex } from "antd"
import { createStyles } from "antd-style"

import { darken, lighten } from "polished"
import FileIcon from "@/opensource/components/business/FileIcon"
import { formatFileSize } from "@/utils/string"
import type { FileData } from "./types"

const useFileItemStyles = createStyles(
	(
		{ css, isDarkMode, token },
		{ status, progress }: { status: "init" | "uploading" | "done" | "error"; progress: number },
	) => {
		const defaultBg = isDarkMode ? token.magicColorUsages.bg[2] : "white"

		const loadedBg = isDarkMode
			? token.magicColorScales.grey[8]
			: darken(0.02)(token.magicColorUsages.primaryLight.default)

		const progressBg = `linear-gradient(to right, ${loadedBg} 0%, ${loadedBg} ${progress}%, ${defaultBg} ${progress}%, ${defaultBg} 100%)`

		const errorBg = isDarkMode
			? token.magicColorScales.red[8]
			: darken(0.02)(token.magicColorUsages.danger.default)

		const successBg = isDarkMode
			? token.magicColorScales.green[7]
			: token.magicColorScales.green[1]

		const bgMap = {
			init: defaultBg,
			uploading: progressBg,
			done: successBg,
			error: errorBg,
		}

		return {
			file: css`
				cursor: default;
				border-radius: 4px;
				background: ${bgMap[status]};
				padding: 8px;
				border: 1px solid ${token.colorBorder};
				color: ${token.magicColorUsages.text[1]};
			`,
			name: css`
				color: ${token.magicColorUsages.text[1]};
				font-size: 12px;
				font-weight: 400;
				line-height: 16px;
				max-width: 120px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			`,
			size: css`
				color: ${token.magicColorUsages.text[3]};
				font-size: 12px;
				font-weight: 400;
				line-height: 16px;
			`,
			close: css`
				cursor: pointer;
				box-sizing: content-box;
				padding: 3px;
				background-color: ${token.magicColorUsages.danger.default};
				border-radius: 50%;
				color: ${token.magicColorUsages.white};
				&:hover {
					background-color: ${lighten(0.1, token.magicColorUsages.danger.default)};
				}
			`,
		}
	},
)
interface FileItemProps {
	data: FileData
	onRemove: (data: FileData) => void
}
export function FileItem({ data, onRemove }: FileItemProps) {
	const { styles } = useFileItemStyles({ status: data.status, progress: data.progress })
	return (
		<Flex className={styles.file} align="center" gap={8} key={data.id}>
			<FileIcon />
			<span className={styles.name}>{data.name}</span>
			<span className={styles.size}>{formatFileSize(data.file.size)}</span>
			<MagicIcon
				color="currentColor"
				component={IconX}
				className={styles.close}
				size={12}
				stroke={4}
				onClick={() => onRemove?.(data)}
			/>
		</Flex>
	)
}
