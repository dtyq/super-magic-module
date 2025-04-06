import { useTranslation } from "react-i18next"
import { Flex, Form, Input, message } from "antd"
import { useMemoizedFn } from "ahooks"
import { useForm } from "antd/es/form/Form"
import MagicModal from "@/opensource/components/base/MagicModal"
import type { MagicFlow } from "@dtyq/magic-flow/MagicFlow/types/flow"
import type { FlowTool } from "@/types/flow"
import { FlowRouteType, FlowType } from "@/types/flow"
import { useEffect, useMemo, useState } from "react"
import MagicAvatar from "@/opensource/components/base/MagicAvatar"
import type { FileData } from "@/opensource/components/MagicConversation/components/MagicInput/components/InputFiles/types"
import UploadButton from "@/opensource/pages/explore/components/UploadButton"
import { createStyles } from "antd-style"
import defaultFlowAvatar from "@/assets/logos/flow-avatar.png"
import defaultToolAvatar from "@/assets/logos/tool-avatar.png"
import { useUpload } from "@/opensource/hooks/useUploadFiles"
import { genFileData } from "@/opensource/pages/chatNew/components/MessageEditor/MagicInput/components/InputFiles/utils"
import { useBotStore } from "@/opensource/stores/bot"
import { FlowApi } from "@/apis"
import type { Knowledge } from "@/types/knowledge"

type AddOrUpdateFlowForm = Pick<MagicFlow.Flow, "name" | "description"> & {
	icon: string
}

type AddOrUpdateFlowProps = {
	flowType: FlowRouteType
	title: string
	open: boolean
	flow?: MagicFlow.Flow | Knowledge.KnowledgeItem
	tool?: FlowTool.Tool
	toolSetId?: string
	onClose: () => void
	updateFlowOrTool: (
		data: MagicFlow.Flow | FlowTool.Detail,
		isTool: boolean,
		update: boolean,
	) => void
	addNewFlow: (data: MagicFlow.Flow | FlowTool.Detail) => void
}

const useStyles = createStyles(({ css, token }) => {
	return {
		avatar: css`
			padding-top: 20px;
			padding-bottom: 20px;
			border-radius: 12px;
			border: 1px solid ${token.magicColorUsages.border};
		`,
		formItem: css`
			margin-bottom: 10px;
			&:last-child {
				margin-bottom: 0;
			}
		`,
	}
})

