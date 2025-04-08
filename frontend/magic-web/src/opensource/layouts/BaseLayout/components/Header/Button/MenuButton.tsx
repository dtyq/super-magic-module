import { IconMessages, IconPlus } from "@tabler/icons-react"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { useTranslation } from "react-i18next"
import { useBoolean, useMemoizedFn } from "ahooks"
import { Popover, Menu } from "antd"
import { useMemo, useState } from "react"
import CreateGroupConversationModal from "./CreateGroupConversationModal"
import Button from "./Button"
import { usePopoverStyles } from "./styles"

/** 才单类型 */
const enum MenuItemType {
	/** 设置按钮 */
	SettingsAction = "SettingsAction",
	/** 菜单按钮 */
	MenuAction = "MenuAction",
}

function MenuButton() {
	const { t } = useTranslation("interface")

	const { styles } = usePopoverStyles()

	const [popoverOpen, setPopoverOpen] = useState(false)

	const [
		CreateGroupConversationOpen,
		{ setTrue: openCreateGroupConversationModal, setFalse: closeCreateGroupConversationModal },
	] = useBoolean(false)

	const onClick = useMemoizedFn((event) => {
		switch (event.key) {
			case MenuItemType.MenuAction:
				openCreateGroupConversationModal()
				break
			default:
				break
		}
		setPopoverOpen(false)
	})

	const items = useMemo(() => {
		return [
			{
				key: MenuItemType.MenuAction,
				icon: <MagicIcon component={IconMessages} size={20} />,
				label: t("sider.LaunchAGroupChat", { ns: "interface" }),
			},
		]
	}, [t])

	// 处理 Popover 状态改变
	const onOpenChange = (newOpen: boolean) => {
		setPopoverOpen(newOpen)
	}

	return (
		<>
			<Popover
				overlayClassName={styles.popover}
				content={
					<Menu
						className={styles.menu}
						selectable={false}
						onClick={onClick}
						items={items}
						expandIcon={null}
					/>
				}
				trigger="click"
				placement="bottomRight"
				arrow={false}
				open={popoverOpen}
				onOpenChange={onOpenChange}
			>
				<Button>
					<IconPlus size={18} stroke={1.5} />
				</Button>
			</Popover>
			<CreateGroupConversationModal
				open={CreateGroupConversationOpen}
				close={closeCreateGroupConversationModal}
			/>
		</>
	)
}

export default MenuButton
