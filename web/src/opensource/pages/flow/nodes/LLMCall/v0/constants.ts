import type { LLMModalOption } from "@/types/flow"

export const getLLMRoleConstantOptions = () => {
	return [
		{
			title: "常量",
			key: "",
			nodeId: "Wrapper",
			nodeType: "21",
			type: "",
			isRoot: true,
			children: [
				{
					title: "User",
					key: "user",
					nodeId: "",
					nodeType: "21",
					type: "string",
					isRoot: false,
					children: [],
					isConstant: true,
				},
				{
					title: "System",
					key: "system",
					nodeId: "",
					nodeType: "21",
					type: "string",
					isRoot: false,
					children: [],
					isConstant: true,
				},
			],
		},
	]
}

export const getLLMModelOptions = (options: LLMModalOption[]) => {
	const selectableOptions = options.map((option) => {
		return {
			title: option.label,
			key: option.value,
			nodeId: "",
			nodeType: "21",
			type: "string",
			isRoot: false,
			children: [],
			isConstant: true,
		}
	})
	const resultOption = {
		title: "常量",
		key: "",
		nodeId: "Wrapper",
		nodeType: "21",
		type: "",
		isRoot: true,
		children: selectableOptions,
	}

	return [resultOption]
}

export default {}
