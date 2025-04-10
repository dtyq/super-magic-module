import { Flex, Menu } from "antd"
import { useLocation } from "react-router-dom"
import { useMemoizedFn } from "ahooks"
import { IconChevronRight } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { useVectorKnowledgeSubSiderStyles } from "./styles"
import type { Knowledge } from "@/types/knowledge"
import DEFAULT_KNOWLEDGE_ICON from "@/assets/logos/knowledge-avatar.png"

interface SubSiderProps {
	setCurrentDetailPage: (page: "document" | "setting") => void
	knowledgeDetail: Knowledge.Detail
}

export default function SubSider({ setCurrentDetailPage, knowledgeDetail }: SubSiderProps) {
	const { styles } = useVectorKnowledgeSubSiderStyles()
	const location = useLocation()
	const { t } = useTranslation("flow")

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
					<img
						className={styles.logoImg}
						src={knowledgeDetail.icon || DEFAULT_KNOWLEDGE_ICON}
						alt=""
					/>
					<div className={styles.name}>{knowledgeDetail.name}</div>
				</Flex>
				<div>
					<div className={styles.descLabel}>{t("knowledgeDatabase.descLabel")}</div>
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
								<div>{t("knowledgeDatabase.documentTitle")}</div>
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
								<div>{t("knowledgeDatabase.setting")}</div>
								<IconChevronRight size={16} />
							</Flex>
						),
					},
				]}
			/>
		</Flex>
	)
}
