import MagicDropdown from "@/opensource/components/base/MagicDropdown"
import type { Knowledge } from "@/types/knowledge"
import { Modal, message, type MenuProps } from "antd"
import type React from "react"
import { useMemo } from "react"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { IconTrash } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import { useTranslation } from "react-i18next"
import { hasAdminRight } from "@/opensource/pages/flow/components/AuthControlButton/types"
import { KnowledgeApi } from "@/apis"
import { MenuKeys } from "./constants"

interface RecordMenuProps extends React.PropsWithChildren {
	record: Knowledge.KnowledgeItem
	deleteKnowledgeById: (id: string) => void
	[key: string]: any
}

export default function RecordMenu({
	record,
	children,
	deleteKnowledgeById,
	...props
}: RecordMenuProps) {
	const { t } = useTranslation()

	/** 删除知识库 */
	const deleteItem = useMemoizedFn((e) => {
		e?.domEvent?.stopPropagation?.()
		Modal.confirm({
			centered: true,
			title: t("knowledgeDatabase.delete", { ns: "flow" }),
			content: t("knowledgeDatabase.deleteDesc", { ns: "flow" }),
			okText: t("button.confirm", { ns: "interface" }),
			cancelText: t("button.cancel", { ns: "interface" }),
			onOk: async () => {
				await KnowledgeApi.deleteKnowledge(record.id)
				message.success(t("knowledgeDatabase.deleteSuccess", { ns: "flow" }))
				deleteKnowledgeById(record.id)
			},
		})
	})

	const menuItems = useMemo<Exclude<MenuProps["items"], undefined>>(() => {
		return [
			...(hasAdminRight(record.user_operation)
				? [
						{
							key: MenuKeys.DeleteItem,
							label: t("common.delete", { ns: "flow" }),
							icon: <MagicIcon component={IconTrash} size={18} />,
							onClick: deleteItem,
						},
				  ]
				: []),
		]
	}, [deleteItem, record.user_operation, t])

	return (
		<MagicDropdown trigger={["contextMenu"]} menu={{ items: menuItems }} {...props}>
			{children}
		</MagicDropdown>
	)
}
