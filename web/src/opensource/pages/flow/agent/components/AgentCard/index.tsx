import { Flex, message, Switch, Tag } from "antd"
import { createStyles, cx } from "antd-style"

import { IconCircleCheckFilled, IconAlertCircleFilled } from "@tabler/icons-react"
import type { Bot } from "@/types/bot"
import PromptCard from "@/opensource/pages/explore/components/PromptCard"
import { memo, useEffect, useState } from "react"
import { useMemoizedFn } from "ahooks"
import OperateMenu from "@/opensource/pages/flow/components/OperateMenu"
import { useTranslation } from "react-i18next"
import { hasEditRight } from "@/opensource/pages/flow/components/AuthControlButton/types"
import { colorScales } from "@/opensource/providers/ThemeProvider/colors"
import { BotApi } from "@/apis"
import { EntrepriseStatus, Status } from "../../constants"

const useStyles = createStyles(({ css, isDarkMode, token }) => {
	return {
		cardWrapper: css`
			font-size: 12px;
			line-height: 16px;
			font-weight: 400;
			padding: 12px;
			border-radius: 8px;
			color: ${isDarkMode ? token.magicColorScales.grey[2] : token.magicColorUsages.text[2]};
			border: 1px solid ${isDarkMode ? token.magicColorScales.grey[4] : token.colorBorder};
			position: relative;
			cursor: pointer;
			min-height: 142px;
		`,
		statusWrapper: css`
			height: 20px;
		`,
		moreOperations: css`
			position: absolute;
			right: 12px;
			top: 12px;
			z-index: 10;
			cursor: pointer;
		`,
		tag: css`
			margin-right: 0;
			display: flex;
			align-items: center;
			gap: 2px;
		`,
		green: css`
			background-color: ${isDarkMode
				? token.magicColorScales.green[0]
				: token.magicColorScales.green[0]};
			color: ${isDarkMode
				? token.magicColorScales.green[5]
				: token.magicColorScales.green[5]};
			border: none;
		`,
		orange: css`
			background-color: ${isDarkMode
				? token.magicColorUsages.fill[2]
				: token.magicColorUsages.fill[0]};
			color: ${isDarkMode ? token.magicColorUsages.text[3] : token.magicColorUsages.text[2]};
			border: none;
		`,
		blue: css`
			background-color: ${isDarkMode
				? token.magicColorScales.brand[8]
				: token.magicColorScales.brand[0]};
			color: ${isDarkMode ? token.magicColorUsages.text[3] : token.magicColorUsages.text[2]};
			border: none;
		`,
	}
})

interface AgentCardProps {
	card: Bot.BotItem
	onCardClick: (id: string) => void
	dropdownItems?: React.ReactNode
}

function Card({ card, dropdownItems, onCardClick }: AgentCardProps) {
	const { styles } = useStyles()

	const { t } = useTranslation("interface")
	const { t: globalT } = useTranslation()

	const [enable, setEnable] = useState(false)

	const updateAgentEnable = useMemoizedFn(async (value, event) => {
		event.stopPropagation()
		setEnable(value)
		await BotApi.updateBotStatus(card.id, value ? Status.enable : Status.disable)
		const text = value
			? globalT("common.enabled", { ns: "flow" })
			: globalT("common.baned", { ns: "flow" })
		message.success(`${card.robot_name} ${text}`)
	})

	useEffect(() => {
		if (card) {
			setEnable(card.status === Status.enable)
		}
	}, [card])

	const getTags = useMemoizedFn((status) => {
		switch (status) {
			case EntrepriseStatus.unrelease:
				return (
					<Tag
						icon={<IconAlertCircleFilled size={12} color={colorScales.orange[5]} />}
						className={cx(styles.tag, styles.orange)}
					>
						未发布至企业内部
					</Tag>
				)
			case EntrepriseStatus.release:
				return (
					<Tag
						icon={<IconCircleCheckFilled size={12} />}
						className={cx(styles.tag, styles.green)}
					>
						发布至企业内部
					</Tag>
				)
			default:
				// return <Tag icon={<IconClockFilled size={12} color={token.magicColorUsages.primary.default} />} className={cx(styles.tag, styles.blue)}>企业内部审批中</Tag>
				break
		}
		return null
	})

	return (
		<Flex
			vertical
			className={styles.cardWrapper}
			gap={8}
			onClick={() => onCardClick(card.id)}
			justify="space-between"
		>
			<PromptCard
				data={{
					id: card.id,
					title: card.robot_name,
					icon: card.robot_avatar,
					description: card.robot_description,
				}}
				lineCount={2}
				height={64}
			/>
			<Flex justify="space-between" align="center" className={styles.statusWrapper}>
				{card.bot_version && (
					<Flex gap={4} align="center">
						{getTags(card.bot_version.enterprise_release_status)}
					</Flex>
				)}
				{hasEditRight(card.user_operation) && (
					<Flex gap={8} align="center" style={{ marginLeft: "auto" }}>
						{t("agent.status")}
						<Switch checked={enable} onChange={updateAgentEnable} size="small" />
					</Flex>
				)}
			</Flex>
			<span>{`${t("agent.createTo")} ${card.created_at?.replace(/-/g, "/")}`}</span>

			{hasEditRight(card.user_operation) && (
				<div className={styles.moreOperations}>
					<OperateMenu menuItems={dropdownItems} useIcon />
				</div>
			)}
		</Flex>
	)
}

const AgentCard = memo((props: AgentCardProps) => {
	return (
		<OperateMenu
			trigger="contextMenu"
			placement="right"
			menuItems={props.dropdownItems}
			key={props.card.id}
		>
			<Card {...props} />
		</OperateMenu>
	)
})

export default AgentCard
