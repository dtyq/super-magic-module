import { Flex, Menu } from "antd"
import { forwardRef, useMemo } from "react"
import { IconDots } from "@tabler/icons-react"
import { useLocation } from "react-router"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { useMemoizedFn } from "ahooks"
import { useGlobalLanguage } from "@/opensource/models/config/hooks"
import Divider from "@/opensource/components/other/Divider"
import type { MenuItemType } from "antd/es/menu/interface"
import { useAutoCollapsed } from "./hooks"
import { useStyles } from "./styles"
import UserMenus from "./components/UserMenus"
import OrganizationSwitch from "./components/OrganizationSwitch"
import { RoutePath } from "@/const/routes"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import { userStore } from "@/opensource/models/user"
import { observer } from "mobx-react-lite"

interface SiderProps {
	collapsed?: boolean
	className?: string
	menuItems?: Array<Array<MenuItemType>>
}

const userSquareRoundedKeys = [
	RoutePath.ContactsOrganization.replace(":id?", ""), // 替换掉路由的id参数，方便校验
	RoutePath.ContactsAiAssistant,
	RoutePath.ContactsMyFriends,
	RoutePath.ContactsMyGroups,
]

const Sider = observer(
	forwardRef<HTMLDivElement, SiderProps>(function Sider(
		{ collapsed = false, className, menuItems }: SiderProps,
		ref,
	) {
		const navigate = useNavigate()
		const { pathname } = useLocation()

		// 判断当前路径是否是通讯录相关路由
		const isUserSquareRoundedActive = useMemo(() => {
			return userSquareRoundedKeys.some((key) => pathname.startsWith(key))
		}, [pathname])

		// 选中状态计算
		const selectedKeys = useMemo(() => {
			// 如果是通讯录相关路由，返回通讯录的key
			if (isUserSquareRoundedActive) {
				return [RoutePath.ContactsOrganization]
			}
			// 其他情况返回当前路径
			return [pathname]
		}, [pathname, isUserSquareRoundedActive])

		const language = useGlobalLanguage(false)

		const { userInfo } = userStore.user

		const { styles, cx } = useStyles({ collapsed: useAutoCollapsed(collapsed), language })

		const handleNavigate = useMemoizedFn(({ key }: { key: string }) => {
			navigate(key)
		})

		const OrganizationSwitchChildren = useMemo(
			() => (
				<div className={styles.icon}>
					<MagicIcon color="currentColor" size={16} component={IconDots} />
				</div>
			),
			[styles.icon],
		)

		return (
			<Flex
				ref={ref}
				className={cx(styles.sider, className)}
				vertical
				align="center"
				justify="space-between"
			>
				<UserMenus>
					<MagicAvatar src={userInfo?.avatar} size={40}>
						{userInfo?.nickname}
					</MagicAvatar>
				</UserMenus>
				<Divider direction="horizontal" className={styles.divider} />
				<Flex vertical flex={1} className={styles.menus}>
					{menuItems?.map((menu, index) => {
						const key = `index-${index}`
						return (
							<Menu
								key={key}
								mode="inline"
								selectedKeys={selectedKeys}
								className={cx(styles.menu)}
								items={menu}
								onClick={handleNavigate}
							/>
						)
					})}
				</Flex>
				<Divider direction="horizontal" className={styles.divider} />
				<Flex gap={4} align="center" className={styles.organizationSwitchWrapper}>
					<OrganizationSwitch showPopover={false} />
					<OrganizationSwitch showPopover>
						{OrganizationSwitchChildren}
					</OrganizationSwitch>
				</Flex>
			</Flex>
		)
	}),
)

export default Sider
