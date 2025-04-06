import { Switch } from "antd"
import type { DataSourceOption } from "@dtyq/magic-flow/common/BaseUI/DropdownRenderer/Reference"
import MagicInput from "@dtyq/magic-flow/common/BaseUI/Input"
import type { EXPRESSION_VALUE } from "@dtyq/magic-flow/MagicExpressionWidget/types"
import { FormItemType } from "@dtyq/magic-flow/MagicExpressionWidget/types"
import type { MagicFlow } from "@dtyq/magic-flow/MagicFlow/types/flow"
import type Schema from "@dtyq/magic-flow/MagicJsonSchemaEditor/types/Schema"
import { flowStore } from "@dtyq/magic-flow/MagicFlow/store/index"
import type { NodeSchema } from "@dtyq/magic-flow/MagicFlow"
import { get, last, isEmpty, isObject, isArray, cloneDeep, uniqBy, set, omitBy } from "lodash-es"
// @ts-ignore
import SnowFlakeId from "snowflake-id"
import i18next from "i18next"
import { useFlowStore } from "@/opensource/stores/flow"
import type { UseableToolSet } from "@/types/flow"
import { getLatestNodeVersion } from "@dtyq/magic-flow/MagicFlow/utils"
import { customNodeType } from "../constants"
import { shadow, unshadow } from "./shadow"

// 雪花id生成
const snowflake = new SnowFlakeId({
	mid: Math.floor(Math.random() * 1e10),
	offset: (2021 - 1970) * 365 * 24 * 3600 * 1000,
})

/** 获取某个节点类型的节点schema */
export const getNodeSchema = (nodeType: string | number): NodeSchema => {
	const { nodeVersionSchema } = flowStore.getState()
	const version = getLatestNodeVersion(nodeType) as string
	return get(nodeVersionSchema, [nodeType, version, "schema"])
}

export const findFieldInDataSource = (
	fieldKeys: string[],
	dataSourceOptions: DataSourceOption[],
): DataSourceOption => {
	const [curKey, ...restKeys] = [...fieldKeys]
	const foundField = dataSourceOptions.find((option) => {
		// 拿到切割后的最后一个key，作为匹配值
		const lastKey = last((option?.key as string)?.split?.("."))
		return lastKey === curKey
	})
	if (restKeys.length === 0) {
		return foundField as DataSourceOption
	}
	return findFieldInDataSource(restKeys, foundField?.children as DataSourceOption[])
}

export function generateSnowFlake() {
	return snowflake.generate()
}

/** 检查是否在循环体内 */
export const checkIsInLoop = (node: MagicFlow.Node) => {
	return node?.meta?.parent_id
}

export const getComponent = (type: string) => {
	const componentMap = {
		[FormItemType.Number]: <MagicInput type="number" />,
		[FormItemType.String]: <MagicInput.TextArea />,
		[FormItemType.Boolean]: <Switch />,
		[FormItemType.Integer]: <MagicInput type="number" />,
		[FormItemType.Array]: <div>暂不支持选择数组</div>,
		[FormItemType.Object]: <div>暂不支持选择对象</div>,
	}
	return componentMap?.[type as FormItemType]
}

/**
 * 根据schema,转换为动态form item
 * @param schema json schema
 * @param namePrefix
 * @returns
 */
// export const generateFormItems = (schema?: Schema, namePrefix: string = "") => {
// 	if (!schema) return null

// 	// @ts-ignore
// 	const { type, properties, items, title, key: schemaKey } = schema

// 	const formTitle = title || schemaKey

// 	if (type === FormItemType.Object && properties) {
// 		const objectLabel = namePrefix ? "" : formTitle
// 		// 递归处理对象类型，嵌套的对象也会被正确处理
// 		return (
// 			<Form.Item label={objectLabel} className="object-wrapper" name={schemaKey}>
// 				{Object.keys(properties).map((key) => {
// 					const propertySchema = properties[key]
// 					const fieldName = namePrefix ? `${namePrefix}.${key}` : `${schemaKey}.${key}`
// 					return (
// 						<Form.Item label={key} key={fieldName} name={fieldName.split(".")}>
// 							{generateFormItems(propertySchema, fieldName)}
// 						</Form.Item>
// 					)
// 				})}
// 			</Form.Item>
// 		)
// 	}

