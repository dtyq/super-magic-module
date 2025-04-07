import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { vi, describe, test, expect, beforeEach } from "vitest"
import type { PaginationResponse } from "@/types/request"
import { StructureItemType } from "@/types/organization"
import MagicInfiniteScrollList from "../index"
import type { MagicListItemData } from "../../MagicList/types"

// 模拟InfiniteScroll组件
vi.mock("react-infinite-scroll-component", () => {
	return {
		default: ({ children, next, hasMore }: any) => (
			<div data-testid="infinite-scroll">
				{children}
				{hasMore && (
					<button type="button" onClick={next} data-testid="load-more">
						加载更多
					</button>
				)}
			</div>
		),
	}
})

// 模拟VirtualList组件
vi.mock("rc-virtual-list", () => {
	return {
		default: ({ children, data, onScroll, height }: any) => (
			<div data-testid="virtual-list" style={{ height }}>
				{data.map((item: any) => children(item))}
				<button
					type="button"
					onClick={() => {
						onScroll({
							currentTarget: {
								scrollHeight: 1000,
								scrollTop: 950,
								clientHeight: 400,
							},
						})
					}}
					data-testid="scroll-to-bottom"
				>
					滚动到底部
				</button>
			</div>
		),
	}
})

// 模拟MagicList相关组件和样式
vi.mock("../../MagicList/MagicListItem", () => {
	return {
		default: ({ title, desc, avatar, active, onClick, data }: any) => (
			<div data-testid="magic-list-item" className={active ? "active" : ""} onClick={onClick}>
				{avatar && <div data-testid="avatar">{avatar}</div>}
				<div data-testid="title">
					{typeof title === "string" ? title : data?.title || "title对象"}
				</div>
				{desc && <div data-testid="desc">{desc}</div>}
				{data && <div data-testid="item-data">{data.name}</div>}
			</div>
		),
	}
})

// 模拟MagicEmpty组件
vi.mock("../../base/MagicEmpty", () => {
	return {
		default: () => <div data-testid="empty-state">没有数据</div>,
	}
})

// 模拟antd组件
vi.mock("antd", async () => {
	const antd = await vi.importActual("antd")
	return {
		...antd,
		List: ({ children, style, className }: any) => (
			<div data-testid="ant-list" className={className} style={style}>
				{children}
			</div>
		),
		Divider: ({ children, plain }: any) => (
			<div data-testid="ant-divider" className={plain ? "plain" : ""}>
				{children}
			</div>
		),
		Flex: ({ children, align, gap, justify, onClick }: any) => (
			<div
				data-testid="ant-flex"
				style={{
					display: "flex",
					alignItems: align,
					gap,
					justifyContent: justify,
				}}
				onClick={onClick}
			>
				{children}
			</div>
		),
		Checkbox: ({ checked, disabled, onChange }: any) => (
			<input
				type="checkbox"
				data-testid="ant-checkbox"
				checked={checked}
				disabled={disabled}
				onChange={(e) => onChange?.(e.target.checked)}
			/>
		),
		Spin: ({ size }: any) => (
			<div data-testid="ant-spin" className={size}>
				加载中...
			</div>
		),
	}
})

// 模拟i18n
vi.mock("react-i18next", () => ({
	useTranslation: () => {
		return {
			t: (str: string) => str,
			i18n: {
				changeLanguage: () => new Promise(() => {}),
			},
		}
	},
}))

vi.mock("antd-style", () => {
	return {
		createStyles: (fn: any) => {
			// 提供在styles.ts中需要的token值
			const token = {
				magicColorScales: { grey: [0, 1, 2, 3, 4, 5] },
				magicColorUsages: {
					text: [0, 1, 2, 3, 4, 5],
					primaryLight: { default: "#e6f7ff" },
					white: "#ffffff",
				},
			}
			return () => fn({ css: () => ({}), isDarkMode: false, token })
		},
		cx: (...args: any[]) => args.join(" "),
		css: (literals: TemplateStringsArray, ...placeholders: any[]) =>
			literals.reduce((acc, literal, i) => acc + literal + (placeholders[i] || ""), ""),
	}
})

