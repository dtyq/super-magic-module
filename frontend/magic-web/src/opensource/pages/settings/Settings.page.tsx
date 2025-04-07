import MagicCollapse from "@/opensource/components/base/MagicCollapse"
import { Flex, Input } from "antd"
import { useTranslation } from "react-i18next"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import PageContainer from "@/opensource/components/base/PageContainer"
import { useCurrentMagicOrganization, useUserInfo } from "@/opensource/models/user/hooks"
import AiCompletionSwitch from "./featrues/AiCompletionSwitch"
import AppearenceSwitch from "./featrues/AppearenceSwitch"
import FontSizeChanger from "./featrues/FontSizeChanger"
import IMStyleSwitch from "./featrues/IMStyleSwitch"
import LanguageSwitch from "./featrues/LanguageSwitch"
import LoginDevices from "./featrues/LoginDevices"
import SettingItem from "./featrues/SettingItem"
import ShortcutKeyInput from "./featrues/ShortcutKeyInput"
import { SettingSection } from "./types"
import AccountManageTip from "./components/AccountManageTip"
import { useStyles } from "./styles"
import { useLocation } from "react-router"
import { useEffect } from "react"

function SettingPage() {
	const { t } = useTranslation("interface")
	const { state } = useLocation()

	useEffect(() => {
		if (state?.type) {
			// 滚动到指定位置
			const target = document.getElementById(state.type)
			if (target) {
				target.scrollIntoView({ behavior: "smooth" })
			}
		}
	}, [state?.type])

	const { styles } = useStyles()

	const { userInfo: info } = useUserInfo()

	const organization = useCurrentMagicOrganization()

	return (
		<PageContainer title={t("setting.systemSetting")} className={styles.container}>
			<MagicCollapse
				ghost={false}
				bordered={false}
				className={styles.collapse}
				defaultActiveKey={[
					SettingSection.GENERAL_SETTING,
					SettingSection.HOTKEYS_SETTING,
					SettingSection.ACCOUNT_MANAGE,
					SettingSection.LOGIN_DEVICES,
				]}
				items={[
					{
						key: SettingSection.GENERAL_SETTING,
						label: (
							<span id={SettingSection.GENERAL_SETTING}>
								{t("setting.generalSetting")}
							</span>
						),
						children: (
							<>
								<SettingItem
									title={t("setting.appearance")}
									description={t("setting.appearanceDescription")}
									extra={<AppearenceSwitch />}
								/>
								<SettingItem
									title={t("setting.language")}
									description={t("setting.languageDescription")}
									extra={<LanguageSwitch />}
								/>
								<IMStyleSwitch />
								<SettingItem
									title={t("setting.fontSize")}
									description={t("setting.fontSizeDescription")}
									extra={<FontSizeChanger />}
								/>
								<SettingItem
									title={t("setting.aiCompletion")}
									description={t("setting.aiCompletionDescription")}
									extra={<AiCompletionSwitch />}
								/>
							</>
						),
					},
					{
						key: SettingSection.HOTKEYS_SETTING,
						label: (
							<span id={SettingSection.HOTKEYS_SETTING}>
								{t("setting.hotKeySetting")}
							</span>
						),
						children: (
							<SettingItem
								title={t("setting.search")}
								description={t("setting.searchDescription")}
								extra={<ShortcutKeyInput />}
							/>
						),
					},
					{
						key: SettingSection.ACCOUNT_MANAGE,
						label: (
							<span id={SettingSection.ACCOUNT_MANAGE}>
								{t("setting.accountManage")}
							</span>
						),
						children: (
							<>
								<AccountManageTip />
								<SettingItem title={t("setting.magicId")} extra={info?.magic_id} />
								<SettingItem
									title={t("setting.enterprise")}
									extra={
										<Flex align="center" gap={10}>
											<MagicAvatar
												// src={organization?.organization_logo?.[0]?.url}
												size={32}
											>
												{organization?.magic_organization_code}
											</MagicAvatar>
											{organization?.magic_organization_code}
										</Flex>
									}
								/>
								<SettingItem
									title={t("setting.avatar")}
									extra={
										<MagicAvatar src={info?.avatar}>
											{info?.nickname}
										</MagicAvatar>
									}
								/>
								<SettingItem
									title={t("setting.realName")}
									extra={
										<Input
											disabled
											placeholder={t("setting.realNamePlaceholder")}
											value={info?.nickname}
										/>
									}
								/>
							</>
						),
					},
					// {
					// 	key: SettingSection.LOGIN_DEVICES,
					// 	label: (
					// 		<span id={SettingSection.LOGIN_DEVICES}>
					// 			{t("setting.loginDevices")}
					// 		</span>
					// 	),
					// 	children: <LoginDevices />,
					// },
				]}
			/>
		</PageContainer>
	)
}

export default SettingPage
