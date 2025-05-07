import MagicModal from "@/opensource/components/base/MagicModal"
import { Avatar, Checkbox, Flex, Select } from "antd"
import { IconChevronDown } from "@tabler/icons-react"
import SearchInput from "@dtyq/magic-flow/dist/common/BaseUI/DropdownRenderer/SearchInput"
import { resolveToString } from "@dtyq/es6-template-strings"
import ToolsEmptyImage from "@/assets/logos/empty-tools.svg"
import { useTranslation } from "react-i18next"
import type { ToolSelectedItem } from "../../types"
import useToolsPanel from "./hooks/useToolsPanel"
import ToolsCard from "../ToolsCard/ToolsCard"
import styles from "./ToolsPanel.module.less"
import { ToolsPanelProvider } from "./context/ToolsPanelProvider"

type ToolsPanelModalProps = {
	open: boolean
	onClose: () => void
	onAddTool: (tool: ToolSelectedItem) => void
}

export default function ToolsPanel({ open, onAddTool, onClose }: ToolsPanelModalProps) {
	const { filteredUseableToolSets, keyword, setKeyword } = useToolsPanel({ open })
	const { t: interfaceT } = useTranslation("interface")
	const { t } = useTranslation()
	return (
		<MagicModal
			title={t("common.addTools", { ns: "flow" })}
			open={open}
			onCancel={onClose}
			maskClosable={false}
			width={800}
			footer={null}
			wrapClassName={styles.modalWrap}
		>
			<ToolsPanelProvider keyword={keyword} onAddTool={onAddTool}>
				<Flex className={styles.header} justify="space-between">
					<Flex className={styles.sortWrap} align="center">
						{t("common.sort", { ns: "flow" })}:
						<Select
							variant="borderless"
							options={[
								{
									label: t("common.recentlyVisit", { ns: "flow" }),
									value: "visited",
								},
							]}
							suffixIcon={<IconChevronDown size={20} />}
							className={styles.sortBy}
							value="visited"
						/>
					</Flex>
					<Flex align="center" gap={16} justify="space-between">
						<SearchInput
							placeholder={t("common.search", { ns: "flow" })}
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
						/>
						<Flex gap={8} justify="space-between">
							<Checkbox />
							<span>{t("common.onlyShowOfficial", { ns: "flow" })}</span>
						</Flex>
					</Flex>
				</Flex>
				{filteredUseableToolSets.length > 0 && (
					<Flex vertical gap={4}>
						{filteredUseableToolSets.map((toolSet) => {
							return <ToolsCard key={toolSet.id} toolSet={toolSet} />
						})}
					</Flex>
				)}
				{filteredUseableToolSets.length === 0 && (
					<Flex vertical gap={4} align="center" justify="center" flex={1}>
						<Flex align="center" justify="center">
							<Avatar src={ToolsEmptyImage} size={140} />
						</Flex>
						<div className={styles.emptyTips}>
							{resolveToString(interfaceT("flow.emptyTips"), {
								title: interfaceT("flow.tools"),
							})}
						</div>
					</Flex>
				)}
			</ToolsPanelProvider>
		</MagicModal>
	)
}
