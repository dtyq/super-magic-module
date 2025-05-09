import { FlowApi } from "@/apis"
import { Flex, Avatar, message } from "antd"
import { useBoolean, useMemoizedFn, useResetState } from "ahooks"
import MagicButton from "@/opensource/components/base/MagicButton"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import type { MagicFlow } from "@dtyq/magic-flow/dist/MagicFlow/types/flow"
import { IconX, IconEdit } from "@tabler/icons-react"
import { memo, useEffect, useMemo } from "react"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import { useTranslation } from "react-i18next"
import type { FlowTool } from "@/types/flow"
import { FlowRouteType } from "@/types/flow"
import FlowEmptyImage from "@/assets/logos/empty-flow.png"
import ToolsEmptyImage from "@/assets/logos/empty-tools.svg"
import KeyManagerButton from "@/opensource/pages/flow/components/KeyManager/KeyManagerButton"
import { resolveToString } from "@dtyq/es6-template-strings"
import AuthControlButton from "@/opensource/pages/flow/components/AuthControlButton/AuthControlButton"
import {
	hasAdminRight,
	hasEditRight,
	hasViewRight,
	ResourceTypes,
} from "@/opensource/pages/flow/components/AuthControlButton/types"
import defaultFlowAvatar from "@/assets/logos/flow-avatar.png"
import defaultToolAvatar from "@/assets/logos/tool-avatar.png"
import useStyles from "./style"
import BindOpenApiAccount from "../BindOpenApiAccount"
import ToolCard from "../ToolCard"
import type { FlowWithTools } from "../../hooks/useFlowList"

export type DataType = MagicFlow.Flow & {
	icon?: string
	tools?: FlowTool.Tool[]
}

export type DrawerItem = {
	id?: string
	title: string
	desc: string
	type?: string
	enabled?: boolean
	required?: boolean
	more?: boolean
	rawData?: FlowTool.Tool
}

type RightDrawerProps = {
	open: boolean
	data: DataType
	flowType: FlowRouteType
	openAddOrUpdateFlow: () => void
	goToFlow: (id: string) => void
	onClose: () => void
	setToolSetId: React.Dispatch<React.SetStateAction<string>>
	getDropdownItems: (tool: FlowTool.Tool, flow: MagicFlow.Flow) => React.ReactNode
}

