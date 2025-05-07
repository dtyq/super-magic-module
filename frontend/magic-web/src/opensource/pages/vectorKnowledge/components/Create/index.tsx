import { useState, useMemo, useEffect } from "react"
import { Form, Input, Button, message, Flex, Modal, Spin } from "antd"
import { IconFileUpload, IconTrash, IconCircleCheck, IconChevronLeft } from "@tabler/icons-react"
import { LoadingOutlined } from "@ant-design/icons"
import { useMemoizedFn } from "ahooks"
import { cx } from "antd-style"
import DEFAULT_KNOWLEDGE_ICON from "@/assets/logos/knowledge-avatar.png"
import { useTranslation } from "react-i18next"
import { useUpload } from "@/opensource/hooks/useUploadFiles"
import { genFileData } from "@/opensource/pages/chatNew/components/MessageEditor/components/InputFiles/utils"
import { useNavigate } from "@/opensource/hooks/useNavigate"
import { replaceRouteParams } from "@/utils/route"
import { RoutePath } from "@/const/routes"
import { FlowRouteType } from "@/types/flow"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { useVectorKnowledgeCreateStyles } from "./styles"
import { getFileTypeIcon } from "../../constant"
import VectorKnowledgeEmbed from "../Embed"
import { KnowledgeApi } from "@/apis"
import DocumentUpload from "../Upload/DocumentUpload"
import ImageUpload from "../Upload/ImageUpload"
import VectorKnowledgeConfiguration from "../Configuration"
import type { TemporaryKnowledgeConfig } from "../../types"

type DataType = {
	name: string
	description: string
}

type UploadFileStatus = "done" | "error" | "uploading"

type UploadFileItem = {
	uid: string
	name: string
	file: File
	status: UploadFileStatus
	path?: string
}

