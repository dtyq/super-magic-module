import { useState, useEffect, useMemo } from "react"
import { Form, message, Flex, FormInstance } from "antd"
import { useMemoizedFn } from "ahooks"
import { useTranslation } from "react-i18next"
import {
	SegmentationMode,
	ParentBlockMode,
	RetrievalMethod,
	TextPreprocessingRules,
	getFileTypeIcon,
} from "../../../constant"
import { KnowledgeApi } from "@/apis"
import { processConfigSeparators } from "../../../utils"
import { Knowledge } from "@/types/knowledge"
import type {
	FragmentConfig,
	EmbeddingModelConfig,
	RetrieveConfig,
	TemporaryKnowledgeConfig,
} from "../../../types"
import { useEmbeddingModels } from "./useEmbeddingModels"

/** 配置数据类型 */
export interface ConfigFormValues {
	fragment_config: Omit<FragmentConfig, "normal" | "parent_child"> & {
		normal: Omit<FragmentConfig["normal"], "text_preprocess_rule"> & {
			// 使用布尔值替代text_preprocess_rule数组
			replace_spaces: boolean
			remove_urls: boolean
		}
		parent_child: Omit<FragmentConfig["parent_child"], "text_preprocess_rule"> & {
			// 使用布尔值替代text_preprocess_rule数组
			replace_spaces: boolean
			remove_urls: boolean
		}
	}
	embedding_config: EmbeddingModelConfig
	retrieve_config: RetrieveConfig
}

/** 初始化表单数据 */
export const initialValues: ConfigFormValues = {
	fragment_config: {
		mode: SegmentationMode.General,
		normal: {
			replace_spaces: true,
			remove_urls: false,
			segment_rule: {
				separator: "\\n\\n",
				chunk_size: 500,
				chunk_overlap: 50,
			},
		},
		parent_child: {
			parent_mode: ParentBlockMode.Paragraph,
			separator: "\\n\\n",
			chunk_size: 500,
			parent_segment_rule: {
				separator: "\\n\\n",
				chunk_size: 500,
			},
			child_segment_rule: {
				separator: "\\n\\n",
				chunk_size: 500,
			},
			replace_spaces: true,
			remove_urls: false,
		},
	},
	embedding_config: {
		model_id: undefined,
	},
	retrieve_config: {
		search_method: RetrievalMethod.SemanticSearch,
		top_k: 3,
		score_threshold: 0.5,
		score_threshold_enabled: false,
		reranking_model: {
			model_id: undefined,
			reranking_model_name: "",
			reranking_provider_name: "",
		},
		reranking_enable: false,
	},
}

export interface ConfigurationLogicResult {
	form: FormInstance<ConfigFormValues>
	segmentMode: SegmentationMode
	parentBlockType: ParentBlockMode
	embeddingModelGroup: Knowledge.ServiceProvider[]
	embeddingModelOptions: {
		label: string
		title: string
		options: {
			label: React.ReactNode
			title: string
			value: string
		}[]
	}[]
	segmentDocument: string | undefined
	setSegmentDocument: (key: string) => void
	segmentDocumentOptions: { label: React.ReactNode; value: string }[]
	segmentPreviewResult: {
		total: number
		list: Knowledge.FragmentItem[]
	}
	segmentPreviewLoading: boolean
	handleSave: () => Promise<void>
	handleSegmentModeChange: (mode: SegmentationMode) => void
	handleParentBlockTypeChange: (type: ParentBlockMode) => void
	handleSegmentSettingReset: (mode: SegmentationMode) => void
	handleSegmentPreview: () => Promise<void>
	initialValues: ConfigFormValues
}

