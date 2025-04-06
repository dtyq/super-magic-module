/**
 * LLM参数配置器
 */
import { Form, Switch, Tooltip, Select } from "antd"
import { IconHelp } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import MagicInput from "@dtyq/magic-flow/common/BaseUI/Input"
import MagicSlider from "@dtyq/magic-flow/common/BaseUI/Slider"
import { useFlowStore } from "@/opensource/stores/flow"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"
import LLMSelect from "../LLMSelect"
import useLLMParameters from "./hooks/useLLMParameters"
import styles from "./index.module.less"

export type LLMParametersValue = {
	temperature: string | number
	model: string
	auto_memory: boolean
	max_record: number
}

export default function LLMParametersV1() {
	const { t } = useTranslation()
	const { autoMemory, temperature, maxRecord } = useLLMParameters()

	const { models: options } = useFlowStore()

	// 筛选出支持视觉功能的模型
	const visionModels = useMemo(() => {
		return options.filter((model) => model.vision === true)
	}, [options])

	const LLMPanel = useMemoizedFn(() => {
		return (
			<div className={styles.panel} onClick={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<span className={styles.h1Title}>{t("common.model", { ns: "flow" })}</span>
					<Form.Item name={["model"]}>
						<LLMSelect options={options} className={styles.LLMSelect} />
					</Form.Item>
				</div>
				<div className={styles.body}>
					<div className={styles.parameters}>
						<div className={styles.left}>
							<span className={styles.title}>{temperature.label}</span>
							<Tooltip title={temperature.tooltips}>
								<IconHelp size={16} color="#1C1D2399" className={styles.icon} />
							</Tooltip>
						</div>
						<div className={styles.right}>
							<Form.Item
								name={["model_config", "temperature"]}
								className={styles.right}
							>
								<MagicSlider
									min={temperature.extra.min}
									max={temperature.extra.max}
									step={temperature.extra.step}
									className={styles.slider}
								/>
							</Form.Item>
							<Form.Item
								name={["model_config", "temperature"]}
								className={styles.right}
							>
								<MagicInput
									className={styles.input}
									type="number"
									min={temperature.extra.min}
									max={temperature.extra.max}
									step={temperature.extra.step}
								/>
							</Form.Item>
						</div>
					</div>
					<div className={styles.parameters}>
						<div className={styles.left}>
							<span className={styles.title}>{autoMemory.label}</span>
							<Tooltip title={autoMemory.tooltips}>
								<IconHelp size={16} color="#1C1D2399" className={styles.icon} />
							</Tooltip>
						</div>
						<Form.Item name={["model_config", "auto_memory"]} valuePropName="checked">
							<Switch className={styles.slider} />
						</Form.Item>
					</div>
					<div className={styles.parameters}>
						<div className={styles.left}>
							<span className={styles.title}>{maxRecord.label}</span>
							<Tooltip title={maxRecord.tooltips}>
								<IconHelp size={16} color="#1C1D2399" className={styles.icon} />
							</Tooltip>
						</div>
						<Form.Item className={styles.right} name={["model_config", "max_record"]}>
							<MagicInput className={styles.input} type="number" />
						</Form.Item>
					</div>
					<div className={styles.formItemRow}>
						<span className={styles.formItemLabel}>
							{t("llm.visibleUnderstanding", { ns: "flow" })}
							<Tooltip title={t("llm.visibleUnderstandingTip", { ns: "flow" })}>
								<IconHelp size={16} color="#1C1D2399" className={styles.icon} />
							</Tooltip>
						</span>
						<div className={styles.formItemContent}>
							<Form.Item
								noStyle
								shouldUpdate={(prevValues, currentValues) => {
									return (
										prevValues.model_config?.vision !==
											currentValues.model_config?.vision ||
										prevValues.model_config?.model !==
											currentValues.model_config?.model
									)
								}}
							>
								{({ getFieldValue }) => {
									const vision = getFieldValue(["model_config", "vision"])
									const currentModel = getFieldValue(["model_config", "model"])
									const currentModelSupportsVision = options.find(
										(option) =>
											option.value === currentModel && option.vision === true,
									)

									return vision && !currentModelSupportsVision ? (
										<Form.Item name={["model_config", "vision_model"]} noStyle>
											<Select
												placeholder={t("llm.selectVisibleModel", {
													ns: "flow",
												})}
												options={visionModels}
												className={styles.visibleModelSelect}
											/>
										</Form.Item>
									) : null
								}}
							</Form.Item>

							<Form.Item
								name={["model_config", "vision"]}
								valuePropName="checked"
								noStyle
							>
								<Switch />
							</Form.Item>
						</div>
					</div>
				</div>
			</div>
		)
	})

	return (
		<Form.Item name={["model"]} className={styles.formItem} label="模型">
			<LLMSelect
				className={styles.LLMParameters}
				options={options}
				dropdownRenderProps={{
					component: LLMPanel,
				}}
				showLLMSuffixIcon
			/>
		</Form.Item>
	)
}
