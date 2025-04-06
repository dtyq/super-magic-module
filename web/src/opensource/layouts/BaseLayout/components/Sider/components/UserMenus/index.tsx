import MagicIcon from "@/opensource/components/base/MagicIcon"
import MagicMenu from "@/opensource/components/base/MagicMenu"
import { useAccount } from "@/opensource/stores/authentication"
import { IconChevronRight, IconLanguage, IconLogout } from "@tabler/icons-react"
import { useBoolean, useMemoizedFn } from "ahooks"
import type { MenuProps } from "antd"
import { Popover, Modal } from "antd"
import { useMemo, type PropsWithChildren } from "react"
import { useTranslation } from "react-i18next"
import { last } from "lodash-es"
import { useAccount as useAccountHook } from "@/opensource/models/user/hooks"
import { RoutePath } from "@/const/routes"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import { configStore } from "@/opensource/models/config"
import { useGlobalLanguage, useSupportLanguageOptions } from "@/opensource/models/config/hooks"
import { userStore } from "@/opensource/models/user"
import { useStyles } from "./styles"
import { UserMenuKey } from "./constants"

function UserMenus({ children }: PropsWithChildren) {
	const { t } = useTranslation("interface")
	const { styles, cx } = useStyles()

	const navigate = useNavigate()
	const [modal, contextHolder] = Modal.useModal()

	const [open, { setFalse, set }] = useBoolean(false)

	/** 清除授权 */
	const { accountLogout, accountSwitch } = useAccount()

	/** 获取当前已登录的帐号 */
	const { accounts } = useAccountHook()

	/** 登出 */
	const handleLogout = useMemoizedFn(async () => {
		const config = {
			title: t("sider.exitTitle"),
			content: t("sider.exitContent"),
		}
		const confirmed = await modal.confirm(config)
		if (confirmed) {
			// 当且仅当存在多个账号下，优先切换帐号，再移除帐号
			if (accounts?.length > 1) {
				const info = userStore.user.userInfo
				const otherAccount = accounts.filter(
					(account) => account.magic_id !== info?.magic_id,
				)?.[0]

				const targetOrganization = otherAccount?.organizations.find(
					(org) => org.magic_organization_code === otherAccount?.organizationCode,
				)

				accountSwitch(
					otherAccount?.magic_id,
					targetOrganization?.third_platform_organization_code ?? "",
				).catch(console.error)

				if (info?.magic_id) {
					accountLogout(info?.magic_id)
				}
			} else {
				accountLogout()
				navigate(RoutePath.Login)
			}
		}
	})

	/** 当前语言 */
	const language = useGlobalLanguage(true)
	const languageSelected = useGlobalLanguage(false)
	/** 语言列表 */
	const languageList = useSupportLanguageOptions()

	const languageOptions = useMemo(() => {
		return languageList.map((item) => {
			const label = item.translations?.[item.value] ?? item.label
			const tip = item.translations?.[languageSelected] ?? item.value

			return {
				key: item.value,
				selectable: item.value === language,
				label: (
					<div className={styles.menuItem}>
						<div className={styles.menuItemLeft}>
							<div className={styles.menuItemTop}>
								<span className={styles.menuItemTopName}>{label}</span>
							</div>
							<div className={styles.menuItemBottom}>{tip}</div>
						</div>
					</div>
				),
			}
		})
	}, [
		language,
		languageSelected,
		languageList,
		styles.menuItem,
		styles.menuItemBottom,
		styles.menuItemLeft,
		styles.menuItemTop,
		styles.menuItemTopName,
	])

	const menu = useMemo<MenuProps["items"]>(() => {
		return [
			{
				label: t("sider.switchLanguage"),
				key: UserMenuKey.SwitchLanguage,
				icon: <MagicIcon size={20} component={IconLanguage} color="currentColor" />,
				children: languageOptions,
			},
			{
				label: t("sider.logout"),
				icon: <MagicIcon size={20} component={IconLogout} color="currentColor" />,
				danger: true,
				key: UserMenuKey.Logout,
			},
		]
	}, [t, languageOptions])

	const selectKeys = useMemo(() => [language], [language])

	const handleMenuClick = useMemoizedFn<Exclude<MenuProps["onClick"], undefined>>(
		({ key, keyPath }) => {
			switch (last(keyPath)) {
				case UserMenuKey.Logout:
					handleLogout()
					break
				case UserMenuKey.SwitchLanguage:
					configStore.i18n.setLanguage(key)
					break
				default:
					break
			}
			setFalse()
		},
	)

	return (
		<>
			<Popover
				overlayClassName={styles.popover}
				placement="rightBottom"
				arrow={false}
				open={open}
				onOpenChange={set}
				content={
					<MagicMenu
						rootClassName={cx(styles.menu)}
						expandIcon={
							<MagicIcon
								className={styles.arrow}
								size={20}
								component={IconChevronRight}
							/>
						}
						items={menu}
						onClick={handleMenuClick}
						selectedKeys={selectKeys}
					/>
				}
				trigger="click"
			>
				{children}
			</Popover>
			{contextHolder}
		</>
	)
}

export default UserMenus
