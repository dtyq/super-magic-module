/**
 * Univer组件数据转换工具
 * 负责将不同格式的数据转换为Univer能够识别的格式
 */
import * as XLSX from "xlsx"

// 布尔数字枚举，用于Univer中的布尔值表示
enum BooleanNumber {
	FALSE = 0,
	TRUE = 1,
}

// 单元格数据接口
interface ICellData {
	v?: any // 单元格值
	f?: string // 公式
	s?: number // 样式
	[key: string]: any // 其他属性
}

// 单元格矩阵类型
interface ICellMatrix {
	[rowKey: string]: {
		[colKey: string]: ICellData
	}
}

/**
 * 检测字符串是否为二进制Excel文件内容
 * @param data 需要检测的字符串
 * @returns 是否为Excel二进制内容
 */
function isBinaryExcel(data: string): boolean {
	// Excel文件特征检测
	// 1. 文件头检测：XLSX/DOCX都是ZIP文件，以PK开头
	const hasPKHeader = data.startsWith("PK") || data.indexOf("PK") < 20

	// 2. 内部路径检测：检查是否包含Excel文件特有的路径
	const hasExcelPaths =
		data.includes("xl/worksheets") ||
		data.includes("docProps") ||
		data.includes("sheet.xml") ||
		data.includes("[Content_Types].xml")

	// 3. Office文档标记检测
	const hasOfficeMark =
		data.includes("Microsoft Excel") ||
		data.includes("spreadsheetml") ||
		data.includes("workbook")

	// 同时满足文件头特征和至少一种内容特征
	return hasPKHeader && (hasExcelPaths || hasOfficeMark)
}

/**
 * 根据文件类型转换数据为Univer可用格式，支持字符串内容或File对象
 * @param data 原始数据：字符串内容或File对象
 * @param fileType 文件类型 'doc' | 'sheet' | 'slide'
 * @param fileName 文件名
 * @returns 转换后的Univer数据
 */
export async function transformData(data: any, fileType: string, fileName: string): Promise<any> {
	// 如果是File对象，先读取文件内容
	if (data instanceof File) {
		const fileExtension = data.name.split(".").pop()?.toLowerCase()

		// 根据文件类型和扩展名选择适当的读取方式
		if (fileType === "sheet" && (fileExtension === "xlsx" || fileExtension === "xls")) {
			// 使用xlsx库读取Excel文件
			try {
				const excelData = await readExcelFile(data)
				return transformToWorkbookData(excelData, fileName)
			} catch (error) {
				console.error("读取Excel文件失败:", error)
				throw new Error("Excel文件读取失败")
			}
		} else if (fileType === "sheet" && fileExtension === "csv") {
			// 处理CSV文件
			const content = await readFileAsText(data)
			return transformCsvToWorkbook(content, fileName)
		} else {
			// 对于其他文件类型，读取为文本
			const content = await readFileAsText(data)

			// 根据文件类型调用相应的转换函数
			switch (fileType) {
				case "doc":
					return transformDataForDoc(content, fileName)
				case "sheet":
					return transformDataForSheet(content, fileName)
				case "slide":
					return transformDataForSlide(content, fileName)
				default:
					throw new Error(`不支持的文件类型: ${fileType}`)
			}
		}
	}

	// 如果不是File对象，按原逻辑处理
	switch (fileType) {
		case "doc":
			return transformDataForDoc(data, fileName)
		case "sheet":
			return transformDataForSheet(data, fileName)
		case "slide":
			return transformDataForSlide(data, fileName)
		default:
			throw new Error(`不支持的文件类型: ${fileType}`)
	}
}

/**
 * 使用xlsx库读取Excel文件
 * @param file Excel文件对象
 * @returns Excel数据的二维数组格式(默认返回第一个工作表数据)
 */
async function readExcelFile(file: File): Promise<any[][]> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()

		reader.onload = (e) => {
			try {
				const data = e.target?.result
				// 读取Excel文件
				const workbook = XLSX.read(data, { type: "array" })

				// 获取第一个工作表
				const firstSheetName = workbook.SheetNames[0]
				const worksheet = workbook.Sheets[firstSheetName]

				// 将工作表转换为二维数组
				const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
				resolve(jsonData)
			} catch (error) {
				reject(error)
			}
		}

		reader.onerror = (error) => reject(error)
		reader.readAsArrayBuffer(file)
	})
}

