import { Form, Button, Flex } from "antd"
import { useVectorKnowledgeConfigurationStyles } from "./styles"
import { useConfigurationLogic } from "./hooks/useConfigurationLogic"
import SegmentSettingsSection from "./components/SegmentSettingsSection"
import EmbeddingModelSection from "./components/EmbeddingModelSection"
import SearchSettingsGroup from "./components/SearchSettingsGroup"
import SegmentPreview from "./components/SegmentPreview"
import type { TemporaryKnowledgeConfig } from "../../types"
import { useTranslation } from "react-i18next"

interface Props {
	knowledgeBase: TemporaryKnowledgeConfig
	onBack: () => void
	onSubmit: (data: TemporaryKnowledgeConfig) => Promise<void>
}

/**
 * 向量知识库配置组件
 */
export default function VectorKnowledgeConfiguration({ knowledgeBase, onBack, onSubmit }: Props) {
	const { styles } = useVectorKnowledgeConfigurationStyles()
	const { t } = useTranslation("flow")

	const {
		form,
		segmentMode,
		parentBlockType,
		embeddingModelOptions,
		segmentDocument,
		setSegmentDocument,
		segmentDocumentOptions,
		segmentPreviewResult,
		segmentPreviewLoading,
		handleSave,
		handleSegmentModeChange,
		handleParentBlockTypeChange,
		handleSegmentSettingReset,
		handleSegmentPreview,
		initialValues,
	} = useConfigurationLogic(knowledgeBase, onSubmit)

	return (
		<Flex className={styles.wrapper}>
			{/* 左侧 - 知识库配置 */}
			<Flex vertical justify="space-between" className={styles.leftWrapper}>
				<div className={styles.container}>
					<div className={styles.title}>
						{t("knowledgeDatabase.createVectorKnowledge")}
					</div>
					<div className={styles.content}>
						<Form form={form} layout="vertical" initialValues={initialValues}>
							{/* 分段设置 */}
							<SegmentSettingsSection
								segmentMode={segmentMode}
								parentBlockType={parentBlockType}
								segmentPreviewLoading={segmentPreviewLoading}
								handleSegmentModeChange={handleSegmentModeChange}
								handleParentBlockTypeChange={handleParentBlockTypeChange}
								handleSegmentPreview={handleSegmentPreview}
								handleSegmentSettingReset={handleSegmentSettingReset}
							/>

							{/* Embedding模型 */}
							<EmbeddingModelSection embeddingModelOptions={embeddingModelOptions} />

							{/* 检索设置 */}
							<div className={styles.configSection}>
								<div className={styles.configTitle} style={{ marginBottom: 4 }}>
									{t("knowledgeDatabase.searchSettings")}
								</div>
								<div className={styles.configDesc}>
									{t("knowledgeDatabase.searchSettingsDesc")}
								</div>

								{/* 搜索设置组件组 */}
								<SearchSettingsGroup />
							</div>
						</Form>
					</div>
				</div>

				<Flex className={styles.footer} justify="flex-end" align="center" gap={10}>
					<Button className={styles.backButton} onClick={onBack}>
						{t("knowledgeDatabase.previousStep")}
					</Button>
					<Button type="primary" onClick={handleSave}>
						{t("knowledgeDatabase.saveAndProcess")}
					</Button>
				</Flex>
			</Flex>

			{/* 右侧 - 分段预览 */}
			<Flex vertical className={styles.rightWrapper}>
				<SegmentPreview
					segmentPreviewLoading={segmentPreviewLoading}
					segmentDocument={segmentDocument}
					setSegmentDocument={setSegmentDocument}
					segmentDocumentOptions={segmentDocumentOptions}
					segmentPreviewResult={segmentPreviewResult}
				/>
			</Flex>
		</Flex>
	)
}
