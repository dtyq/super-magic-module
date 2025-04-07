/**
 * 主要根据不同的tab，返回不同的组件选择面板
 */

import { useMemo } from "react"
import { AuthSearchTypes } from "./useTabs"
import OrganizationSelectPanel from "../Panel/OrganizationSelectPanel/OrganizationSelectPanel"
import MemberSelectPanel from "../Panel/MemberSelectPanel/MemberSelectPanel"

type UseComponentProps = {
	tab: AuthSearchTypes
}
export default function useComponent({ tab }: UseComponentProps) {
	const LeftPanel = useMemo(() => {
		switch (tab) {
			case AuthSearchTypes.Organization:
				return <OrganizationSelectPanel />
			default:
				return <MemberSelectPanel />
		}
	}, [tab])

	return {
		LeftPanel,
	}
}