/**
 * 读取Excel文件中的所有工作表
 * @param file Excel文件对象
 * @returns 包含所有工作表数据的对象，键为工作表名，值为工作表数据
 */
export async function readAllExcelSheets(file: File): Promise<Record<string, any[][]>> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()

		reader.onload = (e) => {
			try {
				const data = e.target?.result
				// 读取Excel文件
				const workbook = XLSX.read(data, { type: "array" })

				// 读取所有工作表
				const result: Record<string, any[][]> = {}

				workbook.SheetNames.forEach((sheetName) => {
					const worksheet = workbook.Sheets[sheetName]
					// 将工作表转换为二维数组
					result[sheetName] = XLSX.utils.sheet_to_json(worksheet, {
						header: 1,
					}) as any[][]
				})

				resolve(result)
			} catch (error) {
				reject(error)
			}
		}

		reader.onerror = (error) => reject(error)
		reader.readAsArrayBuffer(file)
	})
}

/**
 * 将CSV文本内容转换为工作簿数据
 * @param csvContent CSV文本内容
 * @param fileName 文件名
 * @returns 工作簿数据
 */
function transformCsvToWorkbook(csvContent: string, fileName: string): any {
	// 简单的CSV解析：按行分割，然后按逗号分割
	const rows = csvContent.split("\n").map((row) => row.split(",").map((cell) => cell.trim()))
	// 使用现有的转换函数处理二维数组
	return transformToWorkbookData(rows, fileName)
}

/**
 * 读取文件为文本
 * @param file 文件对象
 * @returns 文件内容字符串
 */
function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = reject
		reader.readAsText(file)
	})
}

/**
 * 将原始数据转换为文档格式
 * @param data 原始文档数据
 * @param fileName 文件名
 * @returns 转换后的文档数据
 */
export function transformDataForDoc(data: any, fileName: string): any {
	// 如果数据已经是正确格式则直接返回
	if (data && typeof data === "object" && data.id) {
		return data
	}

	// 简单文档结构，实际项目中可能需要更复杂的转换逻辑
	return {
		id: `doc-${Date.now()}`,
		name: fileName,
		type: "doc",
		body: {
			dataStream: data?.content || data || "",
			// 更多文档相关配置...
		},
		config: {
			view: {
				pageSize: {
					width: 794, // A4宽度
					height: 1123, // A4高度
				},
			},
		},
	}
}

/**
 * 将原始数据转换为表格格式
 * @param data 原始表格数据
 * @param fileName 文件名
 * @returns 转换后的表格数据
 */
export function transformDataForSheet(data: any, fileName: string): any {
	// 如果数据已经是正确格式则直接返回
	if (data && typeof data === "object" && data.id && data.sheets) {
		return data
	}

	// 使用transformToWorkbookData生成标准的工作簿数据
	return transformToWorkbookData(data, fileName)
}

/**
 * 将原始数据转换为幻灯片格式
 * @param data 原始幻灯片数据
 * @param fileName 文件名
 * @returns 转换后的幻灯片数据
 */
export function transformDataForSlide(data: any, fileName: string): any {
	// 如果数据已经是正确格式则直接返回
	if (data && typeof data === "object" && data.id) {
		return data
	}

	// 简单幻灯片结构，实际项目中可能需要更复杂的转换逻辑
	return {
		id: `slide-${Date.now()}`,
		name: fileName,
		type: "slide",
		slides: data?.slides || [
			{
				id: "slide1",
				title: "标题幻灯片",
				elements: [],
			},
		],
		// 更多幻灯片相关配置...
	}
}

/**
 * 将通用数据转换为Univer表格工作簿格式，符合IWorkbookData接口
 * @param data 原始数据
 * @param fileName 文件名
 * @returns 符合Univer标准的工作簿数据
 */
