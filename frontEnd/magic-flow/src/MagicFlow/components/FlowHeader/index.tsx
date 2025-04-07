import { prefix } from "@/MagicFlow/constants"
import { useExternal } from "@/MagicFlow/context/ExternalContext/useExternal"
import { Button } from "antd"
import { IconChevronLeft, IconCopyPlus } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import clsx from "clsx"
import _ from "lodash"
import React, { useMemo } from "react"
import { useFlow } from "../../context/FlowContext/useFlow"
import Tags from "./components/Tags"
import TextEditable from "./components/TextEditable"
import useFlowHeader from "./hooks/useFlowHeader"
import styles from "./index.module.less"

export default function FlowHeader() {
	const { tagList, isSaveBtnLoading, isPublishBtnLoading } = useFlowHeader()

	const { header, showExtraFlowInfo } = useExternal()

	const { flow, updateFlow } = useFlow()

	const navigateBack = useMemoizedFn(() => {
		window.history.back()
	})

	const showImage = useMemo(() => {
		if (_.isBoolean(header?.showImage)) {
			return header?.showImage
		}
		return true
	}, [header?.showImage])

	const handleImageError = useMemoizedFn((event) => {
		event.target.onerror = null // 防止死循环
		event.target.src = header?.defaultImage // 替换为默认图片
	})

	return (
		<div className={clsx(styles.flowHeader, `${prefix}flow-header`)}>
			<div className={clsx(styles.left, `${prefix}left`)}>
				{header?.backIcon}
				{!header?.backIcon && (
					<IconChevronLeft
						stroke={2}
						className={styles.backIcon}
						onClick={navigateBack}
					/>
				)}
				{showImage && flow?.icon && (
					<img
						src={flow?.icon}
						alt=""
						className={clsx(styles.flowIcon, `${prefix}flow-icon`)}
						onError={handleImageError}
					/>
				)}
				<div className={clsx(styles.flowBaseInfo, `${prefix}flow-base-info`)}>
					<TextEditable
						title={flow?.name || ""}
						onChange={(value: string) => updateFlow({ ...flow, name: value })}
					/>
					{showExtraFlowInfo && <Tags list={tagList} />}
					{header?.customTags}
				</div>
			</div>
			<div className={clsx(styles.right, `${prefix}right`)}>
				{header?.buttons}
				{!header?.buttons && (
					<>
						<Button
							type="default"
							className={clsx(styles.btn, `${prefix}btn`)}
							loading={isSaveBtnLoading}
						>
							试运行
						</Button>
						<Button
							type="primary"
							className={clsx(styles.btn, `${prefix}btn`)}
							loading={isPublishBtnLoading}
						>
							发布
						</Button>
						<Button
							type="default"
							className={clsx(styles.copyBtn, `${prefix}copy-btn`)}
							loading={isSaveBtnLoading}
						>
							<IconCopyPlus color="#77777b" />
						</Button>
					</>
				)}
			</div>
		</div>
	)
}
