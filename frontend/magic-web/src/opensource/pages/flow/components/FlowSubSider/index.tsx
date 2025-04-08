import { IconRouteSquare, IconTools, IconChevronRight, IconFileDatabase } from "@tabler/icons-react"
import { useState } from "react"
import { MagicList } from "@/opensource/components/MagicList"
import { useLocation, useNavigate } from "react-router"
import { RoutePath } from "@/const/routes"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import SubSiderContainer from "@/opensource/layouts/BaseLayout/components/SubSider"
import { IconMagicBots } from "@/enhance/tabler/icons-react"
import { FlowRouteType } from "@/types/flow"
import { createStyles, useAntdToken } from "antd-style"
import { useTranslation } from "react-i18next"
import { replaceRouteParams } from "@/utils/route"

const useStyles = createStyles(({ css }) => {
	return {
		container: css`
			width: 240px;
			flex-shrink: 0;
		`,
		subSiderItem: css`
			padding: 5px;
		`,
	}
})

function FlowSubSider() {
	const { t } = useTranslation()

	const { pathname } = useLocation()

	const [collapseKey, setCollapseKey] = useState<string>(pathname)

	const token = useAntdToken()

	const { styles } = useStyles()

	const navigate = useNavigate()

	return (
		<SubSiderContainer className={styles.container}>
			<MagicList
				itemClassName={styles.subSiderItem}
				active={collapseKey}
				onItemClick={({ id }) => {
					setCollapseKey(id)
					navigate(id)
				}}
				items={[
					{
						id: RoutePath.AgentList,
						title: t("common.agent", { ns: "flow" }),
						avatar: {
							src: <MagicIcon component={IconMagicBots} color="currentColor" />,
							style: { background: "#315CEC", padding: 6 },
						},
						extra: <MagicIcon component={IconChevronRight} />,
					},
					// {
					// 	id: `${RoutePath.Flows}?type=${FlowType.Main}`,
					// 	title: "工作流",
					// 	avatar: {
					// 		icon: <MagicIcon component={IconRouteSquare} />,
					// 		style: { background: "#FF7D00", padding: 8 },
					// 	},
					// },
					{
						id: replaceRouteParams(RoutePath.Flows, {
							type: FlowRouteType.Sub,
						}),
						title: t("common.flow", { ns: "flow" }),
						avatar: {
							icon: <MagicIcon component={IconRouteSquare} color="currentColor" />,
							style: { background: "#FF7D00", padding: 6 },
						},
						extra: <MagicIcon component={IconChevronRight} />,
					},
					{
						id: replaceRouteParams(RoutePath.Flows, {
							type: FlowRouteType.Tools,
						}),
						title: t("common.toolset", { ns: "flow" }),
						avatar: {
							icon: <MagicIcon component={IconTools} color="currentColor" />,
							style: { background: "#8BD236", padding: 6 },
						},
						extra: <MagicIcon component={IconChevronRight} />,
					},
					{
						id: replaceRouteParams(RoutePath.Flows, {
							type: FlowRouteType.Knowledge,
						}),
						title: t("vectorDatabase.name", { ns: "flow" }),
						avatar: {
							icon: <MagicIcon component={IconFileDatabase} color="currentColor" />,
							style: {
								background: token.magicColorScales.violet[5],
								padding: 8,
							},
						},
					},
				]}
			/>
		</SubSiderContainer>
	)
}

export default FlowSubSider
