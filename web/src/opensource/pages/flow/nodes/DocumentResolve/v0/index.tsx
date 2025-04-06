import { Form } from "antd"
import { useForm } from "antd/lib/form/Form"
import { useMemoizedFn } from "ahooks"
import { useFlow } from "@dtyq/magic-flow/MagicFlow/context/FlowContext/useFlow"
import { useCurrentNode } from "@dtyq/magic-flow/MagicFlow/nodes/common/context/CurrentNode/useCurrentNode"
import { set } from "lodash-es"
import { useTranslation } from "react-i18next"
import useInitialValue from "@/opensource/pages/flow/common/hooks/useInitialValue"
import MagicSelect from "@dtyq/magic-flow/common/BaseUI/Select"
import { File } from "@/types/sheet"
import NodeOutputWrap from "@/opensource/pages/flow/components/NodeOutputWrap/NodeOutputWrap"
import styles from "./index.module.less"
import { customNodeType } from "../../../constants"
import useCurrentNodeUpdate from "../../../common/hooks/useCurrentNodeUpdate"
import useSheetDataSource from "../../RecordOperation/v0/hooks/useSheetDataSource"
import FileSelectDropdownRenderer from "../../RecordOperation/v0/components/FileSelectDropdown/FileSelectDropdown"

export default function DocumentResolveV0() {
	const { t } = useTranslation()
	const [form] = useForm()
	const { updateNodeConfig } = useFlow()

	const { currentNode } = useCurrentNode()

	const { spaceType, setSpaceType, fileOptions, setFileOptions } = useSheetDataSource()

	const onValuesChange = useMemoizedFn((changeValues) => {
		if (!currentNode) return

		Object.entries(changeValues).forEach(([changeKey, changeValue]) => {
			set(currentNode, ["params", changeKey], changeValue)
		})

		updateNodeConfig({
			...currentNode,
		})
	})

	const { initialValues } = useInitialValue({ nodeType: customNodeType.DocumentResolve })

	useCurrentNodeUpdate({
		form,
		initialValues,
	})

	return (
		<NodeOutputWrap className={styles.documentResolveWrapper}>
			<Form
				form={form}
				layout="vertical"
				initialValues={initialValues}
				onValuesChange={onValuesChange}
			>
				<Form.Item
					className="document-resolve"
					name="file_id"
					label={t("documentResolve.selectFile", { ns: "flow" })}
				>
					<MagicSelect
						options={fileOptions}
						dropdownRenderProps={{
							placeholder: t("common.searchFiles", { ns: "flow" }),
							component: FileSelectDropdownRenderer,
							spaceType,
							setSpaceType,
							fileOptions,
							setFileOptions,
							fileType: File.FileType.Document,
						}}
					/>
				</Form.Item>
			</Form>
		</NodeOutputWrap>
	)
}
