import MagicLogo from "@/opensource/components/MagicLogo"
import { LogoType } from "@/opensource/components/MagicLogo/LogoType"
import MagicCollapse from "@/opensource/components/base/MagicCollapse"
import { MagicList } from "@/opensource/components/MagicList"
import type { MagicListItemData } from "@/opensource/components/MagicList/types"

import {
	IconDeviceDesktopCog,
	IconFileDescription,
	IconMailbox,
	IconSettings,
	IconUserCircle,
} from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import type { CollapseProps } from "antd"
import { createStyles, cx } from "antd-style"
import type { TFunction } from "i18next"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import SubSiderContainer from "@/opensource/layouts/BaseLayout/components/SubSider"
import { colorScales } from "@/opensource/providers/ThemeProvider/colors"
import { SettingSection } from "../../types"

const useStyles = createStyles(({ isDarkMode, prefixCls, token }) => {
	return {
		collapse: {
			flex: 1,
			width: "100%",
			paddingLeft: 0,
			paddingRight: 0,
			[`--${prefixCls}-collapse-header-padding`]: "10px 0 !important",
			[`--${prefixCls}-collapse-content-padding`]: "0 !important",
			[`.${prefixCls}-collapse-content-box`]: {
				padding: "0 !important",
			},
		},
		collapseLabel: {
			color: isDarkMode ? token.magicColorScales.grey[2] : token.magicColorUsages.text[2],
			fontSize: 14,
			fontWeight: 400,
			lineHeight: "20px",
		},
	}
})

const systemSettingItems: (t: TFunction<"interface">) => MagicListItemData[] = (t) => [
	{
		id: SettingSection.GENERAL_SETTING,
		avatar: {
			icon: <MagicIcon component={IconSettings} />,
			style: { background: colorScales.violet[5], padding: 8 },
		},
		title: t("setting.generalSetting", {
			ns: "interface",
		}),
	},
	{
		id: SettingSection.ACCOUNT_MANAGE,
		avatar: {
			icon: <MagicIcon component={IconUserCircle} />,
			style: { background: colorScales.green[5], padding: 8 },
		},
		title: t("setting.accountManage", { ns: "interface" }),
	},
	{
		id: SettingSection.LOGIN_DEVICES,
		avatar: {
			icon: <MagicIcon component={IconDeviceDesktopCog} />,
			style: { background: colorScales.orange[5], padding: 8 },
		},
		title: t("setting.loginDevices", { ns: "interface" }),
	},
]

const aboutUsItems: (t: TFunction) => MagicListItemData[] = (t) => [
	{
		id: SettingSection.FALLBACK,
		avatar: {
			icon: <MagicIcon component={IconMailbox} />,
			style: { background: colorScales.pink[5], padding: 8 },
		},
		title: t("setting.fallback", {
			ns: "interface",
		}),
	},
	{
		id: SettingSection.UPDATE_LOG,
		avatar: {
			icon: <MagicIcon component={IconFileDescription} />,
			style: { background: colorScales.blue[5], padding: 8 },
		},
		title: t("setting.updateLog", {
			ns: "interface",
		}),
	},
	{
		id: SettingSection.ABOUT_MAGIC,
		avatar: {
			icon: <MagicLogo type={LogoType.ICON} />,
			style: { background: colorScales.brand[5], padding: 8 },
		},
		title: t("setting.aboutMagic", {
			ns: "interface",
		}),
	},
]

function SettingSubSider() {
	const { t } = useTranslation("interface")
	const [collapseKey, setCollapseKey] = useState<string | string[]>(["SystemSetting", "AboutUs"])

	const { styles } = useStyles()

	const navigateTo = useMemoizedFn(({ id }) => {
		window.location.hash = `#${id}`
	})

	const collapseItems = useMemo<CollapseProps["items"]>(
		() => [
			{
				label: <span className={styles.collapseLabel}>{t("setting.systemSetting")}</span>,
				children: <MagicList onItemClick={navigateTo} items={systemSettingItems(t)} />,
				key: "SystemSetting",
			},
			{
				label: <span className={styles.collapseLabel}>{t("setting.aboutUs")}</span>,
				children: <MagicList onItemClick={navigateTo} items={aboutUsItems(t)} />,
				key: "AboutUs",
			},
		],
		[navigateTo, styles.collapseLabel, t],
	)

	return (
		<SubSiderContainer>
			<MagicCollapse
				activeKey={collapseKey}
				onChange={(key) => setCollapseKey(key)}
				className={cx(styles.collapse)}
				items={collapseItems}
			/>
		</SubSiderContainer>
	)
}

export default SettingSubSider
