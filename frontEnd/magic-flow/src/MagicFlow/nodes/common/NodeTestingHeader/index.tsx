import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { copyToClipboard } from "@/MagicFlow/utils"
import { message } from "antd"
import { IconX } from "@tabler/icons-react"
import { useMemoizedFn, useUpdateEffect } from "ahooks"
import clsx from "clsx"
import i18next from "i18next"
import React, { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useCurrentNode } from "../context/CurrentNode/useCurrentNode"
import ArrayResult from "./ArrayResult"
import OnceResult from "./OnceResult"
import styles from "./index.module.less"
import useTesting, { TestingResultRow } from "./useTesting"

export default function NodeTestingHeader() {
	const { t } = useTranslation()
	const {
		testingConfig,
		isCurrentNodeTest,
		inputList,
		outputList,
		isTesting,
		testingResult,
		isArrayTestResult,
		arrayTestResult,
		isEmptyTest,
		debugLogs,
	} = useTesting()

	const [showBody, setShowBody] = useState(true)

	const bodyRef = useRef<HTMLDivElement | null>(null)

	const { selectedNodeId } = useFlow()

	const { currentNode } = useCurrentNode()

	const onCopy = useMemoizedFn((target: TestingResultRow[]) => {
		copyToClipboard(JSON.stringify(target))

		message.success(i18next.t("common.copySuccess", { ns: "magicFlow" }))
	})

	useUpdateEffect(() => {
		setShowBody(true)
	}, [testingResult?.success])

	return (
		<>
			{isCurrentNodeTest ? (
				<div className={styles.nodeTestResult}>
					<div
						className={styles.nodeTestingHeader}
						// style={{ background: testingConfig?.background }}
					>
						<div className={styles.left}>
							<span
								className={clsx(styles.icon, {
									[styles.loadingIcon]: isTesting,
								})}
							>
								{testingConfig?.icon}
							</span>
							<span className={styles.label}>{testingConfig?.label}</span>
							<div className={styles.tags}>
								{testingConfig?.tags?.map((tag, index) => {
									return (
										<span
											className={styles.tag}
											style={{ background: tag.background, color: tag.color }}
											key={index}
										>
											{tag.content}
										</span>
									)
								})}
							</div>
						</div>
						<div className={styles.right}>
							{!isTesting && !isEmptyTest && (
								<span
									className={styles.open}
									onClick={() => setShowBody(!showBody)}
								>
									{showBody
										? i18next.t("flow.foldTestResult", { ns: "magicFlow" })
										: i18next.t("flow.expandTestResult", { ns: "magicFlow" })}
								</span>
							)}
						</div>
					</div>
					{showBody && !isEmptyTest && (
						<div
							className={clsx(styles.nodeTestingContent, {
								nowheel: currentNode?.node_id === selectedNodeId,
							})}
							ref={bodyRef}
						>
							<IconX
								stroke={2}
								width={20}
								className={styles.iconX}
								onClick={() => {
									setShowBody(false)
								}}
							/>
							{!isArrayTestResult && (
								<OnceResult
									inputList={inputList}
									outputList={outputList}
									testingResult={testingResult}
									debugLogs={debugLogs}
								/>
							)}
							{isArrayTestResult && (
								<ArrayResult arrayTestResult={arrayTestResult} onCopy={onCopy} />
							)}
						</div>
					)}
				</div>
			) : null}
		</>
	)
}
