import { Input, Tooltip } from "antd"
import clsx from "clsx"
import i18next from "i18next"
import React from "react"
import { useTranslation } from "react-i18next"
import useTextEditable from "./hooks/useTextEditable"
import styles from "./index.module.less"

type TextEditableProps = {
	isEdit: boolean
	setIsEdit: React.Dispatch<React.SetStateAction<boolean>>
	title: string
	placeholder?: string
	onChange?: (val: string) => void
	className?: string
}

export default function TextEditable({
	isEdit,
	title,
	placeholder,
	onChange,
	setIsEdit,
	className,
}: TextEditableProps) {
	const { t } = useTranslation()
	const { handleKeyDown, currentTitle, inputTitle, setInputTitle, onInputBlur } = useTextEditable(
		{ title, onChange },
	)

	return (
		<div className={clsx(styles.titleEdit, className)}>
			{!isEdit && (
				<div className={styles.titleView}>
					<Tooltip title={i18next.t("flow.click2ModifyName", { ns: "magicFlow" })}>
						<span className={styles.title} onClick={() => setIsEdit(true)}>
							{currentTitle}
						</span>
					</Tooltip>
				</div>
			)}
			{isEdit && (
				<Input
					placeholder={placeholder}
					onKeyDown={handleKeyDown}
					value={inputTitle}
					onChange={(e: any) => setInputTitle(e.target.value)}
					onBlur={onInputBlur}
					autoFocus
				/>
			)}
		</div>
	)
}
