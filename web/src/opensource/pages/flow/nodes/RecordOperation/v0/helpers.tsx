import { get, unionBy } from "lodash-es"
import { FormItemType, LabelTypeMap } from "@dtyq/magic-flow/MagicExpressionWidget/types"
import type { Sheet } from "@/types/sheet"
import type JSONSchema from "@dtyq/magic-flow/MagicJsonSchemaEditor/types/Schema"
import { getDefaultSchema } from "@dtyq/magic-flow/MagicJsonSchemaEditor/utils/SchemaUtils"
import { Schema } from "@/types/sheet"
import { ComponentTypes } from "@/types/flow"
import { generateSnowFlake } from "@/opensource/pages/flow/utils/helpers"
import { UserType } from "@/types/user"
import { ContactApi } from "@/apis"
import type { RowDataSource, TeamshareUser } from "./types"

export const getPlaceholder = (
	column: Sheet.Column,
	columnType: Schema,
	isSpecialHandle?: boolean,
) => {
	switch (columnType) {
		case Schema.TEXT:
		case Schema.NUMBER:
		case Schema.LINK:
			return "请输入"
		case Schema.MEMBER:
		case Schema.CREATED:
		case Schema.UPDATED:
			return "选择成员"
		case Schema.QUOTE_RELATION:
		case Schema.MUTUAL_RELATION:
		case Schema.SELECT:
		case Schema.MULTIPLE:
			return "请选择"
		case Schema.DATE:
		case Schema.CREATE_AT:
		case Schema.UPDATE_AT:
		case Schema.TODO_FINISHED_AT:
			if (isSpecialHandle) return "YYYY-MM-DD"
			return get(column, ["columnProps", "format"], "YYYY-MM-DD")
		default:
			return ""
	}
}

const getMember = (dataSource: RowDataSource, columnType: Schema, columnId: string) => {
	let allMember = Object.keys(dataSource).reduce((members, rowId) => {
		let member = [] as TeamshareUser[]

		if (columnType === Schema.CREATED) member = [dataSource[rowId].creator]
		else if (columnType === Schema.UPDATED) member = [dataSource[rowId].modifier]
		else member = get(dataSource, [rowId, columnId || ""], [])

		members.push(...member)
		return members
	}, [] as TeamshareUser[])
	allMember = unionBy(allMember, "id")
	return allMember
}

export const getSetRecordValueOptions = (
	columns: Record<string, Sheet.Column>,
	columnId: string,
	dataSource: RowDataSource,
) => {
	const column = columns[columnId]
	const columnType = column?.columnType
	switch (columnType) {
		case Schema.TEXT:
		case Schema.NUMBER:
			return null
		case Schema.DATE:
		case Schema.TODO_FINISHED_AT:
			return null
		case Schema.SELECT:
		case Schema.MULTIPLE:
			return column.columnProps.options
		case Schema.MEMBER:
			return getMember(dataSource, column.columnType, columnId)
		case Schema.QUOTE_RELATION:
		case Schema.MUTUAL_RELATION:
			// return getRelationValues(columns, columnId, dataSource, dataTemplate)
			return null
		default:
			return null
	}
}

export const getRenderType = (schemaType: Schema) => {
	switch (schemaType) {
		case Schema.CHECKBOX:
			return LabelTypeMap.LabelCheckbox
		case Schema.DATE:
			return LabelTypeMap.LabelDateTime
		case Schema.MEMBER:
			return LabelTypeMap.LabelMember
		case Schema.SELECT:
			return LabelTypeMap.LabelSelect
		case Schema.MULTIPLE:
			return LabelTypeMap.LabelMultiple
		default:
			return LabelTypeMap.LabelText
	}
}

// 根据字段类型，获取表达式组件渲染属性
export const getExpressionRenderConfig = (column: Sheet.Column) => {
	switch (column?.columnType) {
		case Schema.CHECKBOX:
			return {
				type: LabelTypeMap.LabelCheckbox,
				props: {},
			}
		case Schema.DATE:
		case Schema.CREATE_AT:
		case Schema.UPDATE_AT:
			return {
				type: LabelTypeMap.LabelDateTime,
				props: {},
			}
		case Schema.MEMBER:
			return {
				type: LabelTypeMap.LabelMember,
				props: {
					options: [],
					value: [],
					onSearch: async (searchInfo: { with_department: number; name: string }) => {
						const searchedUsers = await ContactApi?.searchUser?.({
							query: searchInfo.name,
							page_token: "",
							// @ts-ignore
							query_type: 2,
						})
						if (searchedUsers?.items?.length) {
							const filterUsers = searchedUsers?.items?.filter(
								(user) => user.user_type !== UserType.AI,
							)
							const filterUserInfos = filterUsers.map((user) => {
								return {
									id: user.user_id,
									name: user.real_name || user.nickname,
									avatar: user.avatar_url,
								}
							})
							return filterUserInfos
						}
						return []
					},
				},
			}
		case Schema.SELECT:
			return {
				type: LabelTypeMap.LabelSelect,
				props: {
					value: [],
					options: column?.columnProps?.options,
				},
			}
		case Schema.MULTIPLE:
			return {
				type: LabelTypeMap.LabelMultiple,
				props: {
					value: [],
					options: column?.columnProps?.options,
				},
			}
		default:
			return undefined
	}
}
/** 根据类型生成默认的schema，可以通过defaultProps新增一些其他属性或者覆盖默认属性 */
export const getDefaultSchemaWithDefaultProps = (
	type: string,
	defaultProps: Partial<JSONSchema>,
	itemsType?: string,
) => {
	return {
		...getDefaultSchema(type, itemsType),
		...defaultProps,
	}
}

