import { useMemoizedFn } from "ahooks"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useAuthControl } from "../../../AuthManagerModal/context/AuthControlContext"
import { ManagerModalType } from "../../../AuthManagerModal/types"

export enum AuthSearchTypes {
	// 最近联系
	Member = 1,
	// 组织架构
	Organization = 2,
	// 群聊
	Group = 3,
	// 合作伙伴
	Partner = 4,
}

export default function useTabs() {
	const { t } = useTranslation()

	const { type } = useAuthControl()

	const [tab, setTab] = useState(
		type === ManagerModalType.Auth ? AuthSearchTypes.Member : AuthSearchTypes.Organization,
	)

	const changeTab = useMemoizedFn((e) => {
		if (typeof e !== "object") {
			setTab(e)
			return
		}
		setTab(e.target.value)
	})

	// 当前tab列表
	const tabList = useMemo(() => {
		return [
			{
				label: t("common.recentContact", { ns: "flow" }),
				value: AuthSearchTypes.Member,
				onClick: () => changeTab(AuthSearchTypes.Member),
			},
			{
				label: t("common.byOrganization", { ns: "flow" }),
				value: AuthSearchTypes.Organization,
				onClick: () => changeTab(AuthSearchTypes.Organization),
			},
			// {
			// 	label: "按群聊",
			// 	value: AuthSearchTypes.Group,
			// 	onClick: () => changeTab(AuthSearchTypes.Group),
			// },
			// {
			// 	label: "按合作伙伴",
			// 	value: AuthSearchTypes.Partner,
			// 	onClick: () => changeTab(AuthSearchTypes.Partner),
			// },
		]
	}, [changeTab, t])

	return {
		tabList,
		tab,
	}
}