// 	if (type === FormItemType.Array && items) {
// 		// 使用 Form.List 来处理数组，数组中的元素可能是对象或数组
// 		return (
// 			<Form.Item label={formTitle} className="array-wrapper">
// 				<Form.List name={namePrefix || schemaKey}>
// 					{(fields, { add, remove }) => {
// 						return (
// 							<div className="array-item">
// 								{fields.map(({ key, name }, index) => (
// 									<Flex
// 										justify="space-between"
// 										align="center"
// 										gap={10}
// 									>
// 										<Form.Item
// 											key={key}
// 											name={name}
// 											label={`${index}`}
// 											style={{ flex: 1 }}
// 										>
// 											{/* 对数组项进行递归处理 */}
// 											{generateFormItems(items, `${name}`)}
// 										</Form.Item>
// 										<IconTrash
// 											className="icon-trash"
// 											width={20}
// 											onClick={() => remove(name)}
// 										/>
// 									</Flex>
// 								))}
// 								<div className="add-btn" onClick={() => add()}>
// 									<IconPlus />
// 									<span className="text">新增一项</span>
// 								</div>
// 							</div>
// 						)
// 					}}
// 				</Form.List>
// 			</Form.Item>
// 		)
// 	}

// 	// 处理基本类型 (string, number, boolean 等)
// 	return componentMap?.[type as FormItemType]
// }

/**
 * 在schema里面寻找表达式块
 * @param properties
 * @param result
 * @returns
 */
export const searchExpressionFieldsInSchema = (
	schema: Record<string, Schema>,
	result = [] as EXPRESSION_VALUE[],
) => {
	Object.values(schema?.properties || {}).forEach((subSchema) => {
		if (subSchema.type === FormItemType.Object) {
			searchExpressionFieldsInSchema(subSchema.properties || {}, result)
		}
		result.push(
			...(subSchema?.value?.expression_value || []),
			...(subSchema?.value?.const_value || []),
		)
	})
	return result.flat()
}

// 将多个数据源项合并同类项，因为都属于同个节点
export const mergeOptionsIntoOne = (options: DataSourceOption[]): DataSourceOption => {
	return options.reduce((mergeResult, currentOption) => {
		const newChildren = [
			...(mergeResult.children || []),
			...(currentOption.children || []),
		] as DataSourceOption[]
		// 根据节点id和key进行去重后的结果
		const uniqueChildren = uniqBy(newChildren, (obj) => `${obj.nodeId}_${obj.key}`)
		mergeResult = {
			...mergeResult,
			...currentOption,
			children: uniqueChildren,
		}
		return mergeResult
	}, {} as DataSourceOption)
}

export const getCurrentDateTimeString = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, "0")
	const day = String(now.getDate()).padStart(2, "0")
	const hours = String(now.getHours()).padStart(2, "0")
	const minutes = String(now.getMinutes()).padStart(2, "0")
	// const seconds = String(now.getSeconds()).padStart(2, "0")

	return `${year}${month}${day}${hours}${minutes}`
}

/**
 * 将flow的所有代码节点值都进行混淆处理
 */
export const shadowFlow = (flow: MagicFlow.Flow) => {
	const cloneFlow = cloneDeep(flow)

	const allCodeNode = Object.values(cloneFlow.nodes).filter(
		// eslint-disable-next-line eqeqeq
		(n) => n.node_type == customNodeType.Code,
	)

	allCodeNode.forEach((codeNode) => {
		const codeData = get(codeNode, ["params", "code"], "")
		set(codeNode, ["params", "code"], shadow(codeData))
	})

	return cloneFlow
}

/**
 * 将flow的所有代码节点值都进行解码处理
 */
export const unShadowFlow = (flow: MagicFlow.Flow) => {
	const cloneFlow = cloneDeep(flow)

	const allCodeNode = Object.values(cloneFlow.nodes).filter(
		// eslint-disable-next-line eqeqeq
		(n) => n.node_type == customNodeType.Code,
	)

	allCodeNode.forEach((codeNode) => {
		const codeData = get(codeNode, ["params", "code"], "")
		set(codeNode, ["params", "code"], unshadow(codeData))
	})

	return cloneFlow
}

/**
 * 将代码节点进行混淆处理
 */
export const shadowNode = (node: MagicFlow.Node) => {
	const cloneNode = cloneDeep(node)
	const codeData = get(cloneNode, ["params", "code"], "")
	set(cloneNode, ["params", "code"], shadow(codeData))
	return cloneNode
}

export function removeEmptyValues(obj: Record<string, any>): Record<string, any> {
	return omitBy(
		obj,
		(value) => isEmpty(value) || (isObject(value) && !isArray(value) && isEmpty(value)),
	)
}

export const getExpressionPlaceholder = (str: string) => {
	return `${str}${i18next.t("common.allowExpressionPlaceholder", { ns: "flow" })}`
}

// 根据id查找到工具集对应的工具
export const findTargetTool = (id: string) => {
	const { useableToolSets } = useFlowStore.getState()
	const allTools = useableToolSets.reduce(
		(tools, currentToolSet) => {
			return tools.concat(
				currentToolSet.tools.map((tool) => ({
					...tool,
					icon: currentToolSet.icon,
				})),
			)
		},
		[] as (UseableToolSet.UsableTool & { icon: string })[],
	)
	return allTools.find((tool) => tool.code === id)
}

export default {}
