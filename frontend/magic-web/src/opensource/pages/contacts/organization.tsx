import { useMemoizedFn } from "ahooks"
import { createStyles } from "antd-style"
import type { OrganizationSelectItem } from "@/opensource/components/business/MemberDepartmentSelectPanel/types"
import type { ReactNode } from "react"
import type { StructureUserItem } from "@/types/organization"
import MemberCardStore from "@/opensource/stores/display/MemberCardStore"
import { isMember } from "@/opensource/components/business/OrganizationPanel/utils"
import OrganizationPanel from "@/opensource/components/business/OrganizationPanel"
import { useContactPageDataContext } from "./components/ContactDataProvider/hooks"

const useStyles = createStyles(({ css, token }) => {
	return {
		organization: css`
			height: calc(100vh - ${token.titleBarHeight ?? 0}px);
			min-height: calc(100vh - ${token.titleBarHeight ?? 0}px);
			padding: 20px;
			width: 100%;
		`,
		listItem: css`
			width: 100%;
		`,
	}
})

function OrganizationPage() {
	const { styles, cx } = useStyles()

	const { currentDepartmentPath } = useContactPageDataContext()

	const handleItemClick = useMemoizedFn((node: OrganizationSelectItem, toNext: () => void) => {
		if (!isMember(node)) {
			toNext()
		}
	})

	const memberNodeWrapper = useMemoizedFn((node: ReactNode, member: StructureUserItem) => {
		return (
			<div
				data-user-id={member.user_id}
				className={cx(styles.listItem, MemberCardStore.domClassName)}
			>
				{node}
			</div>
		)
	})

	return (
		<OrganizationPanel
			className={styles.organization}
			defaultSelectedPath={currentDepartmentPath}
			onItemClick={handleItemClick}
			memberNodeWrapper={memberNodeWrapper}
			showInstructions
		/>
	)
}

export default OrganizationPage
