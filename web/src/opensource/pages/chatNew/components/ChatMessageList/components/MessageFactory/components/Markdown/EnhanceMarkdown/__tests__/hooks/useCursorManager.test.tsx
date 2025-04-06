import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useCursorManager } from "../../hooks/useCursorManager"
import { findLastElement, manageCursor } from "../../utils"
import { globalCursorManager } from "../../utils/cursor"
import { domCache } from "../../utils/cache"

// 模拟依赖
vi.mock("../../utils", () => ({
	findLastElement: vi.fn((element) => element),
	manageCursor: vi.fn(() => ({
		clearAllCursors: vi.fn(),
		addCursorToElement: vi.fn(),
	})),
}))

vi.mock("../../utils/cache", () => ({
	domCache: {
		getNode: vi.fn(),
		nodes: {
			has: vi.fn(),
			set: vi.fn(),
		},
		clearCache: vi.fn(),
	},
}))

describe("useCursorManager", () => {
	// 测试前准备工作
	beforeEach(() => {
		// 重置所有模拟
		vi.clearAllMocks()

		// 模拟 DOM 元素
		const mockParent = document.createElement("div")
		const mockLastChild = document.createElement("p")
		mockParent.appendChild(mockLastChild)

		// 初始化全局光标管理器为 null，让 hook 初始化它
		globalCursorManager.instance = null

		// 设置 manageCursor 实现
		vi.mocked(manageCursor).mockImplementation(() => ({
			clearAllCursors: vi.fn(),
			addCursorToElement: vi.fn(),
		}))

		// 模拟 DOM 查询
		vi.spyOn(document, "querySelector").mockImplementation((selector: string) => {
			if (selector.includes("test-class")) {
				return mockParent
			}
			return null
		})

		// 模拟 requestAnimationFrame
		vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
			cb(0)
			return 0
		})

		// 模拟 domCache.getNode
		vi.mocked(domCache.getNode).mockImplementation((selector: string) => {
			if (selector.includes("test-class")) {
				return mockParent
			}
			return undefined
		})
	})

	// 测试后清理工作
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it("should initialize cursor manager on mount", () => {
		// Arrange
		const props = {
			content: "",
			isStreaming: false,
			classNameRef: { current: "test-class" },
			cursorClassName: "cursor-class",
		}

		// Act
		renderHook(() => useCursorManager(props))

		// 手动触发 useEffect
		act(() => {
			// 强制触发 React 的副作用
		})

		// Assert
		expect(manageCursor).toHaveBeenCalledWith("cursor-class")
	})

	it("should not add cursor when not streaming", () => {
		// Arrange
		const props = {
			content: "test content",
			isStreaming: false,
			classNameRef: { current: "test-class" },
			cursorClassName: "cursor-class",
		}

		// 提前设置实例，避免初始化效果干扰测试
		globalCursorManager.instance = {
			clearAllCursors: vi.fn(),
			addCursorToElement: vi.fn(),
		}

		// Act
		renderHook(() => useCursorManager(props))

		// Assert
		expect(globalCursorManager.instance?.clearAllCursors).not.toHaveBeenCalled()
		expect(globalCursorManager.instance?.addCursorToElement).not.toHaveBeenCalled()
	})

	it("should add cursor when streaming and content changes", () => {
		// Arrange
		const props = {
			content: "test content",
			isStreaming: true,
			classNameRef: { current: "test-class" },
			cursorClassName: "cursor-class",
		}

		// 提前设置实例，避免初始化效果干扰测试
		globalCursorManager.instance = {
			clearAllCursors: vi.fn(),
			addCursorToElement: vi.fn(),
		}

		// Act
		renderHook(() => useCursorManager(props))

		// Assert
		expect(globalCursorManager.instance?.clearAllCursors).toHaveBeenCalled()
		expect(window.requestAnimationFrame).toHaveBeenCalled()
	})

	it("should handle different element types correctly", () => {
		// Arrange
		const mockParent = document.createElement("div")
		const mockPreElement = document.createElement("pre")
		const mockCodeElement = document.createElement("code")
		mockPreElement.appendChild(mockCodeElement)
		mockParent.appendChild(mockPreElement)

		vi.mocked(domCache.getNode).mockImplementation(() => mockParent)
		vi.spyOn(document, "querySelector").mockImplementation(() => mockParent)

		// 提前设置实例，避免初始化效果干扰测试
		globalCursorManager.instance = {
			clearAllCursors: vi.fn(),
			addCursorToElement: vi.fn(),
		}

		const props = {
			content: "test content",
			isStreaming: true,
			classNameRef: { current: "test-class" },
			cursorClassName: "cursor-class",
		}

		// Act
		renderHook(() => useCursorManager(props))

		// Assert
		expect(findLastElement).toHaveBeenCalled()
	})

	it("should clear cursor when streaming ends", () => {
		// Arrange
		const props = {
			content: "test content",
			isStreaming: true,
			classNameRef: { current: "test-class" },
			cursorClassName: "cursor-class",
		}

		// 提前设置实例，避免初始化效果干扰测试
		globalCursorManager.instance = {
			clearAllCursors: vi.fn(),
			addCursorToElement: vi.fn(),
		}

		// Act
		const { rerender } = renderHook((currentProps) => useCursorManager(currentProps), {
			initialProps: props,
		})

		// Change streaming to false
		act(() => {
			rerender({
				...props,
				isStreaming: false,
			})
		})

		// Assert
		expect(globalCursorManager.instance?.clearAllCursors).toHaveBeenCalled()
	})

	it("should clean up resources on unmount", () => {
		// Arrange
		const props = {
			content: "test content",
			isStreaming: true,
			classNameRef: { current: "test-class" },
			cursorClassName: "cursor-class",
		}

		// 提前设置实例，避免初始化效果干扰测试
		globalCursorManager.instance = {
			clearAllCursors: vi.fn(),
			addCursorToElement: vi.fn(),
		}

		// Act
		const { unmount } = renderHook(() => useCursorManager(props))

		// 确保有内容以触发清理
		vi.mocked(globalCursorManager.instance.clearAllCursors).mockClear()
		act(() => {
			// 更新内容引用
			;(props as any).contentRef = { current: "test content" }
			unmount()
		})

		// Assert
		expect(globalCursorManager.instance?.clearAllCursors).toHaveBeenCalled()
	})
})