// 清理所有模拟
beforeEach(() => {
	vi.clearAllMocks()
})

// 测试数据类型
interface TestItem {
	id: string
	name: string
}

// 创建模拟数据
const createMockData = (count: number, startId = 0): TestItem[] => {
	return Array.from({ length: count }, (_, i) => ({
		id: `test-${i + startId}`,
		name: `测试项 ${i + startId}`,
	}))
}

// 创建模拟分页响应
const createMockPaginationResponse = (
	items: TestItem[],
	hasMore = true,
	pageToken = "next-page",
): PaginationResponse<TestItem> => {
	return {
		items,
		has_more: hasMore,
		page_token: pageToken,
	}
}

// 数据转换函数
const mockItemsTransform = (item: unknown): MagicListItemData => {
	const typedItem = item as TestItem
	return {
		id: typedItem.id,
		title: typedItem.name,
		name: typedItem.name,
	}
}

describe("MagicInfiniteScrollList", () => {
	// 在每个测试前重置所有模拟
	beforeEach(() => {
		vi.clearAllMocks()
	})

	test("渲染空状态", async () => {
		const mockTrigger = vi.fn().mockResolvedValue(createMockPaginationResponse([]))

		act(() => {
			render(
				<MagicInfiniteScrollList
					data={createMockPaginationResponse([])}
					trigger={mockTrigger}
					itemsTransform={mockItemsTransform}
				/>,
			)
		})

		// 等待异步操作完成
		await waitFor(() => {
			expect(screen.getByTestId("empty-state")).toBeInTheDocument()
		})
	})

	test("渲染自定义空状态", async () => {
		const customEmptyState = <div data-testid="custom-empty">自定义空状态</div>
		const mockTrigger = vi.fn().mockResolvedValue(createMockPaginationResponse([]))

		act(() => {
			render(
				<MagicInfiniteScrollList
					data={createMockPaginationResponse([])}
					trigger={mockTrigger}
					itemsTransform={mockItemsTransform}
					noDataFallback={customEmptyState}
				/>,
			)
		})

		// 等待异步操作完成
		await waitFor(() => {
			expect(screen.getByTestId("custom-empty")).toBeInTheDocument()
		})
	})

	test("渲染数据列表", () => {
		const mockData = createMockData(3)
		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, false)}
				trigger={vi.fn()}
				itemsTransform={mockItemsTransform}
			/>,
		)

		const listItems = screen.getAllByTestId("magic-list-item")
		expect(listItems).toHaveLength(3)
		expect(listItems[0]).toHaveTextContent("测试项 0")
	})

	test("点击列表项触发回调", () => {
		const mockData = createMockData(3)
		const onItemClick = vi.fn()
		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, false)}
				trigger={vi.fn()}
				itemsTransform={mockItemsTransform}
				onItemClick={onItemClick}
			/>,
		)

		const listItems = screen.getAllByTestId("magic-list-item")
		fireEvent.click(listItems[1])
		expect(onItemClick).toHaveBeenCalledWith(expect.objectContaining({ id: "test-1" }))
	})

	test("触发加载更多", async () => {
		const mockTrigger = vi
			.fn()
			.mockResolvedValue(createMockPaginationResponse(createMockData(3, 3), false))
		const mockData = createMockData(3)

		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, true)}
				trigger={mockTrigger}
				itemsTransform={mockItemsTransform}
			/>,
		)

		const scrollButton = screen.getByTestId("scroll-to-bottom")
		fireEvent.click(scrollButton)

		await waitFor(() => {
			expect(mockTrigger).toHaveBeenCalledWith({ page_token: "next-page" })
		})

		await waitFor(() => {
			const listItems = screen.getAllByTestId("magic-list-item")
			expect(listItems).toHaveLength(6)
		})
	})

	test("禁用加载更多功能", async () => {
		const mockTrigger = vi
			.fn()
			.mockResolvedValue(createMockPaginationResponse(createMockData(3, 3), true))
		const mockData = createMockData(3)

		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, true)}
				trigger={mockTrigger}
				itemsTransform={mockItemsTransform}
				disableLoadMore
			/>,
		)

		const scrollButton = screen.getByTestId("scroll-to-bottom")
		fireEvent.click(scrollButton)

		// 等待一小段时间后验证没有触发加载
		await new Promise((r) => {
			setTimeout(r, 100)
		})
		expect(mockTrigger).not.toHaveBeenCalled()
	})

	test("自定义加载指示器", async () => {
		const mockTrigger = vi.fn().mockImplementation(() => {
			// 使用setTimeout和Promise.resolve绕过Promise executor警告
			setTimeout(() => {}, 0)
			return Promise.resolve(createMockPaginationResponse(createMockData(3, 3), false))
		})

		const customLoadingIndicator = <div data-testid="custom-loading">自定义加载中...</div>

		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(createMockData(3), true)}
				trigger={mockTrigger}
				itemsTransform={mockItemsTransform}
				loadingIndicator={customLoadingIndicator}
			/>,
		)

		const scrollButton = screen.getByTestId("scroll-to-bottom")
		fireEvent.click(scrollButton)

		await waitFor(() => {
			expect(screen.getByTestId("custom-loading")).toBeInTheDocument()
		})
	})

	test("自定义项目高度", () => {
		const mockData = createMockData(3)
		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, false)}
				trigger={vi.fn()}
				itemsTransform={mockItemsTransform}
				itemHeight={80}
			/>,
		)

		const virtualList = screen.getByTestId("virtual-list")
		expect(virtualList).toBeInTheDocument()
	})

	test("自定义容器高度", () => {
		const mockData = createMockData(3)
		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, false)}
				trigger={vi.fn()}
				itemsTransform={mockItemsTransform}
				containerHeight={600}
			/>,
		)

		const virtualList = screen.getByTestId("virtual-list")
		expect(virtualList).toHaveAttribute("style", expect.stringContaining("height: 600px"))
	})
})

