import { useSize } from "ahooks"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import {
	IconBook2,
	IconBox,
	IconCalendarEvent,
	IconChecklist,
	IconFolderOpen,
	IconFolderStar,
	IconMessage,
	IconRubberStamp,
	IconUserSquareRounded,
} from "@tabler/icons-react"
import { RoutePath } from "@/const/routes"
import SuperMagicIcon from "@/opensource/pages/superMagic/assets/svg/tabler-icon-super-magic.svg"
import { isCommercial } from "@/utils/env"
import MagicLogo from "@/opensource/components/MagicLogo"
import { LogoType } from "@/opensource/components/MagicLogo/LogoType"
import type { MenuItemType } from "antd/es/menu/interface"
import { useSideMenuStyle } from "./styles"

interface MagicMenuItemType extends MenuItemType {
	hidden: boolean
}

export function useSideMenu() {
	const { t } = useTranslation("interface")
	const { styles } = useSideMenuStyle()
	return useMemo<Array<Array<MagicMenuItemType>>>(() => {
		const imMenu: Array<MagicMenuItemType> = [
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconMessage}
					/>
				),
				hidden: false,
				label: t("sider.message"),
				key: RoutePath.Chat,
			},
			{
				icon: (
					<img src={SuperMagicIcon} alt="" className={styles.navIcon} />
				),
				hidden: false,
				label: t("sider.superMagic"),
				key: RoutePath.SuperMagic,
			},
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconUserSquareRounded}
					/>
				),
				hidden: false,
				label: t("sider.addressBook"),
				key: RoutePath.ContactsOrganization,
			},
		]
		const aiMenu: Array<MagicMenuItemType> = [
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconBox}
					/>
				),
				hidden: !isCommercial(),
				label: t("sider.workspace"),
				key: RoutePath.Workspace,
			},
			{
				icon: (
					<MagicLogo
						className={styles.navIcon}
						type={LogoType.ICON}
						style={{ color: "rgba(0, 0, 0, 0.88)" }}
					/>
				),
				hidden: false,
				label: t("sider.aiAssistants"),
				key: RoutePath.Explore,
			},
		]
		const extendMenu: Array<MagicMenuItemType> = [
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconCalendarEvent}
					/>
				),
				hidden: !isCommercial(),
				label: t("sider.calendar"),
				key: RoutePath.Calendar,
			},
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconRubberStamp}
					/>
				),
				hidden: !isCommercial(),
				label: t("sider.approve"),
				key: RoutePath.Approval,
			},
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconChecklist}
					/>
				),
				hidden: !isCommercial(),
				label: t("sider.task"),
				key: RoutePath.Tasks,
			},
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconFolderOpen}
					/>
				),
				hidden: !isCommercial(),
				label: t("sider.cloudDisk"),
				key: RoutePath.DriveRecent,
			},
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconBook2}
					/>
				),
				hidden: !isCommercial(),
				label: t("sider.wiki"),
				key: RoutePath.KnowledgeWiki,
			},
			{
				icon: (
					<MagicIcon
						color="currentColor"
						className={styles.navIcon}
						component={IconFolderStar}
					/>
				),
				hidden: !isCommercial(),
				label: t("sider.favorites"),
				key: RoutePath.Favorites,
			},
		]
		return [imMenu, aiMenu, extendMenu].reduce<Array<Array<MagicMenuItemType>>>(
			(array, menuGroup) => {
				const menu = menuGroup.filter((i) => !i.hidden)
				if (menu.length > 0) {
					array.push(menu)
				}
				return array
			},
			[],
		)
	}, [styles.navIcon, t])
}

export function useAutoCollapsed(collapsed: boolean) {
	const size = useSize(document.body)

	return useMemo(() => (size?.width ? size?.width < 768 : collapsed), [collapsed, size?.width])
}
