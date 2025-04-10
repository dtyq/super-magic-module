import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { Flex, message, Input, Button } from "antd"
import { useMemoizedFn } from "ahooks"
import { cx } from "antd-style"
import { useVectorKnowledgeSettingStyles } from "./styles"
import { KnowledgeApi } from "@/apis"
import type { Knowledge } from "@/types/knowledge"
import ImageUpload from "../Upload/ImageUpload"

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
					<ImageUpload
						className={styles.settingValue}
						previewIconUrl={iconPreviewUrl}
						setPreviewIconUrl={setIconPreviewUrl}
						setUploadIconUrl={setIconUploadUrl}
					/>
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