export function transformToWorkbookData(data: any, fileName?: string): any {
	// 如果数据已经是标准Univer工作簿格式，直接返回
	if (data && data.id && data.sheets && data.sheetOrder) {
		return data
	}

	const workbookId = `workbook_${Date.now()}`
	const sheetId = `sheet_${Date.now()}`

	// 如果是字符串，尝试解析JSON
	if (typeof data === "string") {
		try {
			const parsedData = JSON.parse(data)
			if (parsedData && typeof parsedData === "object") {
				return transformToWorkbookData(parsedData, fileName)
			}
		} catch (e) {
			// 如果不是有效的JSON，将其作为简单文本内容处理
			data = [[data]]
		}
	}

	// 处理单元格数据
	const cellData: ICellMatrix = {}
	let rowCount = 30
	let columnCount = 10

	// 处理数组格式 (二维数组转为单元格数据)
	if (Array.isArray(data)) {
		rowCount = Math.max(rowCount, data.length)

		data.forEach((row, rowIndex) => {
			if (Array.isArray(row)) {
				// 更新最大列数
				columnCount = Math.max(columnCount, row.length)

				// 处理每个单元格
				row.forEach((cellValue, colIndex) => {
					const rowKey = rowIndex.toString()
					const colKey = colIndex.toString()

					if (!cellData[rowKey]) {
						cellData[rowKey] = {}
					}

					cellData[rowKey][colKey] = {
						v: cellValue, // 单元格值
					}
				})
			}
		})
	} else if (data && typeof data === "object" && data.cellData) {
		// 如果已经有cellData结构
		Object.assign(cellData, data.cellData)
		rowCount = data.rowCount || rowCount
		columnCount = data.columnCount || columnCount
	}

	// 构建符合IWorksheetData的工作表数据
	const worksheetData = {
		id: sheetId,
		name: "工作表1",
		tabColor: "",
		hidden: BooleanNumber.FALSE,
		rowCount: rowCount,
		columnCount: columnCount,
		defaultColumnWidth: 73,
		defaultRowHeight: 23,
		freeze: {
			startRow: -1,
			startColumn: -1,
			ySplit: 0,
			xSplit: 0,
		},
		mergeData: [],
		cellData: cellData,
		rowData: {},
		columnData: {},
		showGridlines: BooleanNumber.TRUE,
		rowHeader: {
			width: 46,
			hidden: BooleanNumber.FALSE,
		},
		columnHeader: {
			height: 20,
			hidden: BooleanNumber.FALSE,
		},
		rightToLeft: BooleanNumber.FALSE,
	}

	// 构建符合IWorkbookData的工作簿数据
	return {
		id: workbookId,
		name: fileName || "工作簿",
		appVersion: "0.5.0",
		locale: "zh-CN",
		styles: {},
		sheetOrder: [sheetId],
		sheets: {
			[sheetId]: worksheetData,
		},
		resources: [
			{
				name: "SHEET_DEFINED_NAME_PLUGIN",
				data: "",
			},
		],
	}
}

/**
 * 将通用数据转换为Univer文档格式
 */
export function transformToDocumentData(data: any, fileName?: string): any {
	// 如果数据已经是Univer格式，直接返回
	if (data && data.id && data.body) {
		return data
	}

	// 如果是字符串，将其作为文本内容
	if (typeof data === "string") {
		try {
			// 尝试解析为JSON
			const parsedData = JSON.parse(data)
			if (parsedData && typeof parsedData === "object") {
				return transformToDocumentData(parsedData)
			}
		} catch (e) {
			// 如果不是有效的JSON，将其作为文本内容
			return {
				id: `doc_${Date.now()}`,
				name: fileName || "Document",
				body: {
					dataStream: data,
					textRuns: [],
					paragraphs: [
						{
							startIndex: 0,
							endIndex: data.length,
						},
					],
				},
			}
		}
	}

	// 默认返回空文档
	return {
		id: `doc_${Date.now()}`,
		name: fileName || "Document",
		body: {
			dataStream: "",
			textRuns: [],
			paragraphs: [],
		},
	}
}

/**
 * 将通用数据转换为Univer幻灯片格式
 */
export function transformToSlidesData(data: any, fileName?: string): any {
	// 如果数据已经是Univer格式，直接返回
	if (data && data.id && data.slides) {
		return data
	}

	// 默认返回空的幻灯片
	return {
		id: `slides_${Date.now()}`,
		name: fileName || "Presentation",
		slides: {
			slide1: {
				id: "slide1",
				title: "标题",
				pageElements: [],
			},
		},
		activeSlide: "slide1",
	}
}
