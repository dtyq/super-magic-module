import MagicLogoNew from "@/opensource/components/MagicLogo/MagicLogoNew"
import { Flex } from "antd"
import { createStyles } from "antd-style"
import { memo } from "react"
import { useTranslation } from "react-i18next"

const useStyles = createStyles(({ css, token }) => ({
	hi: css`
		width: 100%;
		margin-bottom: 4px;
	`,
	logo: css`
		margin-bottom: 37px;
	`,
	welcome: css`
		color: ${token.magicColorUsages.text[0]};
		font-size: 20px;
		font-weight: 600;
		line-height: 28px;
	`,
	container: css`
		z-index: 1;
	`,
}))

const TopMeta = memo(function TopMeta() {
	const { styles } = useStyles()
	const { t } = useTranslation("login")
	return (
		<Flex vertical align="center" justify="center" className={styles.container}>
			<MagicLogoNew className={styles.logo} />
			<div className={styles.hi}>{t("hi")}</div>
			<span className={styles.welcome}>{t("welcome")}</span>
		</Flex>
	)
})

export default TopMeta
