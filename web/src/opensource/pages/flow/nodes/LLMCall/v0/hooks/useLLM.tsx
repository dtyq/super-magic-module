import type { FormInstance } from "antd"
import { useMemoizedFn, useMount } from "ahooks"
import { useMemo, useState } from "react"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { customNodeType, templateMap } from "@/opensource/pages/flow/constants"
import { cloneDeep } from "lodash-es"
import type { LLMModalOption } from "@/types/flow"
import { FlowApi } from "@/apis"
import type { LLMParametersValue } from "../components/LLMParameters"
import useOldToolsHandleV0 from "../../../LLM/v0/hooks/useOldToolsHandle"

type UseLLM = {
	form: FormInstance<any>
}

export default function useLLM({ form }: UseLLM) {
	const { currentNode } = useCurrentNode()

	const [LLMValue, setLLMValue] = useState({
		temperature: 0.7,
		// top_p: {
		// 	open: false,
		// 	value: 1,
		// },
		// exist_penalty: {
		// 	open: false,
		// 	value: 0,
		// },
		// frequency_penalty: {
		// 	open: false,
		// 	value: 0,
		// },
		// max_tags: {
		// 	open: false,
		// 	value: 512,
		// },
		// ask_type: {
		// 	open: false,
		// },
		// stop_sequence: {
		// 	open: false,
		// },
	} as LLMParametersValue)

	const [data, setData] = useState([] as LLMModalOption[])

	// const LLMOptions = useMemo(() => {
	// 	return [
	// 		{
	// 			value: "gpt-4-turbo",
	// 			label: "GPT-4.0-turbo",
	// 			tags: [
	// 				{
	// 					type: LLMLabelTagType.Text,
	// 					value: "微软Azure",
	// 				},
	// 				{
	// 					type: LLMLabelTagType.Icon,
	// 					value: "icon-message",
	// 				},
	// 			],
	// 		},
	// 		{
	// 			value: "gpt-3.5-turbo",
	// 			label: "GPT-3.5-turbo",
	// 			tags: [
	// 				{
	// 					type: LLMLabelTagType.Text,
	// 					value: "微软Azure",
	// 				},
	// 				{
	// 					type: LLMLabelTagType.Icon,
	// 					value: "icon-message",
	// 				},
	// 			],
	// 		},
	// 	]
	// }, [])

	const onLLMValueChange = useMemoizedFn((value: LLMParametersValue) => {
		setLLMValue(value)
		const preValue = form.getFieldValue("llm")
		form?.setFieldsValue({
			llm: { ...preValue, ...value },
		})
	})

	const { handleOldTools } = useOldToolsHandleV0()

	const initialValues = useMemo(() => {
		const nodeParams = {
			...cloneDeep(templateMap[customNodeType.LLMCall].v0.params),
			...(currentNode?.params || {}),
		}
		if (!nodeParams)
			return {
				temperature: LLMValue.temperature,
			}
		// @ts-ignore
		const { model_config, ...rest } = nodeParams
		const restConfig = handleOldTools(rest)
		return {
			llm: {
				...LLMValue,
				...(model_config || {}),
			},
			...restConfig,
		}
	}, [LLMValue, currentNode?.params, handleOldTools])

	const initModels = useMemoizedFn(async () => {
		const { models } = await FlowApi.getLLMModal()
		setData(models)
	})

	useMount(() => {
		setLLMValue({
			...currentNode?.params?.model_config,
		})
		initModels()
	})

	return {
		LLMOptions: data,
		LLMValue,
		onLLMValueChange,
		initialValues,
	}
}
