import type { MagicButtonProps } from "@/opensource/components/base/MagicButton"
import MagicButton from "@/opensource/components/base/MagicButton"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import UploadAction from "@/opensource/components/base/UploadAction"
import { IMStyle } from "@/opensource/providers/AppearanceProvider/context"
import { IconFileUpload } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import { memo, useMemo } from "react"
import { useTranslation } from "react-i18next"

interface UploadButtonProps extends MagicButtonProps {
	loading?: boolean
	icon?: React.ReactNode
	imStyle?: IMStyle
	onFileChange?: (files: FileList) => void
	multiple?: boolean
}

const UploadButton = ({
	icon,
	imStyle: theme = IMStyle.Modern,
	onFileChange,
	multiple = true,
	...props
}: UploadButtonProps) => {
	const { t } = useTranslation("interface")

	const isStandard = useMemo(() => theme === IMStyle.Standard, [theme])

	const UploadHandler = useMemoizedFn((onUpload) => {
		return (
			<MagicButton
				type="text"
				onClick={onUpload}
				icon={
					icon || <MagicIcon color="currentColor" size={20} component={IconFileUpload} />
				}
				{...props}
			>
				{isStandard ? t("chat.input.upload") : null}
			</MagicButton>
		)
	})

	return <UploadAction handler={UploadHandler} onFileChange={onFileChange} multiple={multiple} />
}

export default memo(UploadButton)
