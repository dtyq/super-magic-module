import { Flex } from "antd"
import { createStyles } from "antd-style"
import { useTranslation } from "react-i18next"
import { IconSunHigh, IconMoon, IconDeviceImac } from "@tabler/icons-react"
import { memo, useMemo } from "react"

import { useMemoizedFn } from "ahooks"
import { magic } from "@/enhance/magicElectron"
import { useTheme } from "@/opensource/models/config/hooks"
import lightImg from "./assets/appearence-light.svg"
import darkImg from "./assets/appearence-dark.svg"
import autoImg from "./assets/appearence-auto.svg"

const useStyles = createStyles(({ token, css, cx, isDarkMode }) => {
	const text = cx(css`
		color: ${isDarkMode ? token.magicColorScales.grey[3] : token.magicColorUsages.text[1]};
	`)

	const image = cx(css`
		padding: 4px;
		border-radius: 12px;
		border: 2px solid transparent;
		user-select: none;
		-webkit-user-drag: none;
	`)
	return {
		item: {
			cursor: "pointer",
			[`&[data-active="true"] .${text}`]: {
				color: isDarkMode ? token.magicColorUsages.primaryLight.active : token.colorPrimary,
			},
			[`&[data-active="true"] .${image}`]: {
				borderColor: token.colorPrimary,
			},
		},
		text,
		image,
	}
})

const AppearenceSwitch = memo(() => {
	const { t } = useTranslation("interface")
	const { styles } = useStyles()

	const { theme, setTheme } = useTheme()

	const onThemeChange = useMemoizedFn((themeConfig) => {
		setTheme(themeConfig)
		magic?.theme?.setTheme?.(themeConfig)
	})

	const items = useMemo(
		() => [
			{
				label: t("setting.light"),
				value: "light",
				image: lightImg,
				icon: IconSunHigh,
			},
			{
				label: t("setting.dark"),
				value: "dark",
				image: darkImg,
				icon: IconMoon,
			},
			{
				label: t("setting.auto"),
				value: "auto",
				image: autoImg,
				icon: IconDeviceImac,
			},
		],
		[t],
	)

	return (
		<Flex gap={18} align="center">
			{items.map((item) => (
				<Flex
					key={item.value}
					vertical
					align="center"
					justify="center"
					onClick={() => onThemeChange(item.value)}
					gap={4}
					className={styles.item}
					data-active={theme === item.value}
				>
					<img src={item.image} alt="light" width="80" className={styles.image} />
					<Flex align="center" justify="center" className={styles.text} gap={2}>
						<item.icon size={14} color="currentColor" />
						{item.label}
					</Flex>
				</Flex>
			))}
		</Flex>
	)
})

export default AppearenceSwitch
