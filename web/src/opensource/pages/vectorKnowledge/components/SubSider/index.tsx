import { Flex, Menu } from "antd"
import { useNavigate, useLocation } from "react-router-dom"
import { useMemoizedFn } from "ahooks"
import { createStyles } from "antd-style"
import { IconChevronRight, IconFileDescription, IconSettings } from "@tabler/icons-react"
import { RoutePath } from "@/const/routes"
import defaultFlowAvatar from "@/assets/logos/flow-avatar.png"
import { useVectorKnowledgeSubSiderStyles } from "./styles"
import type { Knowledge } from "@/types/knowledge"

interface SubSiderProps {
	setCurrentDetailPage: (page: "document" | "setting") => void
	knowledgeDetail: Knowledge.Detail
}

export default function SubSider({ setCurrentDetailPage, knowledgeDetail }: SubSiderProps) {
	const { styles } = useVectorKnowledgeSubSiderStyles()
	const location = useLocation()

	// 获取当前页面路径
	const isDocument = location.pathname.includes("/document")
	const isSetting = location.pathname.includes("/setting")

	// 默认选中的菜单项
	let defaultSelectedKey = "document"
	if (isDocument) {
		defaultSelectedKey = "document"
	} else if (isSetting) {
		defaultSelectedKey = "setting"
	}

	// 菜单点击处理
	const handleMenuClick = useMemoizedFn(({ key }: { key: string }) => {
		setCurrentDetailPage(key as "document" | "setting")
	})

	return (
		<Flex vertical className={styles.container}>
			<div className={styles.info}>
				<Flex align="center" gap={8}>
					<img className={styles.logoImg} src={knowledgeDetail.icon} alt="" />
					<div className={styles.name}>{knowledgeDetail.name}</div>
				</Flex>
				<div>
					<div className={styles.descLabel}>描述</div>
					<div className={styles.descContent}>{knowledgeDetail.description}</div>
				</div>
			</div>
			<Menu
				className={styles.menu}
				mode="inline"
				defaultSelectedKeys={[defaultSelectedKey]}
				onClick={handleMenuClick}
				items={[
					{
						key: "document",
						label: (
							<Flex
								justify="space-between"
								align="center"
								className={styles.menuItem}
							>
								<div>文档</div>
								<IconChevronRight size={16} />
							</Flex>
						),
					},
					{
						key: "setting",
						label: (
							<Flex
								justify="space-between"
								align="center"
								className={styles.menuItem}
							>
								<div>设置</div>
								<IconChevronRight size={16} />
							</Flex>
						),
					},
				]}
			/>
		</Flex>
	)
}
