import brandOpenApi from "@dtyq/magic-flow/common/assets/brand-openai.png"
import { IconCheck } from "@tabler/icons-react"
import { cx } from "antd-style"
import { MagicIcon } from "@dtyq/magic-flow/common/BaseUI/Icon"

import styles from "./index.module.less"

// eslint-disable-next-line react-refresh/only-export-components
export enum LLMLabelTagType {
	Text = 1,
	Icon = 2,
}

type LLMLabelProps = {
	label: string
	tags: Array<{
		type: LLMLabelTagType
		value: string
	}>
	value: string | number | boolean | null | undefined
	selectedValue: string | number | boolean | null | undefined
	showCheck?: boolean
}

export default function LLMLabel({
	label,
	tags,
	value,
	selectedValue,
	showCheck = true,
}: LLMLabelProps) {
	return (
		<div className={styles.LLMLabel}>
			<img src={brandOpenApi} alt="" className={styles.img} />
			<span className={styles.title}>{label}</span>
			<ul className={styles.tagList}>
				{tags.map((tag) => {
					return (
						<li
							className={cx(styles.tagItem, {
								[styles.textItem]: tag.type === LLMLabelTagType.Text,
								[styles.iconItem]: tag.type === LLMLabelTagType.Icon,
							})}
						>
							{tag.type === LLMLabelTagType.Icon ? (
								<MagicIcon name={tag.value} />
							) : (
								<span>{tag.value}</span>
							)}
						</li>
					)
				})}
			</ul>

			{showCheck && selectedValue === value && <IconCheck className={styles.checked} />}
		</div>
	)
}
