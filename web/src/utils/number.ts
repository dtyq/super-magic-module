/**
 * 将数值格式化为带千分位分隔符的字符串
 * @param number 数值
 * @returns 格式化后的数值
 */
export function splitNumber(
	number: number,
	delimiterPosition: number = 3,
	char: string = ",",
): string {
	// 将数值转换为字符串
	const numStr: string = number.toString()
	// 将小数点前的部分与小数点后的部分分离
	const parts: string[] = numStr.split(".")

	// 将整数部分添加千分位分隔符
	parts[0] = parts[0].replace(new RegExp(`\\B(?=(\\d{${delimiterPosition}})+(?!\\d))`, "g"), char)

	// 返回格式化后的数值
	return parts.join(".")
}

/**
 * 将大于1000的数值格式化为K结尾的形式
 * @param number 要格式化的数值
 * @returns 格式化后的字符串，无效数值返回空字符串
 */
export function formatToK(number: number): string {
	// 检查参数是否为有效数值
	if (Number.isNaN(number) || !Number.isFinite(number)) {
		return ""
	}

	// 不超过1000的直接返回字符串形式
	if (number < 1000) {
		return number.toString()
	}

	// 计算以K为单位的值（向下取整）
	const kValue = Math.floor(number / 1000)

	// 返回格式化后的值，以K结尾
	return `${kValue}K`
}
