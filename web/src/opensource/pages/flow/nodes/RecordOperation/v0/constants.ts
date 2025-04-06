import { Schema } from "@/types/sheet"
import i18next from "i18next"
import type { RecordType } from "."

export const NOT_SUPPORT_COLUMNS = [
	Schema.ATTACHMENT,
	Schema.ROW_ID,
	Schema.LINK,
	Schema.LOOKUP,
	Schema.CREATED,
	Schema.UPDATED,
	Schema.CREATE_AT,
	Schema.UPDATE_AT,
	Schema.FORMULA,
]

export const schemaType2Icon = {
	[Schema.SELECT]: "ts-checkbox-radio",
	[Schema.NUMBER]: "ts-number",
	[Schema.TEXT]: "ts-multiline-text",
	[Schema.MULTIPLE]: "ts-multiple-choice",
	[Schema.DATE]: "ts-date",
	[Schema.CHECKBOX]: "ts-checkbox",
	[Schema.LINK]: "ts-link",
	[Schema.ATTACHMENT]: "ts-attachment",
	[Schema.CREATE_AT]: "ts-create-time",
	[Schema.UPDATE_AT]: "ts-modify-time",
	[Schema.CREATED]: "ts-created-by",
	[Schema.UPDATED]: "ts-modified-by",
	[Schema.MEMBER]: "ts-user",
	[Schema.TODO_STATUS]: "ts-checkbox",
	[Schema.TODO_FINISHED_AT]: "ts-completion-time",
	[Schema.LOOKUP]: "ts-lookup",
	[Schema.QUOTE_RELATION]: "ts-one-way-link",
	[Schema.MUTUAL_RELATION]: "ts-two-wat-link",
	[Schema.ROW_ID]: "ts-ID",
	[Schema.FORMULA]: "ts-formula-line",
	[Schema.BUTTON]: "ts-button",
}

export enum FilterTypes {
	// 指定条件
	Conditions = "1",
	// 所有记录
	All = "2",
}

export enum ConditionTypes {
	// 指定条件
	And = "0",
	// 所有记录
	Or = "1",
}

export const filterOptions = [
	{
		label: i18next.t("common.allRecord", { ns: "flow" }),
		value: FilterTypes.All,
	},
	{
		label: i18next.t("common.pointedRecord", { ns: "flow" }),
		value: FilterTypes.Conditions,
	},
]

export const onlyConditionOptions = [
	{
		label: i18next.t("common.pointedRecord", { ns: "flow" }),
		value: FilterTypes.Conditions,
	},
]

export const conditionsOptions = [
	{
		label: i18next.t("common.all", { ns: "flow" }),
		value: ConditionTypes.And,
	},
	{
		label: i18next.t("common.any", { ns: "flow" }),
		value: ConditionTypes.Or,
	},
]

export const getFilterOptions = (type: RecordType) => {
	return type === "update" ? filterOptions : onlyConditionOptions
}
