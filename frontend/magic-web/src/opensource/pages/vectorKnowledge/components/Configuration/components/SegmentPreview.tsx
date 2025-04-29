import { useTranslation } from "react-i18next"
import { Flex, Select, Spin } from "antd"
import { IconLayoutList } from "@tabler/icons-react"
import { useVectorKnowledgeConfigurationStyles } from "../styles"
import { LoadingOutlined } from "@ant-design/icons"
import type { Knowledge } from "@/types/knowledge"

interface SegmentPreviewProps {
	segmentPreviewLoading: boolean
	segmentDocument?: string
	setSegmentDocument: (value: string) => void
	segmentDocumentOptions: { label: React.ReactNode; value: string }[]
	segmentPreviewResult: {
		total: number
		list: Knowledge.FragmentItem[]
	}
}

/**
 * 分段预览组件
 */
export default function SegmentPreview({
	segmentPreviewLoading,
	segmentDocument,
	setSegmentDocument,
	segmentDocumentOptions,
	segmentPreviewResult,
}: SegmentPreviewProps) {
	const { styles } = useVectorKnowledgeConfigurationStyles()
	const { t } = useTranslation("flow")

	return (
		<>
			<Flex className={styles.previewHeader} align="center" justify="space-between">
				<Flex align="center" gap={4}>
					<IconLayoutList size={16} color="currentColor" />
					<div>{t("knowledgeDatabase.segmentPreview")}</div>
				</Flex>
				<Flex align="center" gap={8}>
					<Select
						className={styles.documentSelect}
						size="small"
						disabled={segmentPreviewLoading}
						value={segmentDocument}
						onChange={setSegmentDocument}
						placeholder={t("knowledgeDatabase.selectDocument")}
						options={segmentDocumentOptions}
						popupMatchSelectWidth={false}
						dropdownStyle={{ minWidth: "max-content" }}
					/>
					<Flex gap={4} className={styles.estimatedSegments}>
						<div>{segmentPreviewResult.total}</div>
						<div>{t("knowledgeDatabase.estimatedSegments")}</div>
					</Flex>
				</Flex>
			</Flex>

			{segmentPreviewLoading ? (
				<Flex vertical justify="center" align="center" className={styles.previewLoading}>
					<Spin indicator={<LoadingOutlined spin />} size="large" />
					<div className={styles.previewLoadingText}>
						{t("knowledgeDatabase.segmentPreviewLoading")}
					</div>
				</Flex>
			) : (
				<div className={styles.previewContent}>
					{segmentPreviewResult.list.map((item, index) => (
						<div className={styles.segmentItem} key={item.id}>
							<Flex align="center" gap={6} className={styles.segmentItemTitle}>
								<IconLayoutList size={16} color="currentColor" />
								<div>{t("knowledgeDatabase.segment")}</div>
								<div>{index + 1}</div>
								<div>/</div>
								<div>
									{t("knowledgeDatabase.segmentWordCount", {
										num: item.word_count || "*",
									})}
								</div>
							</Flex>
							<div className={styles.segmentItemContent}>{item.content}</div>
						</div>
					))}
				</div>
			)}
		</>
	)
}