// 检查复选框功能
describe("MagicInfiniteScrollList 复选框功能", () => {
	test("渲染复选框", () => {
		const mockData = createMockData(3)
		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, false)}
				trigger={vi.fn()}
				itemsTransform={mockItemsTransform}
				checkboxOptions={{
					checked: [],
					onChange: vi.fn(),
					dataType: StructureItemType.User,
				}}
			/>,
		)

		const checkboxes = screen.getAllByTestId("ant-checkbox")
		expect(checkboxes).toHaveLength(3)
	})

	test("复选框选中/取消选中", () => {
		const mockData = createMockData(3)
		const onChange = vi.fn()
		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, false)}
				trigger={vi.fn()}
				itemsTransform={mockItemsTransform}
				checkboxOptions={{
					checked: [],
					onChange,
					dataType: StructureItemType.User,
				}}
			/>,
		)

		const flexItems = screen.getAllByTestId("ant-flex")
		fireEvent.click(flexItems[0])

		expect(onChange).toHaveBeenCalledWith([
			expect.objectContaining({
				id: "test-0",
				dataType: StructureItemType.User,
			}),
		])
	})

	test("禁用的复选框", () => {
		const mockData = createMockData(3)
		const onChange = vi.fn()
		render(
			<MagicInfiniteScrollList
				data={createMockPaginationResponse(mockData, false)}
				trigger={vi.fn()}
				itemsTransform={mockItemsTransform}
				checkboxOptions={{
					checked: [],
					onChange,
					disabled: [{ id: "test-1", dataType: StructureItemType.User }],
					dataType: StructureItemType.User,
				}}
			/>,
		)

		const checkboxes = screen.getAllByTestId("ant-checkbox")
		expect(checkboxes[1]).toHaveAttribute("disabled")
	})
})