function AddOrUpdateFlow({
	flowType,
	title,
	flow,
	open,
	tool,
	toolSetId,
	onClose,
	updateFlowOrTool,
	addNewFlow,
}: AddOrUpdateFlowProps) {
	const { t } = useTranslation()
	const { t: globalT } = useTranslation()

	const { styles } = useStyles()

	const [imageUrl, setImageUrl] = useState<string>()

	const [form] = useForm<AddOrUpdateFlowForm>()

	const [isUpdate, setIsUpdate] = useState(false)

	const isTools = useMemo(() => flowType === FlowRouteType.Tools, [flowType])

	const operationTitle = useMemo(() => {
		// 判断是工具还是其他流程/工具集
		if (toolSetId) {
			return tool?.code ? "更新" : "创建"
		}
		return flow?.id ? "更新" : "创建"
	}, [flow?.id, tool?.code, toolSetId])

	const innerTitler = useMemo(() => {
		return toolSetId ? "工具" : title
	}, [toolSetId, title])

	const { uploading, uploadAndGetFileUrl } = useUpload<FileData>({
		storageType: "public",
	})

	const defaultAvatar = useBotStore((state) => state.defaultIcon.icons)

	const defaultAvatarIcon = useMemo(() => {
		return (
			<img
				src={isTools ? defaultToolAvatar : defaultFlowAvatar}
				style={{ width: "100px", borderRadius: 20 }}
				alt=""
			/>
		)
	}, [isTools])

	const handleCancel = useMemoizedFn(() => {
		form.resetFields()
		setImageUrl("")
		setIsUpdate(false)
		onClose()
	})

	const handleOk = useMemoizedFn(async () => {
		try {
			const res = await form.validateFields()
			try {
				const data =
					isTools && !toolSetId
						? // 工具集
						  await FlowApi.saveTool({
								id: flow?.id,
								name: res.name.trim(),
								description: res.description,
								icon: res.icon || defaultAvatar.tool_set,
						  })
						: // 流程及工具
						  await FlowApi.addOrUpdateFlowBaseInfo({
								id: toolSetId ? tool?.code : flow?.id,
								name: res.name.trim(),
								description: res.description,
								icon: res.icon || defaultAvatar.flow,
								// @ts-ignore
								type:
									flowType === FlowRouteType.Sub ? FlowType.Sub : FlowType.Tools,
								tool_set_id: toolSetId,
						  })

				message.success(globalT("common.savedSuccess", { ns: "flow" }))

				if (isUpdate) {
					// 更新当前卡片及列表数据
					updateFlowOrTool(data, !!(isTools && toolSetId), !!(toolSetId && tool?.code))
				} else {
					// 列表新增数据
					addNewFlow(data)
				}
				handleCancel()
			} catch (err: any) {
				if (err.message) console.error(err.message)
			}
		} catch (err_1) {
			console.error("form validate error: ", err_1)
		}
	})

	const onFileChange = useMemoizedFn(async (fileList: FileList) => {
		const newFiles = Array.from(fileList).map(genFileData)
		// 先上传文件
		const { fullfilled } = await uploadAndGetFileUrl(newFiles)
		if (fullfilled.length) {
			const { url, path: key } = fullfilled[0].value
			setImageUrl(url)
			form.setFieldsValue({
				icon: key,
			})
		} else {
			message.error(t("file.uploadFail", { ns: "message" }))
		}
	})

	useEffect(() => {
		if (open && toolSetId && tool) {
			form.setFieldsValue({
				name: tool.name,
				description: tool.description,
				icon: tool.icon,
			})
			setImageUrl(tool.icon)
		} else if (open && flow) {
			form.setFieldsValue({
				name: flow.name,
				description: flow.description,
				icon: flow.icon,
			})
			setImageUrl(flow.icon)
		}
	}, [flow, form, open, tool, toolSetId])

	useEffect(() => {
		if (open) {
			if ((toolSetId && tool?.code) || flow?.id) {
				setIsUpdate(true)
			}
		}
	}, [flow?.id, open, tool?.code, toolSetId])

	return (
		<MagicModal
			title={`${operationTitle}${innerTitler}`}
			open={open}
			onOk={handleOk}
			onCancel={handleCancel}
			afterClose={() => form.resetFields()}
			closable
			maskClosable={false}
			okText={t("button.confirm", { ns: "interface" })}
			cancelText={t("button.cancel", { ns: "interface" })}
			centered
		>
			<Form
				form={form}
				validateMessages={{ required: t("form.required", { ns: "interface" }) }}
				layout="vertical"
				preserve={false}
			>
				{!toolSetId && (
					<Form.Item name="icon" className={styles.formItem}>
						<Flex vertical align="center" gap={10} className={styles.avatar}>
							{imageUrl ? (
								<MagicAvatar
									src={imageUrl}
									size={100}
									style={{ borderRadius: 20 }}
								/>
							) : (
								defaultAvatarIcon
							)}
							<Form.Item name="icon" noStyle>
								<UploadButton loading={uploading} onFileChange={onFileChange} />
							</Form.Item>
						</Flex>
					</Form.Item>
				)}
				<Form.Item
					name="name"
					label={`${innerTitler}名称`}
					required
					rules={[{ required: true }]}
					className={styles.formItem}
				>
					<Input placeholder={`请输入${innerTitler}名称`} />
				</Form.Item>
				<Form.Item
					name="description"
					label={`${innerTitler}描述`}
					className={styles.formItem}
					required={!!toolSetId}
				>
					<Input.TextArea
						style={{
							minHeight: "138px",
						}}
						placeholder={`请输入${innerTitler}描述`}
					/>
				</Form.Item>
			</Form>
		</MagicModal>
	)
}

export default AddOrUpdateFlow
