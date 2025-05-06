import SwitchOrganization from "@/opensource/layouts/BaseLayout/components/Sider/components/OrganizationSwitch"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import UserMenus from "@/opensource/layouts/BaseLayout/components/Sider/components/UserMenus"
import { userStore } from "@/opensource/models/user"
import { IconFolder, IconLayoutGrid } from "@tabler/icons-react"
import { useResponsive } from "ahooks"
import { Flex, Tooltip } from "antd"
import { createStyles, cx } from "antd-style"
import { observer } from "mobx-react-lite"
import { useMemo } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import MagicLogo from "./assets/svg/super_magic_logo.svg"

const useStyles = createStyles(({ token }) => ({
	container: {
		display: "flex",
		overflow: "hidden",
		background: "#F9F9F9",
		height: "calc(100% - 44px)",
	},
	superContainer: {
		height: "100%",
	},
	normalContainer: {
		height: "calc(100% - 44px)",
	},
	sideNavContainer: {
		width: "50px",
		minWidth: "50px",
		height: "100%",
		background: "#fff",
		borderRight: `1px solid ${token.colorBorderSecondary}`,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 10,
	},
	menuItem: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		width: 30,
		height: 30,
		borderRadius: 8,
		cursor: "pointer",
		color: token.magicColorUsages.text[2],
		userSelect: "none",
		"&:not(:last-child)": {
			marginBottom: 10,
		},
		"&:hover": {
			color: token.magicColorUsages.text[1],
			backgroundColor: token.magicColorUsages.fill[0],
		},
		"&:active": {
			color: token.magicColorUsages.text[1],
			backgroundColor: token.magicColorUsages.fill[1],
		},
	},
	active: {
		color: `${token.colorPrimary} !important`,
		backgroundColor: `${token.magicColorUsages.primaryLight.default} !important`,
	},
	content: {
		flex: 1,
		overflow: "hidden",
	},
	logo: {
		width: "20px",
		height: "20px",
	},
}))

// 定义路由到菜单项的映射
const getMenuKeyFromPath = (pathname: string) => {
	const pathSegments = pathname.split("/")
	const lastSegment = pathSegments[pathSegments.length - 1]

	// 默认为workspace
	if (lastSegment === "super-magic") {
		return "workspace"
	}

	// 其他子路由
	return lastSegment
}

// 定义菜单项到路由的映射
const menuKeyToPath = {
	workspace: "workspace",
	archived: "archived",
	files: "files",
}

function SuperMagic() {
	const { styles } = useStyles()
	const navigate = useNavigate()
	const location = useLocation()
	const { userInfo } = userStore.user
	// 根据当前路径确定活动菜单项
	const selectedKey = getMenuKeyFromPath(location.pathname)
	// 处理菜单项选择
	const handleMenuSelect = ({ key }: { key: string }) => {
		const basePath = location.pathname.split("/")[1] // 获取基础路径（super 或 super-magic）
		navigate(`/${basePath}/${menuKeyToPath[key as keyof typeof menuKeyToPath]}`)
	}

	const menuItems = useMemo(() => {
		return [
			{
				key: "workspace",
				icon: <MagicIcon component={IconLayoutGrid} size={20} />,
				label: "工作区",
			},
			// {
			// 	key: "archived",
			// 	icon: <MagicIcon component={IconArchive} size={20} />,
			// 	label: "归档",
			// },
			// {
			// 	key: "files",
			// 	icon: <MagicIcon component={IconFolder} size={20} />,
			// 	label: "快捷访问",
			// },
		]
	}, [])

	const isSuperMagicRouter = location?.pathname?.startsWith("/super-magic")
	const isMobile = useResponsive().md === false
	return (
		// <DetailProvider>
		<div
			className={cx(
				styles.container,
				isSuperMagicRouter ? styles.normalContainer : styles.superContainer,
			)}
		>
			{isMobile ? null : (
				<div className={styles.sideNavContainer}>
					<Flex
						vertical
						align="center"
						justify="space-between"
						style={{
							gap: 10,
						}}
					>
						{isSuperMagicRouter ? null : (
							<img src={MagicLogo} alt="" className={styles.logo} />
						)}

						{menuItems.map((item) => {
							return (
								<Tooltip key={item.key} title={item.label} placement="right">
									<div
										className={cx(
											styles.menuItem,
											selectedKey === item.key && styles.active,
										)}
										onClick={() => {
											handleMenuSelect(item)
										}}
									>
										{item.icon}
									</div>
								</Tooltip>
							)
						})}
					</Flex>

					<Flex
						vertical
						align="center"
						justify="space-between"
						style={{
							gap: 10,
						}}
					>
						{isSuperMagicRouter ? null : (
							<>
								<UserMenus isPreviewMode>
									<MagicAvatar src={userInfo?.avatar} size={40}>
										{userInfo?.nickname}
									</MagicAvatar>
								</UserMenus>
								<SwitchOrganization showPopover needRefresh />
							</>
						)}
					</Flex>
				</div>
			)}
			<div className={styles.content}>
				<Outlet />
			</div>
		</div>
		// </DetailProvider>
	)
}

export default observer(SuperMagic)
