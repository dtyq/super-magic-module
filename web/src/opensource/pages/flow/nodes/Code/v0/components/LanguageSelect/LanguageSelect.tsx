import { cx } from "antd-style"
import { IconSelector } from "@tabler/icons-react"
import MagicSelect from "@dtyq/magic-flow/common/BaseUI/Select"
import { Form } from "antd"
import styles from "./index.module.less"
import { LanguageOptions } from "./constants"

export default function LanguageSelect() {
	return (
		<div className={styles.languageSelect}>
			<Form.Item name="language">
				<MagicSelect
					options={LanguageOptions}
					className={cx("nodrag", styles.select)}
					suffixIcon={<IconSelector size={20} />}
				/>
			</Form.Item>
		</div>
	)
}
