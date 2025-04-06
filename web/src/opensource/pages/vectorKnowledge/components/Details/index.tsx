import { useEffect, useMemo, useState } from "react"
import { Table, Input, Button, Flex, Tag, message, Dropdown, Upload, Modal } from "antd"
import { IconPlus, IconChevronLeft, IconChevronDown, IconDots } from "@tabler/icons-react"
import { useMemoizedFn } from "ahooks"
import { replaceRouteParams } from "@/utils/route"
import { RoutePath } from "@/const/routes"
import { FlowRouteType } from "@/types/flow"
import MagicIcon from "@/opensource/components/base/MagicIcon"
import { useNavigate, useLocation } from "react-router-dom"
import { genFileData } from "@/opensource/pages/chatNew/components/MessageEditor/MagicInput/components/InputFiles/utils"
import { useUpload } from "@/opensource/hooks/useUploadFiles"
import { useTranslation } from "react-i18next"
import { fileTypeIconsMap, supportedFileTypes, documentSyncStatusMap } from "../../constant"
import SubSider from "../SubSider"
import { useVectorKnowledgeDetailStyles } from "./styles"
import Setting from "../Setting"
import type { Knowledge } from "@/types/knowledge"
import { KnowledgeApi } from "@/apis"

export default function VectorKnowledgeDetail() {
	const { styles } = useVectorKnowledgeDetailStyles()

	const { code: knowledgeBaseCode } = useLocation().state

	const navigate = useNavigate()

	const { t } = useTranslation("flow")

	const [knowledgeDetail, setKnowledgeDetail] = useState<Knowledge.Detail>()

	const [tableData, setTableData] = useState<Knowledge.EmbedDocumentDetail[]>([])

	const [searchText, setSearchText] = useState("")

	const [currentDetailPage, setCurrentDetailPage] = useState<"document" | "setting">("document")

	const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

	const [pageInfo, setPageInfo] = useState<{
		page: number
		pageSize: number
		total: number
	}>({
		page: 1,
		pageSize: 10,
		total: 0,
	})

	// 搜索处理
	const handleSearch = useMemoizedFn((value: string) => {
		setSearchText(value)
	})

	// 删除文档
	const handleDeleteFile = useMemoizedFn(async (code: string, name?: string) => {
		await KnowledgeApi.deleteKnowledgeDocument({
			knowledge_code: knowledgeBaseCode,
			document_code: code,
		})
		if (name) {
			message.success(`删除文档成功：${name}`)
		}
	})

	// 删除单个文档
	const handleDeleteSingleFile = useMemoizedFn(async (record: Knowledge.EmbedDocumentDetail) => {
		Modal.confirm({
			title: "删除文档",
			content: `确定删除文档：${record.name}？`,
			onOk: async () => {
				await handleDeleteFile(record.code)
				getKnowledgeDocumentList(
					knowledgeBaseCode,
					searchText,
					pageInfo.page,
					pageInfo.pageSize,
				)
			},
		})
	})

	// 批量删除文档
	const handleBatchDelete = useMemoizedFn(() => {
		if (selectedRowKeys.length) {
			Modal.confirm({
				title: "批量删除文档",
				content: `确定删除文档：${selectedRowKeys.length}个？`,
				onOk: async () => {
					await Promise.all(selectedRowKeys.map((code) => handleDeleteFile(code)))
					message.success(`删除成功`)
					getKnowledgeDocumentList(
						knowledgeBaseCode,
						searchText,
						pageInfo.page,
						pageInfo.pageSize,
					)
				},
			})
		} else {
			message.warning("请选择要删除的文档")
		}
	})

	// 获取文档状态标签
	const getStatusTag = (syncStatus: number) => {
		switch (syncStatus) {
			case documentSyncStatusMap.Pending:
				return (
					<Tag className={styles.statusTag} bordered={false} color="default">
						待嵌入
					</Tag>
				)
			case documentSyncStatusMap.Processing:
				return (
					<Tag className={styles.statusTag} bordered={false} color="processing">
						嵌入中
					</Tag>
				)
			case documentSyncStatusMap.Success:
				return (
					<Tag className={styles.statusTag} bordered={false} color="success">
						可用
					</Tag>
				)
			case documentSyncStatusMap.Failed:
				return (
					<Tag className={styles.statusTag} bordered={false} color="error">
						嵌入失败
					</Tag>
				)
		}
	}

	// 表格列定义
	const columns = [
		{
			title: "文档",
			dataIndex: "name",
			key: "name",
			render: (name: string) => (
				<Flex align="center">
					<span className={styles.fileTypeIcon}>
						{fileTypeIconsMap[name.split(".").pop() || ""]}
					</span>
					{name}
				</Flex>
			),
		},
		{
			title: "字符数",
			dataIndex: "word_count",
			key: "word_count",
			width: 160,
		},
		{
			title: "创建时间",
			dataIndex: "created_at",
			key: "created_at",
			width: 200,
		},
		{
			title: "状态",
			dataIndex: "sync_status",
			key: "sync_status",
			width: 120,
			render: getStatusTag,
		},
		{
			title: "操作",
			key: "operation",
			width: 100,
			render: (_: any, record: Knowledge.EmbedDocumentDetail) => (
				<Dropdown
					menu={{
						items: [
							{
								label: <div className={styles.deleteText}>删除</div>,
								key: "delete",
								onClick: () => handleDeleteSingleFile(record),
							},
						],
					}}
				>
					<Flex align="center" justify="center" className={styles.operationButton}>
						<IconDots size={20} />
					</Flex>
				</Dropdown>
			),
		},
	]

	// 根据搜索文本过滤数据
	const filteredData = useMemo(() => {
		return searchText
			? tableData.filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase()))
			: tableData
	}, [searchText, tableData])

	/**
	 * 分页改变
	 */
	const handlePageChange = useMemoizedFn((page: number, pageSize: number) => {
		setPageInfo((prev) => ({
			...prev,
			page,
			pageSize,
		}))
	})

	/**
	 * 上一步 - 返回上一页
	 */
	const handleBack = useMemoizedFn(() => {
		navigate(
			replaceRouteParams(RoutePath.Flows, {
				type: FlowRouteType.Knowledge,
			}),
		)
	})

	/**
	 * 更新知识库详情
	 */
	const updateKnowledgeDetail = useMemoizedFn(async (code: string) => {
		const res = await KnowledgeApi.getKnowledgeDetail(code)
		if (res) {
			setKnowledgeDetail(res)
		}
	})

	/**
	 * 获取知识库文档列表
	 */
	const getKnowledgeDocumentList = useMemoizedFn(
		async (code: string, name: string, page: number, pageSize: number) => {
			const res = await KnowledgeApi.getKnowledgeDocumentList({
				code,
				name: name || undefined,
				page,
				pageSize,
			})
			if (res) {
				setTableData(res.list)
				setPageInfo((prev) => ({
					...prev,
					page: res.page,
					total: res.total,
				}))
			}
		},
	)

	const { uploading: fileUploading, uploadAndGetFileUrl } = useUpload({
		storageType: "private",
	})

	/** 上传文件 */
	const handleFileUpload = useMemoizedFn(async (file: File) => {
		// 上传文件
		const newFile = genFileData(file)
		// 已通过 beforeFileUpload 预校验，故传入 () => true 跳过方法校验
		const { fullfilled } = await uploadAndGetFileUrl([newFile], () => true)
		// 更新上传的文件列表状态
		if (fullfilled && fullfilled.length) {
			const { path } = fullfilled[0].value
			const res = await KnowledgeApi.addKnowledgeDocument({
				knowledge_code: knowledgeBaseCode,
				enabled: true,
				document_file: {
					name: file.name,
					key: path,
				},
			})
			if (res) {
				message.success("上传成功")
				getKnowledgeDocumentList(
					knowledgeBaseCode,
					searchText,
					pageInfo.page,
					pageInfo.pageSize,
				)
			}
		}
	})

	/** 上传文件 - 预校验 */
	const beforeFileUpload = useMemoizedFn((file: File) => {
		const fileExtension = file.name.split(".").pop()?.toLowerCase() || ""

		if (!supportedFileTypes.includes(fileExtension)) {
			message.error(t("knowledgeDatabase.unsupportedFileType", { type: fileExtension }))
			return false
		}

		// 验证文件大小
		const isLt15M = file.size / 1024 / 1024 < 15
		if (!isLt15M) {
			message.error(t("knowledgeDatabase.fileSizeLimit", { size: "15MB" }))
			return false
		}

		handleFileUpload(file)
		// 直接return flase，不进行组件上传，使用自定义上传
		return false
	})

	useEffect(() => {
		if (knowledgeBaseCode) {
			updateKnowledgeDetail(knowledgeBaseCode)
		}
	}, [knowledgeBaseCode])

	useEffect(() => {
		if (knowledgeBaseCode) {
			getKnowledgeDocumentList(
				knowledgeBaseCode,
				searchText,
				pageInfo.page,
				pageInfo.pageSize,
			)
		}
	}, [knowledgeBaseCode, searchText, pageInfo.page, pageInfo.pageSize])

	const PageContent = useMemo(() => {
		if (currentDetailPage === "document") {
			return (
				<Flex vertical className={styles.rightContainer}>
					<div>
						<div className={styles.title}>文档</div>
						<div className={styles.subTitle}>
							知识库内的所有文件，整个知识库都可以被 AI 助理/子流程/工具进行索引。
						</div>

						<Flex align="center" justify="space-between">
							<Input
								className={styles.searchBar}
								placeholder="搜索"
								onChange={(e) => handleSearch(e.target.value)}
								allowClear
							/>
							<Flex align="stretch" gap={10}>
								<Dropdown
									menu={{
										items: [
											{
												label: (
													<div className={styles.deleteText}>删除</div>
												),
												key: "delete",
												onClick: () => handleBatchDelete(),
											},
										],
									}}
								>
									<Flex align="center" gap={4} className={styles.batchOperation}>
										<div>批量操作</div>
										<IconChevronDown size={16} />
									</Flex>
								</Dropdown>
								<Upload
									multiple
									showUploadList={false}
									beforeUpload={beforeFileUpload}
									disabled={fileUploading}
								>
									<Button type="primary" icon={<IconPlus size={16} />}>
										添加文档
									</Button>
								</Upload>
							</Flex>
						</Flex>
					</div>

					<div className={styles.tableContainer}>
						<Table
							rowKey="code"
							rowSelection={{
								selectedRowKeys,
								onChange: (codes) => setSelectedRowKeys(codes as string[]),
							}}
							columns={columns}
							dataSource={filteredData}
							scroll={{ scrollToFirstRowOnChange: true, y: 400 }}
							pagination={{
								position: ["bottomLeft"],
								total: pageInfo.total,
								pageSize: pageInfo.pageSize,
								showSizeChanger: true,
								showQuickJumper: true,
								pageSizeOptions: ["10", "20", "50"],
								onChange: handlePageChange,
							}}
						/>
					</div>
				</Flex>
			)
		}

		if (currentDetailPage === "setting") {
			return (
				<div className={styles.rightContainer}>
					<Setting
						knowledgeBaseCode={knowledgeBaseCode}
						updateKnowledgeDetail={updateKnowledgeDetail}
					/>
				</div>
			)
		}

		return null
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedRowKeys, columns, filteredData, handleSearch, handleBatchDelete, currentDetailPage])

	return (
		<Flex className={styles.wrapper}>
			<Flex vertical className={styles.leftContainer}>
				<Flex className={styles.header} align="center" gap={14}>
					<MagicIcon
						component={IconChevronLeft}
						size={24}
						className={styles.arrow}
						onClick={handleBack}
					/>
					<div>{t("common.knowledgeDatabase")}</div>
				</Flex>
				{knowledgeDetail && (
					<SubSider
						knowledgeDetail={knowledgeDetail}
						setCurrentDetailPage={setCurrentDetailPage}
					/>
				)}
			</Flex>
			{PageContent}
		</Flex>
	)
}