export default function VectorKnowledgeCreate() {
	const { styles } = useVectorKnowledgeCreateStyles()

	const { t } = useTranslation("flow")

	const navigate = useNavigate()

	const [form] = Form.useForm<DataType>()

	// 预览图标URL
	const [previewIconUrl, setPreviewIconUrl] = useState(DEFAULT_KNOWLEDGE_ICON)
	// 上传图标URL
	const [uploadIconUrl, setUploadIconUrl] = useState("")
	// 上传文件列表
	const [fileList, setFileList] = useState<UploadFileItem[]>([])

	const { uploadAndGetFileUrl } = useUpload({
		storageType: "private",
	})

	// 是否允许提交
	const [allowSubmit, setAllowSubmit] = useState(false)
	// 临时缓存的知识库配置
	const [temporaryConfig, setTemporaryConfig] = useState<TemporaryKnowledgeConfig>()
	// 创建成功的知识库编码
	const [createdKnowledgeCode, setCreatedKnowledgeCode] = useState("")

	// 是否处于待配置状态
	const [isPendingConfiguration, setIsPendingConfiguration] = useState(false)
	// 是否处于待嵌入状态
	const [isPendingEmbed, setIsPendingEmbed] = useState(false)

	/** 初始化表单值 */
	const initialValues = useMemo(() => {
		return {
			name: "",
			description: "",
		}
	}, [])

	/** 上传文档 */
	const handleFileUpload = useMemoizedFn(async (file: File, uid?: string) => {
		// 更新上传的文件列表
		const newUid = uid || `${file.name}-${Date.now()}`
		if (uid) {
			setFileList((prevFileList) =>
				prevFileList.map((item) =>
					item.uid === uid ? { ...item, status: "uploading" } : item,
				),
			)
		} else {
			setFileList((prevFileList) => [
				...prevFileList,
				{ uid: newUid, name: file.name, file, status: "uploading" },
			])
		}
		// 上传文件
		const newFile = genFileData(file)
		// 已通过 beforeFileUpload 预校验，故传入 () => true 跳过方法校验
		const { fullfilled } = await uploadAndGetFileUrl([newFile], () => true)
		// 更新上传的文件列表状态
		if (fullfilled && fullfilled.length) {
			const { path } = fullfilled[0].value
			setFileList((prevFileList) =>
				prevFileList.map((item) =>
					item.uid === newUid ? { ...item, status: "done", path } : item,
				),
			)
		} else {
			setFileList((prevFileList) =>
				prevFileList.map((item) =>
					item.uid === newUid ? { ...item, status: "error" } : item,
				),
			)
		}
	})

	/** 删除文件 */
	const handleFileRemove = useMemoizedFn((e: any, uid: string) => {
		e?.domEvent?.stopPropagation?.()
		Modal.confirm({
			centered: true,
			title: t("knowledgeDatabase.deleteFile"),
			content: t("knowledgeDatabase.deleteDesc"),
			okText: t("button.confirm", { ns: "interface" }),
			cancelText: t("button.cancel", { ns: "interface" }),
			onOk: async () => {
				setFileList((prevFileList) => prevFileList.filter((item) => item.uid !== uid))
				message.success(t("common.deleteSuccess"))
			},
		})
	})

	/** 获取文件状态图标 */
	const getFileStatusIcon = useMemoizedFn((file: UploadFileItem) => {
		if (file.status === "done") {
			return <IconCircleCheck color="#32C436" size={24} />
		}
		if (file.status === "error") {
			return (
				<div className={styles.uploadRetry}>
					{t("knowledgeDatabase.uploadRetry")}
					<span
						className={styles.uploadRetryText}
						onClick={() => handleFileUpload(file.file, file.uid)}
					>
						{t("knowledgeDatabase.uploadRetryText")}
					</span>
				</div>
			)
		}
		if (file.status === "uploading") {
			return <Spin indicator={<LoadingOutlined spin />} />
		}
		return null
	})

	/** 上一步 - 返回上一页 */
	const handleBack = useMemoizedFn(() => {
		navigate(
			replaceRouteParams(RoutePath.Flows, {
				type: FlowRouteType.VectorKnowledge,
			}),
		)
	})

	/** 下一步 - 提交表单 */
	const handleSubmit = async () => {
		try {
			const values = await form.validateFields()
			setTemporaryConfig({
				name: values.name,
				icon: uploadIconUrl,
				description: values.description,
				enabled: true,
				document_files: fileList
					.filter((item) => !!item.path)
					.map((item) => ({
						name: item.name,
						key: item.path!,
					})),
			})
			setIsPendingConfiguration(true)
		} catch (error) {
			console.error("表单验证失败:", error)
		}
	}

	/** 必填项检验 */
	const nameValue = Form.useWatch("name", form)

	/** 配置页返回 */
	const handleConfigurationBack = useMemoizedFn(() => {
		setIsPendingConfiguration(false)
	})

	/** 配置页提交 */
	const handleConfigurationSubmit = useMemoizedFn(async (data: TemporaryKnowledgeConfig) => {
		try {
			// 调用接口创建知识库
			const res = await KnowledgeApi.createKnowledge(data)
			if (res) {
				// 清空表单
				form.resetFields()
				setUploadIconUrl("")
				setFileList([])
				setIsPendingConfiguration(false)
				setIsPendingEmbed(true)
				setCreatedKnowledgeCode(res.code)
				message.success(t("common.savedSuccess"))
			}
		} catch (error) {
			console.error("创建知识库失败:", error)
			message.error(t("knowledgeDatabase.saveConfigFailed"))
		}
	})

	// 判断是否允许提交
	useEffect(() => {
		setAllowSubmit(!!nameValue && fileList.length > 0)
	}, [nameValue, fileList])

	const PageContent = useMemo(() => {
		if (temporaryConfig && isPendingConfiguration) {
			return (
				<VectorKnowledgeConfiguration
					knowledgeBase={temporaryConfig}
					onBack={handleConfigurationBack}
					onSubmit={handleConfigurationSubmit}
				/>
			)
		}

		if (createdKnowledgeCode && isPendingEmbed) {
			return <VectorKnowledgeEmbed knowledgeBaseCode={createdKnowledgeCode} />
		}

		return (
			<Flex vertical justify="space-between" className={styles.container}>
				<div className={styles.content}>
					<div className={styles.title}>
						{t("knowledgeDatabase.createVectorKnowledge")}
					</div>
					<Form
						form={form}
						layout="vertical"
						requiredMark={false}
						initialValues={initialValues}
					>
						<Form.Item
							label={
								<div className={styles.label}>{t("knowledgeDatabase.icon")}</div>
							}
							rules={[
								{
									required: true,
									message: t("knowledgeDatabase.iconPlaceholder"),
								},
							]}
						>
							<ImageUpload
								previewIconUrl={previewIconUrl}
								setPreviewIconUrl={setPreviewIconUrl}
								setUploadIconUrl={setUploadIconUrl}
							/>
						</Form.Item>

						<Form.Item
							label={
								<div className={cx(styles.label, styles.required)}>
									{t("knowledgeDatabase.knowledgeName")}
								</div>
							}
							name="name"
							rules={[
								{
									required: true,
									message: t("knowledgeDatabase.namePlaceholder"),
								},
							]}
						>
							<Input placeholder={t("knowledgeDatabase.namePlaceholder")} />
						</Form.Item>

						<Form.Item
							label={
								<div className={styles.label}>
									{t("knowledgeDatabase.description")}
								</div>
							}
							name="description"
						>
							<Input.TextArea
								rows={4}
								placeholder={t("knowledgeDatabase.descriptionPlaceholder")}
							/>
						</Form.Item>

						<Form.Item
							label={
								<div className={cx(styles.label, styles.required)}>
									{t("common.uploadFile")}
								</div>
							}
						>
							<div>
								<DocumentUpload handleFileUpload={handleFileUpload}>
									<div className={styles.uploadIcon}>
										<IconFileUpload size={40} stroke={1} />
									</div>
									<div className={styles.uploadText}>
										{t("common.fileDragTip")}
									</div>
									<div className={styles.uploadDescription}>
										{`${t(
											"common.supported",
										)} TXT、MARKDOWN、PDF、XLSX、XLS、DOCX、CSV、XML`}
										<br />
										{t("common.fileSizeLimit", { size: "15MB" })}
									</div>
								</DocumentUpload>
								{fileList.map((file) => (
									<Flex
										align="center"
										justify="space-between"
										key={file.uid}
										className={styles.fileItem}
									>
										<Flex align="center" gap={8}>
											{getFileTypeIcon(file.name.split(".").pop()!)}
											<div>{file.name}</div>
										</Flex>
										<Flex align="center" gap={8}>
											{getFileStatusIcon(file)}
											<IconTrash
												style={{ cursor: "pointer" }}
												size={24}
												stroke={1.3}
												onClick={(e) => handleFileRemove(e, file.uid)}
											/>
										</Flex>
									</Flex>
								))}
							</div>
						</Form.Item>
					</Form>
				</div>
				<Flex justify="flex-end" align="center" className={styles.footer} gap={16}>
					<Button className={styles.backButton} onClick={handleBack}>
						{t("knowledgeDatabase.previousStep")}
					</Button>
					<Button type="primary" onClick={handleSubmit} disabled={!allowSubmit}>
						{t("knowledgeDatabase.nextStep")}
					</Button>
				</Flex>
			</Flex>
		)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		allowSubmit,
		previewIconUrl,
		uploadIconUrl,
		fileList,
		form,
		temporaryConfig,
		isPendingEmbed,
		handleFileRemove,
		handleSubmit,
	])

	return (
		<Flex className={styles.wrapper} vertical>
			<Flex className={styles.header} align="center" gap={14}>
				<MagicIcon
					component={IconChevronLeft}
					size={24}
					className={styles.arrow}
					onClick={handleBack}
				/>
				<div>{t("common.knowledgeDatabase")}</div>
			</Flex>
			{PageContent}
		</Flex>
	)
}
