import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { useNodes } from "@/MagicFlow/context/NodesContext/useNodes"
import { checkHasNodeOutOfFlow, sortByEdges } from "@/MagicFlow/utils/reactflowUtils"
import { Modal } from "antd"
import { IconAlertCircleFilled, IconCircleCheckFilled } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import clsx from "clsx"
import i18next from "i18next"
import _ from "lodash"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import styles from "../index.module.less"

export default function useFlowHeader() {
	const { t } = useTranslation()
	const { flow, edges, description, debuggerMode, nodeConfig } = useFlow()
	const { nodes } = useNodes()

	const { header } = useExternal()

	// 返回事件
	const back = useMemoizedFn(() => {})

	const generateSubmitData = useMemoizedFn(async (enabled: boolean, isTip = true) => {
		if (!flow) return

		let config = _.cloneDeep(flow)

		const nodeIds = nodes.map((n) => n.node_id)

		let _nodes = Object.values(nodeConfig).filter((n) => nodeIds.includes(n.node_id))

		const configNodes = _nodes.map((node) => {
			return {
				...node,
			}
		})

		config.nodes = configNodes
		config.edges = edges.map((edge) =>
			_.pick(edge, ["id", "source", "target", "sourceHandle", "targetHandle"]),
		)
		config.description = description
		return { ...config, enabled }
	})

	const realSubmitFn = useMemoizedFn(async (status) => {
		const formData = await generateSubmitData(status)
		if (!formData) {
			return
		}

		if (formData.id) {
		} else {
		}
	})

	const submit = useMemoizedFn(async (status) => {
		/** 校验是否有节点，没有在主流程内 */
		const existOutOfFlowNode = checkHasNodeOutOfFlow(nodes, edges)
		if (debuggerMode) {
			const sortedNodes = sortByEdges(Object.values(nodeConfig), edges)

			const nextNodesMap = sortedNodes.reduce((acc, cur) => {
				return {
					...acc,
					[cur.node_id]: cur.next_nodes,
				}
			}, {})

			console.log("nextNodesMap", nextNodesMap)
			// @ts-ignore
			window.nextNodeMaps = nextNodesMap
		}

		if (existOutOfFlowNode) {
			Modal.confirm({
				title: t("flow.withoutTriggerNodeTips", { ns: "magicFlow" }),
				type: "warning",
				onOk: () => {
					realSubmitFn(status)
				},
			})
		} else {
			realSubmitFn(status)
		}
	})

	const FlowStatusLabelMap = useMemo(() => {
		return {
			// [FlowStatus.UnSave]: "未发布",
			// [FlowStatus.Draft]: "已保存",
			// [FlowStatus.Enable]: "已发布",
			true: i18next.t("flow.enabled", { ns: "magicFlow" }),
			false: i18next.t("flow.baned", { ns: "magicFlow" }),
		}
	}, [t])

	// 当前tag列表
	const tagList = useMemo(() => {
		const result = [
			{
				icon: flow?.enabled ? (
					<IconCircleCheckFilled className={clsx(styles.tagIcon, styles.checked)} />
				) : (
					<IconAlertCircleFilled className={clsx(styles.tagIcon, styles.warning)} />
				),
				text: FlowStatusLabelMap[`${flow?.enabled!}`],
			},
			{
				icon: null,
				text: description,
			},
		]
		return result
	}, [FlowStatusLabelMap, description, flow])

	const isSaveBtnLoading = useMemo(() => {
		return false

		// return saveStatus === FlowStatus.Draft && (updateLoading || createLoading)
	}, [])

	const isPublishBtnLoading = useMemo(() => {
		return false

		// return saveStatus === FlowStatus.Enable && (updateLoading || createLoading)
	}, [])

	return {
		back,
		submit,
		tagList,
		isSaveBtnLoading,
		isPublishBtnLoading,
	}
}