function RightDrawer({
	open,
	data,
	flowType,
	getDropdownItems,
	goToFlow,
	setToolSetId,
	openAddOrUpdateFlow,
	onClose,
}: RightDrawerProps) {
	const { styles } = useStyles({ open })

	const { t } = useTranslation("interface")
	const { t: globalT } = useTranslation()

	const [drawerItems, setDrawerItems, resetDrawerItems] = useResetState<DrawerItem[]>([])

	const [bindOpenApiAccountOpen, { setFalse: closeBindOpenApiAccount }] = useBoolean(false)
	const [keyManagerOpen, { setTrue: openKeyManager, setFalse: closeKeyManager }] =
		useBoolean(false)

	const isTools = useMemo(() => flowType === FlowRouteType.Tools, [flowType])

	const getDrawerItem = useMemoizedFn(async () => {
		switch (flowType) {
			case FlowRouteType.Tools:
				const tools = (data as FlowWithTools)?.tools
				if (tools?.length) {
					const items = tools.map((tool) => {
						return {
							id: tool.code,
							title: tool.name,
							desc: tool.description,
							enabled: tool.enabled,
							more: true,
							rawData: tool,
						}
					})
					setDrawerItems(items)
				}
				break
			case FlowRouteType.Sub:
				const subFlow = await FlowApi.getSubFlowArguments(data?.id as string)
				const structure = subFlow.input?.form.structure
				if (structure) {
					const { properties, required } = structure
					const items = Object.entries(properties || {}).map(([key, value]) => {
						const { title, type, description } = value
						return {
							title: key,
							desc: `${title} ${description}`,
							type,
							required: required?.includes(key) || false,
						}
					})
					setDrawerItems(items)
				}
				break
			case FlowRouteType.VectorKnowledge:
				break
			default:
				break
		}
	})

	useEffect(() => {
		if (open && data) {
			if (drawerItems.length) resetDrawerItems()
			getDrawerItem()
		}
		if (!open) {
			resetDrawerItems()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data, open, getDrawerItem, resetDrawerItems])

	const subTitle = useMemo(() => {
		return isTools
			? resolveToString(t("flow.hasToolsNum"), {
					num: (data as FlowWithTools)?.tools?.length || 0,
			  })
			: t("flow.flowInput")
	}, [data, isTools, t])

	const handleAddTool = useMemoizedFn(() => {
		if (data?.id) {
			setToolSetId(data?.id)
			openAddOrUpdateFlow()
		}
	})

	const handleGoToFlow = useMemoizedFn(
		(e: React.MouseEvent<HTMLElement, MouseEvent>, item: DrawerItem) => {
			if (isTools) {
				goToFlow(item.id!)
			} else {
				e.stopPropagation()
			}
		},
	)

	const handleInnerClose = useMemoizedFn(() => {
		if (bindOpenApiAccountOpen) closeBindOpenApiAccount()
		if (keyManagerOpen) closeKeyManager()
		onClose()
		resetDrawerItems()
	})

	const handlerInnerUpdateEnable = useMemoizedFn(async (e, tool) => {
		e.stopPropagation()
		await FlowApi.changeEnableStatus(tool.code)
		const text = tool.enabled
			? globalT("common.enabled", { ns: "flow" })
			: globalT("common.baned", { ns: "flow" })
		message.success(`${tool.name} ${text}`)

		tool.enabled = !tool.enabled
		const newDrawerItems = drawerItems.map((item) => {
			if (item.id === tool.code) {
				return {
					...item,
					enabled: tool.enabled,
				}
			}
			return item
		})
		setDrawerItems(newDrawerItems)
	})

	const buttons = useMemo(() => {
		const toolsBtn = [
			...(hasEditRight(data.user_operation)
				? [
						<MagicButton
							key="add-tools"
							type="primary"
							style={{ flex: 1 }}
							onClick={handleAddTool}
						>
							{t("flow.addTools")}
						</MagicButton>,
				  ]
				: []),
			...(hasAdminRight(data.user_operation)
				? [
						<AuthControlButton
							key="auth-control-tools"
							resourceType={ResourceTypes.Tools}
							resourceId={data?.id ?? ""}
						/>,
				  ]
				: []),
		]
		const flowsBtn = [
			...(hasViewRight(data.user_operation)
				? [
						<MagicButton
							key="go-to-flow"
							type="primary"
							onClick={() => goToFlow(data?.id ?? "")}
						>
							{hasEditRight(data.user_operation)
								? t("button.edit")
								: t("button.view")}
						</MagicButton>,
				  ]
				: []),
			...(hasEditRight(data.user_operation)
				? [
						// <MagicButton
						// 	type="text"
						// 	className={styles.button}
						// 	onClick={openBindOpenApiAccount}
						// >
						// 	{t("flow.appAuth")}
						// </MagicButton>,
						<MagicButton
							key="api-key"
							type="text"
							className={styles.button}
							onClick={openKeyManager}
						>
							API Key
						</MagicButton>,
				  ]
				: []),

			...(hasAdminRight(data.user_operation)
				? [
						<AuthControlButton
							key="auth-control-flow"
							resourceType={ResourceTypes.Flow}
							resourceId={data?.id ?? ""}
						/>,
				  ]
				: []),
		]
		return isTools ? toolsBtn : flowsBtn
	}, [
		data?.id,
		data.user_operation,
		goToFlow,
		handleAddTool,
		isTools,
		openKeyManager,
		styles.button,
		t,
	])

	const defaultAvatar = useMemo(() => {
		return (
			<img
				src={isTools ? defaultToolAvatar : defaultFlowAvatar}
				style={{ width: "50px", borderRadius: 8 }}
				alt=""
			/>
		)
	}, [isTools])

	return (
		<Flex vertical gap={10} className={styles.container}>
			<Flex vertical className={styles.top} gap={10}>
				<Flex justify="space-between" align="center" gap={8}>
					{data?.icon ? (
						<MagicAvatar style={{ borderRadius: 8 }} src={data?.icon} size={50}>
							{data?.name}
						</MagicAvatar>
					) : (
						defaultAvatar
					)}
					<Flex justify="flex-start" align="center" flex={1} gap={8}>
						<div className={styles.title}>{data?.name}</div>
						{hasEditRight(data.user_operation) && (
							<MagicIcon
								component={IconEdit}
								size={16}
								style={{ cursor: "pointer", flexShrink: 0 }}
								onClick={openAddOrUpdateFlow}
							/>
						)}
					</Flex>
					<MagicButton
						icon={<MagicIcon component={IconX} size={24} />}
						type="text"
						className={styles.close}
						onClick={handleInnerClose}
					/>
				</Flex>
				<div className={styles.desc}>{data?.description}</div>
			</Flex>
			<Flex justify="space-between" align="center" wrap style={{ width: "100%" }} gap={8}>
				{buttons.map((btn) => btn)}
			</Flex>
			{drawerItems.length === 0 && (
				<Flex vertical gap={4} align="center" justify="center" flex={1}>
					<Flex align="center" justify="center">
						<Avatar
							// @ts-ignore
							src={
								flowType === FlowRouteType.Tools ? ToolsEmptyImage : FlowEmptyImage
							}
							size={140}
						/>
					</Flex>
					<div className={styles.emptyTips}>
						{isTools
							? resolveToString(t("flow.emptyTips"), { title: t("flow.tools") })
							: resolveToString(t("flow.emptyTips"), { title: t("flow.flow") })}
					</div>
				</Flex>
			)}
			{drawerItems.length !== 0 && (
				<Flex vertical>
					<div className={styles.subTitle}>{subTitle}</div>
					<Flex vertical gap={10} className={styles.drawerContainer}>
						{drawerItems.map((item) => (
							<ToolCard
								key={item.id}
								data={data}
								item={item}
								isTools={isTools}
								handleGoToFlow={handleGoToFlow}
								hasEditRight={hasEditRight}
								handlerInnerUpdateEnable={handlerInnerUpdateEnable}
								getDropdownItems={getDropdownItems}
							/>
						))}
					</Flex>
				</Flex>
			)}
			<BindOpenApiAccount
				open={bindOpenApiAccountOpen}
				onClose={closeBindOpenApiAccount}
				flowId={data.id!}
			/>
			<KeyManagerButton
				open={keyManagerOpen}
				onClose={closeKeyManager}
				flowId={data.id!}
				isAgent={false}
			/>
		</Flex>
	)
}
export default memo(RightDrawer)
