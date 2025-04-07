import { colorUsages } from "@/opensource/providers/ThemeProvider/colors"
import { Flex } from "antd"
import { useThemeMode } from "antd-style"
import { useTranslation } from "react-i18next"
import dingtalkIcon from "@/assets/logos/dingtalk.svg"

export default function AccountManageTip() {
	const { t } = useTranslation("interface")
	const { isDarkMode } = useThemeMode()
	return (
		<Flex
			align="center"
			gap={4}
			style={{
				padding: "10px 20px",
				flex: 1,
				backgroundColor: isDarkMode ? colorUsages.black : colorUsages.primaryLight.default,
			}}
		>
			<img src={dingtalkIcon} width={18} alt="dingtalk" />
			<span>{t("setting.tip.accountManageTip")}</span>
		</Flex>
	)
}