// 生成成员的output
const generateMemberProperties = (column: Sheet.Column) => {
	const prefix = column.label
	const propertiesList = [
		{
			type: FormItemType.String,
			title: `${prefix}ID`,
			key: "id",
		},
		{
			type: FormItemType.String,
			title: `${prefix}名称`,
			key: "name",
		},
		{
			type: FormItemType.String,
			title: `${prefix}头像`,
			key: "avatar",
		},
	]
	return propertiesList.reduce((acc, property) => {
		acc[property.key] = getDefaultSchemaWithDefaultProps(property.type, {
			title: property.title,
			// @ts-ignore
			key: property.key,
		})
		return acc
	}, {} as Record<string, JSONSchema>)
}

const generateMultipleProperties = (column: Sheet.Column) => {
	const prefix = column.label
	const propertiesList = [
		{
			type: FormItemType.String,
			title: `${prefix}ID`,
			key: "id",
		},
		{
			type: FormItemType.String,
			title: `${prefix}文本`,
			key: "label",
		},
	]

	return propertiesList.reduce((acc, property) => {
		acc[property.key] = getDefaultSchemaWithDefaultProps(property.type, {
			title: property.title,
			// @ts-ignore
			key: property.key,
		})
		return acc
	}, {} as Record<string, JSONSchema>)
}

const generateDateTimeProperties = (column: Sheet.Column) => {
	const prefix = column.label
	const propertiesList = [
		{
			type: FormItemType.String,
			title: `${prefix}时间戳`,
			key: "time",
		},
		{
			type: FormItemType.String,
			title: `${prefix}字符串`,
			key: "timestamp",
		},
	]

	return propertiesList.reduce((acc, property) => {
		acc[property.key] = getDefaultSchemaWithDefaultProps(property.type, {
			title: property.title,
			// @ts-ignore
			key: property.key,
		})
		return acc
	}, {} as Record<string, JSONSchema>)
}

// column类型映射为json-schema类型
function mapColumnTypeToJSONSchema(column: Sheet.Column): JSONSchema {
	const defaultProps = {
		key: column.id,
		title: column.label,
	}
	switch (column.columnType) {
		case Schema.MEMBER:
			const memberProperties = generateMemberProperties(column)
			return getDefaultSchemaWithDefaultProps(FormItemType.Object, {
				...defaultProps,
				properties: memberProperties,
			})
		case Schema.MULTIPLE:
			return getDefaultSchemaWithDefaultProps(FormItemType.Array, {
				...defaultProps,
				items: {
					type: FormItemType.Object,
					properties: generateMultipleProperties(column),
					value: null as any,
					title: "",
					description: "",
				},
			})
		case Schema.SELECT:
			return getDefaultSchemaWithDefaultProps(FormItemType.Object, {
				...defaultProps,
				properties: generateMultipleProperties(column),
			})
		case Schema.TEXT:
		case Schema.LINK:
			return getDefaultSchemaWithDefaultProps(FormItemType.String, defaultProps)
		case Schema.NUMBER:
			return getDefaultSchemaWithDefaultProps(FormItemType.Number, defaultProps)
		case Schema.DATE:
			return getDefaultSchemaWithDefaultProps(FormItemType.Object, {
				...defaultProps,
				properties: generateDateTimeProperties(column),
			})
		case Schema.CHECKBOX:
			return getDefaultSchemaWithDefaultProps(FormItemType.Boolean, defaultProps)
		// 添加其他类型的映射...
		default:
			return getDefaultSchemaWithDefaultProps(FormItemType.String, defaultProps) // 默认string类型
	}
}

// 将字段列表，转化为json-schema的键
export function convertColumnsToJSONSchema(columns: Sheet.Content["columns"]): JSONSchema {
	const schema = getDefaultSchema(FormItemType.Object)

	const rowIdSchema = {
		id: "row_id",
		label: "行ID",
		columnType: Schema.ROW_ID,
		columnProps: {},
		columnId: "row_id",
	}

	const withRowIdColumns = {
		row_id: rowIdSchema,
		...columns,
	} as Sheet.Content["columns"]

	Object.keys(withRowIdColumns).forEach((key) => {
		const column = withRowIdColumns[key]
		const columnSchema = mapColumnTypeToJSONSchema(column)

		// 设置属性
		schema.properties![key] = columnSchema

		// 如果配置有 required 则添加
		if (column.columnProps?.required) {
			schema.required!.push(key)
		}
	})

	return schema
}

/**
 * 生成组件默认数据
 * @param componentType
 * @returns
 */
export function genDefaultComponent(componentType: ComponentTypes, structure: any = null) {
	const uniqueId = generateSnowFlake()
	const result = {
		id: uniqueId,
		type: componentType,
		version: "1",
		structure,
	}

	// @ts-ignore
	return result
}

/** 生成表单组件 */
export function genFormComponent(defaultForm: JSONSchema | null = null) {
	return genDefaultComponent(ComponentTypes.Form, defaultForm)
}

/** schema.properties作为items传入 */
export function generateArrayForm(schema: JSONSchema) {
	return Object.entries(schema?.properties || {}).reduce((acc, [key, subSchema]) => {
		const defaultProps = {
			// @ts-ignore
			key,
			title: `${subSchema.title}列表`,
		}
		const withArraySchema = getDefaultSchemaWithDefaultProps(FormItemType.Array, {
			...defaultProps,
			items: subSchema,
		})
		acc[key] = withArraySchema
		return acc
	}, {} as Record<string, JSONSchema>)
}