export function useConfigurationLogic(
	knowledgeBase: TemporaryKnowledgeConfig,
	onSubmit?: (data: TemporaryKnowledgeConfig) => Promise<void>,
): ConfigurationLogicResult {
	const { t } = useTranslation("flow")

	const [form] = Form.useForm<ConfigFormValues>()

	// 使用Form.useWatch钩子实时监听表单字段的变化
	const segmentMode = Form.useWatch(["fragment_config", "mode"], form)
	const parentBlockType = Form.useWatch(["fragment_config", "parent_child", "parent_mode"], form)

	// 使用新的Hook获取嵌入模型
	const { embeddingModelGroup, embeddingModelOptions } = useEmbeddingModels()

	// 分段预览相关状态
	const [segmentDocument, setSegmentDocument] = useState<string>()
	const [segmentPreviewResult, setSegmentPreviewResult] = useState<{
		total: number
		list: Knowledge.FragmentItem[]
	}>({
		total: 0,
		list: [],
	})
	const [segmentPreviewLoading, setSegmentPreviewLoading] = useState(false)

	// 保存配置
	const handleSave = useMemoizedFn(async () => {
		try {
			// 验证表单并获取值
			const formValues = await form.validateFields()

			// 提取布尔值并转换为API所需的数组格式
			const { normal, parent_child, ...restFragmentConfig } = formValues.fragment_config
			const {
				replace_spaces: normalReplaceSpaces,
				remove_urls: normalRemoveUrls,
				...restNormal
			} = normal
			const {
				replace_spaces: parentChildReplaceSpaces,
				remove_urls: parentChildRemoveUrls,
				...restParentChild
			} = parent_child

			// 处理所有分隔符中的转义字符
			const processedConfig = processConfigSeparators({
				normal: restNormal,
				parent_child: restParentChild,
			})

			// 构建最终提交的对象，不包含布尔值字段
			const values = {
				...formValues,
				fragment_config: {
					...restFragmentConfig,
					normal: {
						...processedConfig.normal,
						text_preprocess_rule: [
							...(normalReplaceSpaces ? [TextPreprocessingRules.ReplaceSpaces] : []),
							...(normalRemoveUrls ? [TextPreprocessingRules.RemoveUrls] : []),
						],
					},
					parent_child: {
						...processedConfig.parent_child,
						text_preprocess_rule: [
							...(parentChildReplaceSpaces
								? [TextPreprocessingRules.ReplaceSpaces]
								: []),
							...(parentChildRemoveUrls ? [TextPreprocessingRules.RemoveUrls] : []),
						],
					},
				},
			}

			const submitData = {
				...knowledgeBase,
				...values,
			}
			onSubmit?.(submitData)
		} catch (error) {
			console.error("保存配置失败:", error)
			message.error(t("knowledgeDatabase.saveConfigFailed"))
		}
	})

	// 分段模式切换处理 (切换模式时，重置其它分段模式的相关配置)
	const handleSegmentModeChange = useMemoizedFn((mode: SegmentationMode) => {
		handleSegmentSettingReset(
			mode === SegmentationMode.General
				? SegmentationMode.ParentChild
				: SegmentationMode.General,
		)
		form.setFieldValue(["fragment_config", "mode"], mode)
	})

	// 父块模式切换处理
	const handleParentBlockTypeChange = useMemoizedFn((type: ParentBlockMode) => {
		form.setFieldValue(["fragment_config", "parent_child", "parent_mode"], type)
	})

	// 分段设置重置
	const handleSegmentSettingReset = useMemoizedFn((mode: SegmentationMode) => {
		let newFragmentConfig = {}
		const fragmentConfig = form.getFieldValue(["fragment_config"])
		if (mode === SegmentationMode.General) {
			newFragmentConfig = {
				...fragmentConfig,
				normal: initialValues.fragment_config.normal,
			}
		} else {
			newFragmentConfig = {
				...fragmentConfig,
				parent_child: initialValues.fragment_config.parent_child,
			}
		}
		form.setFieldsValue({
			fragment_config: newFragmentConfig,
		})
	})

	// 点击分段预览按钮
	const handleSegmentPreview = useMemoizedFn(async () => {
		if (!segmentDocument) {
			setSegmentDocument(knowledgeBase.document_files[0].key)
		}
		getSegmentPreview({
			name: segmentDocument
				? knowledgeBase.document_files.find((item) => item.key === segmentDocument)?.name ??
				  ""
				: knowledgeBase.document_files[0].name,
			key: segmentDocument
				? knowledgeBase.document_files.find((item) => item.key === segmentDocument)?.key ??
				  ""
				: knowledgeBase.document_files[0].key,
		})
	})

	// 分段预览文档选项
	const segmentDocumentOptions = useMemo(() => {
		return knowledgeBase.document_files.map((item) => ({
			label: (
				<Flex align="center" gap={8}>
					{getFileTypeIcon(item.name.split(".").pop()!, 14)}
					<div>{item.name}</div>
				</Flex>
			),
			value: item.key,
		}))
	}, [knowledgeBase])

	// 获取分段预览
	const getSegmentPreview = useMemoizedFn(async (document: { name: string; key: string }) => {
		const { fragment_config } = await form.validateFields(["fragment_config"], {
			recursive: true,
		})
		setSegmentPreviewLoading(true)
		try {
			// 转换布尔值为数组
			const apiFragmentConfig = {
				...fragment_config,
				normal:
					fragment_config.mode === SegmentationMode.General
						? {
								...fragment_config.normal,
								text_preprocess_rule: [
									...(fragment_config.normal.replace_spaces
										? [TextPreprocessingRules.ReplaceSpaces]
										: []),
									...(fragment_config.normal.remove_urls
										? [TextPreprocessingRules.RemoveUrls]
										: []),
								],
								// 移除boolean属性
								replace_spaces: undefined,
								remove_urls: undefined,
						  }
						: undefined,
				parent_child:
					fragment_config.mode === SegmentationMode.ParentChild
						? {
								...fragment_config.parent_child,
								text_preprocess_rule: [
									...(fragment_config.parent_child.replace_spaces
										? [TextPreprocessingRules.ReplaceSpaces]
										: []),
									...(fragment_config.parent_child.remove_urls
										? [TextPreprocessingRules.RemoveUrls]
										: []),
								],
								// 移除boolean属性
								replace_spaces: undefined,
								remove_urls: undefined,
						  }
						: undefined,
			}

			const res = await KnowledgeApi.segmentPreview({
				fragment_config: apiFragmentConfig as FragmentConfig,
				document_file: document,
			})
			if (res) {
				setSegmentPreviewResult({
					total: res.total,
					list: res.list,
				})
			}
			setSegmentPreviewLoading(false)
		} catch (error) {
			message.error(t("knowledgeDatabase.segmentPreviewFailed"))
			setSegmentPreviewLoading(false)
		}
	})

	// 文档变更时预览
	useEffect(() => {
		if (segmentDocument) {
			getSegmentPreview({
				name:
					knowledgeBase.document_files.find((item) => item.key === segmentDocument)
						?.name ?? "",
				key: segmentDocument,
			})
		}
	}, [segmentDocument])

	return {
		form,
		segmentMode,
		parentBlockType,
		embeddingModelGroup,
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
	}
}
