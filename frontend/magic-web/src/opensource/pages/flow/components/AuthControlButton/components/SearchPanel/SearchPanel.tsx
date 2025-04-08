import { Flex, Input, Radio } from "antd"
import { IconSearch } from "@tabler/icons-react"
import { cx } from "antd-style"
import { useTranslation } from "react-i18next"
import styles from "./SearchPanel.module.less"
import useTabs, { AuthSearchTypes } from "./hooks/useTabs"
import useKeyword from "./hooks/useKeyword"
import { SearchPanelProvider } from "./context/SearchPanelContext"
import useComponent from "./hooks/useComponent"
import { ManagerModalType } from "../../AuthManagerModal/types"
import { useAuthControl } from "../../AuthManagerModal/context/AuthControlContext"

export default function SearchPanel() {
	const { t } = useTranslation()

	const { type } = useAuthControl()

	const { keyword, setKeyword } = useKeyword()

	const { tabList, tab } = useTabs()

	const { LeftPanel } = useComponent({ tab })

	return (
		<SearchPanelProvider tab={tab} keyword={keyword}>
			<Flex className={styles.searchPanel} vertical>
				<Input
					prefix={<IconSearch size={20} color="#1C1D2359" />}
					value={keyword}
					onChange={(e) => setKeyword(e.target.value)}
					placeholder={t("common.search", { ns: "flow" })}
					className={styles.searchInput}
				/>
				{type === ManagerModalType.Auth && (
					<Radio.Group
						defaultValue={AuthSearchTypes.Member}
						buttonStyle="solid"
						className={styles.searchTypes}
					>
						{tabList.map((tabItem, i) => {
							return (
								<Radio.Button
									className={cx(styles.tabItem, {
										[styles.active]: tab === tabItem.value,
									})}
									onClick={tabItem.onClick}
									// eslint-disable-next-line react/no-array-index-key
									key={i}
									value={tabItem.value}
								>
									{tabItem.label}
								</Radio.Button>
							)
						})}
					</Radio.Group>
				)}
				{LeftPanel}
			</Flex>
		</SearchPanelProvider>
	)
}
