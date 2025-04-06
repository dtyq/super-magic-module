import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { useUpload } from "@/opensource/hooks/useUploadFiles"
import { Flex, message, Upload, Input, Button } from "antd"
import { IconPhotoPlus } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import { genFileData } from "@/opensource/pages/chatNew/components/MessageEditor/MagicInput/components/InputFiles/utils"
import { cx } from "antd-style"
import { useVectorKnowledgeSettingStyles } from "./styles"
import { KnowledgeApi } from "@/apis"
import type { Knowledge } from "@/types/knowledge"
interface Props {
	knowledgeBaseCode: string
	updateKnowledgeDetail: (code: string) => void
}

export default function Setting({ knowledgeBaseCode, updateKnowledgeDetail }: Props) {
	const { styles } = useVectorKnowledgeSettingStyles()
	const { t } = useTranslation("flow")

	const [iconPreviewUrl, setIconPreviewUrl] = useState("")
	const [iconUploadUrl, setIconUploadUrl] = useState("")

	const [knowledgeName, setKnowledgeName] = useState("")
	const [knowledgeDescription, setKnowledgeDescription] = useState("")
	const [knowledgeEnabled, setKnowledgeEnabled] = useState(false)

	/**
	 * 更新设置展示的知识库详情
	 */
	const updateDetail = useMemoizedFn(async (res: Knowledge.Detail) => {
		setIconPreviewUrl(res.icon)
		setIconUploadUrl(res.icon)
		setKnowledgeName(res.name)
		setKnowledgeDescription(res.description)
		setKnowledgeEnabled(res.enabled)
		updateKnowledgeDetail(res.code)
	})

	const { uploading: iconUploading, uploadAndGetFileUrl } = useUpload({
		storageType: "private",
	})

	/**
	 * 上传图标文件
	 * @param iconFiles 图标文件
	 */
	const handleIconFileUpload = useMemoizedFn(async (iconFiles: File[]) => {
		// 创建本地URL用于预览
		const localPreviewUrl = URL.createObjectURL(iconFiles[0])
		const newFiles = iconFiles.map(genFileData)
		// 先上传文件
		const { fullfilled } = await uploadAndGetFileUrl(newFiles)
		if (fullfilled.length) {
			const { path } = fullfilled[0].value
			setIconUploadUrl(path)
			setIconPreviewUrl(localPreviewUrl)
			message.success(t("knowledgeDatabase.uploadSuccess"))
		} else {
			message.error(t("file.uploadFail", { ns: "message" }))
		}
	})

	/**
	 * 上传图标文件 - 预校验
	 * @param file 图标文件
	 * @returns
	 */
	const beforeIconUpload = useMemoizedFn((file: File) => {
		const isJpgOrPng = ["image/jpeg", "image/png"].includes(file.type)
		if (!isJpgOrPng) {
			message.error(t("knowledgeDatabase.onlySupportJpgPng"))
			return false
		}
		const isLt200K = file.size / 1024 < 200
		if (!isLt200K) {
			message.error(t("knowledgeDatabase.imageSizeLimit", { size: "200KB" }))
			return false
		}
		handleIconFileUpload([file])
		return false
	})

	/**
	 * 重置
	 */
	const handleReset = useMemoizedFn(async () => {
		if (knowledgeBaseCode) {
			await getKnowledgeDetail(knowledgeBaseCode)
			message.success(t("knowledgeDatabase.resetSuccess"))
		}
	})

	/**
	 * 保存
	 */
	const handleSave = useMemoizedFn(async () => {
		console.log(knowledgeName, knowledgeDescription)
		console.log(iconUploadUrl)
		const res = await KnowledgeApi.updateKnowledge({
			code: knowledgeBaseCode,
			name: knowledgeName,
			description: knowledgeDescription,
			icon: iconUploadUrl,
			enabled: knowledgeEnabled,
		})
		if (res) {
			updateDetail(res)
			message.success(t("common.savedSuccess"))
		}
	})

	/**
	 * 获取知识库详情
	 */
	const getKnowledgeDetail = useMemoizedFn(async (code: string) => {
		const res = await KnowledgeApi.getKnowledgeDetail(code)
		if (res) {
			updateDetail(res)
		}
	})

	useEffect(() => {
		if (knowledgeBaseCode) {
			getKnowledgeDetail(knowledgeBaseCode)
		}
	}, [knowledgeBaseCode])

	return (
		<>
			<div className={styles.settingTitle}>{t("knowledgeDatabase.setting")}</div>
			<Flex vertical gap={14} className={styles.settingContent}>
				{/* 图标 */}
				<Flex align="center" justify="space-between">
					<div className={cx(styles.required, styles.settingLabel)}>图标</div>
					<Flex align="center" gap={8} className={styles.settingValue}>
						<img className={styles.icon} src={iconPreviewUrl} alt="" />
						<Upload
							accept="image/jpg,image/png,image/jpeg"
							disabled={iconUploading}
							showUploadList={false}
							beforeUpload={beforeIconUpload}
						>
							<Flex align="center" gap={8} className={styles.iconUploader}>
								<IconPhotoPlus size={20} />
								<div style={{ whiteSpace: "nowrap" }}>
									{t("knowledgeDatabase.uploadNewIcon")}
								</div>
							</Flex>
						</Upload>
						<div className={styles.iconUploaderTip}>
							{t("knowledgeDatabase.iconFileLimit")}
						</div>
					</Flex>
				</Flex>

				{/* 知识库名称 */}
				<Flex align="flex-start" justify="space-between">
					<div className={cx(styles.required, styles.settingLabel)}>
						{t("knowledgeDatabase.knowledgeName")}
					</div>
					<div className={styles.settingValue}>
						<Input
							placeholder={t("knowledgeDatabase.namePlaceholder")}
							value={knowledgeName}
							onChange={(e) => setKnowledgeName(e.target.value)}
						/>
					</div>
				</Flex>

				{/* 描述 */}
				<Flex align="flex-start" justify="space-between">
					<div className={styles.settingLabel}>{t("knowledgeDatabase.description")}</div>
					<div className={styles.settingValue}>
						<Input.TextArea
							rows={4}
							placeholder={t("knowledgeDatabase.descriptionPlaceholder")}
							value={knowledgeDescription}
							onChange={(e) => setKnowledgeDescription(e.target.value)}
						/>
					</div>
				</Flex>

				{/* 重置、保存按钮 */}
				<Flex justify="end" gap={10}>
					<Button className={styles.resetButton} onClick={handleReset}>
						{t("common.reset")}
					</Button>
					<Button
						disabled={!knowledgeName}
						type="primary"
						className={styles.saveButton}
						onClick={handleSave}
					>
						{t("common.save")}
					</Button>
				</Flex>
			</Flex>
		</>
	)
}
