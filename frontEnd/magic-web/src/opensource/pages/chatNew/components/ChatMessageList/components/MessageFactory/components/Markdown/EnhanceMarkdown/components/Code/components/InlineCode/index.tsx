import { useMessageRenderContext } from "@/opensource/components/business/MessageRenderProvider/hooks"
import { Flex } from "antd"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useStyles } from "./styles"
import { CodeRenderProps } from "../../types"

const enum InlineCodeType {
	Mention = "mention",
}

export type OSSFileData = {
	type: InlineCodeType
	user_info?: {
		id?: string
		name?: string
		department?: string
		avatar?: string
	}
}

interface MagicInlineCodeProps extends CodeRenderProps {
	data?: string
}

function MagicInlineCode(props: MagicInlineCodeProps) {
	const { styles } = useStyles()
	const { t } = useTranslation("interface")
	const { hiddenDetail } = useMessageRenderContext()
	const { data: propsValue } = props

	const { value, type, hasError } = useMemo(() => {
		// 如果值为空，直接返回空值
		if (typeof propsValue !== "string" || propsValue.trim() === "") {
			return {
				value: "",
				hasError: false,
			}
		}

		try {
			// 使用更严格的正则表达式匹配
			const ossFilePrefix = "oss-file"
			const isValid = new RegExp(`^${ossFilePrefix}(\\{.+\\})$`).test(propsValue)

			if (isValid) {
				// 先提取JSON部分，避免直接替换可能导致的问题
				const jsonStr = propsValue.substring(ossFilePrefix.length)

				// 验证JSON格式是否有效
				if (!jsonStr || !/^\{.*\}$/.test(jsonStr.trim())) {
					return {
						value: propsValue,
						hasError: true,
					}
				}

				const data = JSON.parse(jsonStr) as OSSFileData

				// 验证解析后的数据是否符合预期类型
				if (!data || typeof data !== "object" || !data.type) {
					return {
						value: propsValue,
						hasError: true,
					}
				}

				return {
					type: data.type,
					value: data,
					hasError: false,
				}
			}

			return {
				value: propsValue,
				hasError: false,
			}
		} catch (err) {
			// 只在开发环境记录错误
			if (process.env.NODE_ENV !== "production") {
				console.error("MagicInlineCode parsing error:", err)
			}

			return {
				value: propsValue,
				hasError: true,
			}
		}
	}, [propsValue]) // 改进依赖项，避免使用可选链

	const Children = useMemo(() => {
		// 处理错误情况
		if (hasError) {
			return <span className={styles.error}>{propsValue || ""}</span>
		}

		switch (type) {
			case InlineCodeType.Mention:
				if (hiddenDetail) return null

				if (!value?.user_info || (!value?.user_info?.name && !value?.user_info?.avatar))
					return t("common.unknown")

				return (
					<Flex align="center" justify="center" gap={4} className={styles.mention}>
						<span>@</span>
						{value.user_info?.avatar && (
							<img
								alt={value.user_info?.name || t("common.unknown")}
								src={value.user_info?.avatar}
								className={styles.avatar}
								width={20}
								height={20}
								onError={(e) => {
									// 图片加载失败时处理
									e.currentTarget.style.display = "none"
								}}
							/>
						)}
						{value.user_info?.name || t("common.unknown")}
					</Flex>
				)
			default:
				return JSON.stringify(value)
		}
	}, [
		hiddenDetail,
		styles.avatar,
		styles.mention,
		styles.error,
		t,
		type,
		value,
		hasError,
		propsValue,
	])

	// 处理边界情况
	if (value === null || value === undefined || value === "") {
		return null
	}

	if (hiddenDetail) return Children

	return <code className={styles.code}>{Children}</code>
}

export default MagicInlineCode
