/**
 * 仅流程节点可使用
 */
import { useFlowInteraction } from "@/MagicFlow/components/FlowDesign/context/FlowInteraction/useFlowInteraction"
import { useFlow } from "@/MagicFlow/context/FlowContext/useFlow"
import { Select } from "antd"
import { IconChevronDown, IconX } from "@tabler/icons-react"
import { useMemoizedFn, useUpdateEffect } from "ahooks"
import React, { ReactElement, forwardRef, useEffect, useMemo, useRef, useState } from "react"
import BaseDropdownRenderer from "../DropdownRenderer/Base"
import styles from "./index.module.less"
import { GlobalStyle } from "./style"

type TsSelectProps = {
	className?: string
	suffixIcon?: React.ReactElement
	popupClassName?: string
	dropdownRenderProps?: {
		// 搜索框占位符
		placeholder?: string
		// 实际渲染组件
		component?: () => ReactElement
		// 是否显示搜索框
		showSearch?: boolean
		// Option的包裹层组件
		OptionWrapper: React.FC<any>
		[key: string]: any
	}
	[key: string]: any
}

const MagicSelect: any = forwardRef((props: TsSelectProps, ref: any) => {
	const { dropdownRenderProps, ...restSelectProps } = props

	const {
		placeholder: dropdownPlaceholder,
		showSearch,
		component: DropdownRenderComp = BaseDropdownRenderer,
		OptionWrapper,
		...restDropdownProps
	} = (dropdownRenderProps || {})!

	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null) // 引用容器

	const { nodeClick } = useFlowInteraction()

	const { selectedNodeId, selectedEdgeId } = useFlow()

	const filterOptions = useMemo(() => {
		// @ts-ignore
		return restSelectProps?.options?.filter((option) => {
			if (!Reflect.has(option, "visible")) return true
			return Reflect.get(option, "visible")
		})
	}, [restSelectProps.options])

	const showSuffixIcon = useMemo(() => {
		if (!Reflect.has(restSelectProps, "allowClear")) return true
		const allowClear = Reflect.get(restSelectProps, "allowClear")
		return allowClear && !restSelectProps.value
	}, [restSelectProps])

	// 拦截onChange做一些额外事件
	const onChangeHooks = useMemoizedFn((event) => {
		restSelectProps.onChange?.(event)
		setOpen(false)
	})

	useUpdateEffect(() => {
		setOpen(false)
	}, [selectedNodeId, selectedEdgeId, nodeClick])

	useEffect(() => {
		// 点击页面时隐藏 Select
		const handleClickOutside = (e: any) => {
			// 检查点击是否发生在 Select 外部
			const isClickInSelect = containerRef.current && !containerRef.current.contains(e.target)
			if (isClickInSelect) {
				setOpen(false)
			}
		}

		// 添加事件监听器
		document.addEventListener("mousedown", handleClickOutside)

		// 组件卸载时移除事件监听器
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [open])

	return (
		<>
			<GlobalStyle />
			<div ref={containerRef}>
				<Select
					ref={ref}
					{...restSelectProps}
					className={`${restSelectProps.className} nodrag ${styles.selectWrapper}`}
					suffixIcon={
						showSuffixIcon ? restSelectProps.suffixIcon || <IconChevronDown /> : null
					}
					popupClassName={`nowheel ${restSelectProps.popupClassName || ""}`}
					getPopupContainer={(triggerNode) => triggerNode.parentNode}
					open={open}
					onClick={(e) => {
						if (!open) {
							e.stopPropagation()
							setOpen(true)
							restSelectProps?.onClick?.(e)
						}
					}}
					onChange={onChangeHooks}
					dropdownRender={
						dropdownRenderProps
							? () => (
									<DropdownRenderComp
										options={filterOptions}
										placeholder={dropdownPlaceholder}
										value={restSelectProps.value}
										onChange={onChangeHooks}
										showSearch={showSearch}
										multiple={restSelectProps.mode === "multiple"}
										OptionWrapper={OptionWrapper}
										{...restDropdownProps}
									/>
							  )
							: // 加一层包裹避免onClick事件上浮
							  (menu) => <div onClick={(e) => e.stopPropagation()}>{menu}</div>
					}
					clearIcon={<IconX size={16} className={styles.clearIcon} />}
				/>
			</div>
		</>
	)
})

MagicSelect.Option = Select.Option
MagicSelect.OptGroup = Select.OptGroup

export default MagicSelect
