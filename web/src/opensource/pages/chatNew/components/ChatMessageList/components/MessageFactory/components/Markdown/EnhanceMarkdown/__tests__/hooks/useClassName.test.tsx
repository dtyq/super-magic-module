import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { cx } from "antd-style"
import { useClassName } from "../../hooks/useClassName"

// 模拟依赖
vi.mock("antd-style", () => ({
	cx: vi.fn((...args) => args.join(" ")),
}))

describe("useClassName", () => {
	it("应该合并所有样式类名", () => {
		// Arrange
		const mdStyles = {
			root: "root-style",
			a: "a-style",
			blockquote: "blockquote-style",
			code: "code-style",
			details: "details-style",
			header: "header-style",
			hr: "hr-style",
			img: "img-style",
			kbd: "kbd-style",
			list: "list-style",
			p: "p-style",
			pre: "pre-style",
			strong: "strong-style",
			table: "table-style",
			video: "video-style",
			math: "math-style",
		}
		const className = "custom-class"
		const classNameRef = { current: "ref-class" }

		// Act
		const { result } = renderHook(() => useClassName({ mdStyles, className, classNameRef }))

		// Assert
		expect(cx).toHaveBeenCalledWith(
			mdStyles.root,
			mdStyles.a,
			mdStyles.blockquote,
			mdStyles.code,
			mdStyles.details,
			mdStyles.header,
			mdStyles.hr,
			mdStyles.img,
			mdStyles.kbd,
			mdStyles.list,
			mdStyles.p,
			mdStyles.pre,
			mdStyles.strong,
			mdStyles.table,
			mdStyles.video,
			mdStyles.math,
			className,
			classNameRef.current,
		)
		expect(result.current).toContain("root-style")
		expect(result.current).toContain("custom-class")
		expect(result.current).toContain("ref-class")
	})

	it("应该在没有传入自定义className时正常工作", () => {
		// Arrange
		const mdStyles = {
			root: "root-style",
			a: "a-style",
			blockquote: "blockquote-style",
			code: "code-style",
			details: "details-style",
			header: "header-style",
			hr: "hr-style",
			img: "img-style",
			kbd: "kbd-style",
			list: "list-style",
			p: "p-style",
			pre: "pre-style",
			strong: "strong-style",
			table: "table-style",
			video: "video-style",
			math: "math-style",
		}
		const classNameRef = { current: "ref-class" }

		// Act
		const { result } = renderHook(() => useClassName({ mdStyles, classNameRef }))

		// Assert
		expect(result.current).toContain("root-style")
		expect(result.current).toContain("ref-class")
		expect(result.current).not.toContain("undefined")
	})

	it("应该使用记忆化避免不必要的重新计算", () => {
		// Arrange
		const mdStyles = {
			root: "root-style",
			a: "a-style",
			blockquote: "blockquote-style",
			code: "code-style",
			details: "details-style",
			header: "header-style",
			hr: "hr-style",
			img: "img-style",
			kbd: "kbd-style",
			list: "list-style",
			p: "p-style",
			pre: "pre-style",
			strong: "strong-style",
			table: "table-style",
			video: "video-style",
			math: "math-style",
		}
		const classNameRef = { current: "ref-class" }

		// 先清除 cx 的调用历史
		vi.mocked(cx).mockClear()

		// Act
		const { result, rerender } = renderHook((props) => useClassName(props), {
			initialProps: { mdStyles, classNameRef },
		})

		// 记录第一次结果
		const firstResult = result.current

		// 使用相同的引用重新渲染
		rerender({ mdStyles, classNameRef })

		// Assert
		// 虽然重新渲染了，但由于依赖没变化，cx不应该被再次调用
		expect(cx).toHaveBeenCalledTimes(1)
		// 结果应该保持相同
		expect(result.current).toBe(firstResult)
	})
})
