import MagicIcon from "@/opensource/components/base/MagicIcon"
import { IconWorld } from "@tabler/icons-react"
import { createStyles, useTheme } from "antd-style"
import MagicSelect from "@/opensource/components/base/MagicSelect"
import {
	setGlobalLanguage,
	useGlobalLanguage,
	useSupportLanguageOptions,
} from "@/opensource/models/config/hooks"

const useStyles = createStyles(({ css, isDarkMode, prefixCls, token }) => {
	return {
		select: css`
			padding: 5px 8px;
			border-radius: 100px;
			background: ${isDarkMode ? token.magicColorScales.grey[1] : token.magicColorUsages.white};
			box-shadow: 0 4px 14px 0 rgba(0, 0, 0, 0.1), 0 0 1px 0 rgba(0, 0, 0, 0.3);
			--${prefixCls}-control-height: fit-content;
			--${prefixCls}-padding-sm: 4px;

			.${prefixCls}-select-prefix {
				display: flex;
				align-items: center;
				gap: 4px;
			}

			.${prefixCls}-select-selection-item {
				--${prefixCls}-select-show-arrow-padding-inline-end: 18px;
			}

			.${prefixCls}-select-arrow {
				width: fit-content;
				right: 10px;
			}
		`,
		selectPopup: css``,
	}
})

function LanguageSelect() {
	const options = useSupportLanguageOptions()

	const { styles, cx } = useStyles()

	const lang = useGlobalLanguage()
	const { isDarkMode } = useTheme()

	return (
		<MagicSelect
			prefix={
				<MagicIcon component={IconWorld} size={20} color={isDarkMode ? "#fff" : "#000"} />
			}
			value={lang}
			className={cx(styles.select)}
			options={options}
			variant="borderless"
			placement="bottomRight"
			onChange={setGlobalLanguage}
			popupClassName={styles.selectPopup}
		/>
	)
}

export default LanguageSelect
