import type React from "react"
import { Button, Flex } from "antd"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import { RoutePath } from "@/const/routes"
import { useTranslation } from "react-i18next"
import { createStyles } from "antd-style"
import NotFoundImage from "./NotFoundImage"

const useStyles = createStyles(({ css, token }) => ({
	notFoundText: css`
		color: ${token.magicColorUsages.text[2]};
		text-align: center;
		font-size: 32px;
		font-weight: 600;
		line-height: 44px;
	`,
	notFoundTip: css`
		color: ${token.magicColorUsages.text[2]};
		text-align: center;
		font-size: 14px;
		line-height: 20px;
	`,
}))

const NotFound: React.FC = () => {
	const navigate = useNavigate()

	const { t } = useTranslation("interface")

	const { styles } = useStyles()

	const handleBackHome = () => {
		navigate(RoutePath.Chat)
	}

	return (
		<Flex vertical justify="center" align="center" gap={40} style={{ height: "100vh" }}>
			<NotFoundImage />
			<Flex vertical align="center" justify="center">
				<div className={styles.notFoundText}>{t("pageNotFound")}</div>
				<div className={styles.notFoundTip}>{t("pageNotFoundTip")}</div>
				<Button style={{ marginTop: 20 }} type="primary" onClick={handleBackHome}>
					{t("backHome")}
				</Button>
			</Flex>
		</Flex>
	)
}

export default NotFound
