import { Flex } from "antd"
import { useTranslation } from "react-i18next"
import { memo } from "react"
import AgreePolicyCheckbox from "@/opensource/pages/login/components/AgreePolicyCheckbox"
import { useStyles } from "../styles"

interface FooterProps {
	agree: boolean
	onAgreeChange: (agree: boolean) => void
	tipVisible?: boolean
}

const Footer = memo(function Footer({ agree, onAgreeChange, tipVisible = false }: FooterProps) {
	const { styles } = useStyles()
	const { t } = useTranslation("login")

	return (
		<Flex vertical align="center" gap={12} className={styles.footer}>
			<AgreePolicyCheckbox agree={agree} onChange={onAgreeChange} showCheckbox />
			{tipVisible && <span className={styles.autoRegisterTip}>{t("autoRegisterTip")}</span>}
		</Flex>
	)
})

export default Footer
