import { Flex } from "antd"
import { createStyles } from "antd-style"
import { useTranslation } from "react-i18next"
import { IconAppWindow } from "@tabler/icons-react"
import { memo, useEffect, useMemo } from "react"

import { IMStyle, useAppearanceStore } from "@/opensource/providers/AppearanceProvider/context"
import standardImg from "./assets/standard.svg"
import SettingItem from "../SettingItem"

const useStyles = createStyles(({ token, css, cx, isDarkMode }) => {
	const text = cx(css`
		color: ${isDarkMode ? token.magicColorScales.grey[3] : token.magicColorUsages.text[1]};
	`)

	const image = cx(css`
		padding: 4px;
		border-radius: 12px;
		border: 2px solid transparent;
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

const IMStyleSwitch = memo(() => {
	const { t } = useTranslation("interface")
	const { styles } = useStyles()

	const imStyle = useAppearanceStore((state) => state.imStyle)

	// 如果不是标准模式，则设置为标准模式
	useEffect(() => {
		if (imStyle !== IMStyle.Standard) {
			useAppearanceStore.setState({ imStyle: IMStyle.Standard })
		}
	}, [imStyle])

	const items = useMemo(
		() => [
			// {
			// 	label: t("setting.modern"),
			// 	value: IMStyle.Modern,
			// 	image: modernImg,
			// 	icon: IconForms,
			// },
			{
				label: t("setting.standard"),
				value: IMStyle.Standard,
				image: standardImg,
				icon: IconAppWindow,
			},
		],
		[t],
	)

	return (
		<SettingItem
			title={t("setting.imStyle")}
			description={t("setting.imStyleDescription")}
			extra={
				<Flex gap={18} align="center">
					{items.map((item) => (
						<Flex
							key={item.value}
							vertical
							align="center"
							justify="center"
							onClick={() => useAppearanceStore.setState({ imStyle: item.value })}
							gap={4}
							className={styles.item}
							data-active={imStyle === item.value}
						>
							<img src={item.image} alt="light" width="80" className={styles.image} />
							<Flex align="center" justify="center" className={styles.text} gap={2}>
								<item.icon size={14} color="currentColor" />
								{item.label}
							</Flex>
						</Flex>
					))}
				</Flex>
			}
		/>
	)
})

export default IMStyleSwitch
